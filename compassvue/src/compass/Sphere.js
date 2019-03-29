import {PaintObj, degToRad, coordCarte, circleShape, genVertices} from './PaintObj'
import {states, uniforms, attributes} from './Variables'
/**
* Sphere Object
* 绘制参考球。绘制模式有 1. 球面 2. 线条 3.少数线条 等模式
**/
class Sphere extends PaintObj{
  MODE_SURFACE = 0;
  MODE_LINE = 1;
  MODE_LESSLINE = 2;

  DEFAULT_RADIUS = 4;

  constructor(props) {
    super(props);
    this.type = "Sphere";
    this.vn = props.vn || 48;
    this.hn = (props.hn || 48) * 0.5;
    this.size = props.size || this.DEFAULT_RADIUS; // default radius
    this.drawMode = this.MODE_SURFACE;
    this.line_alpha = 0.65;
    this.alpha = props.alpha || 0.25;
    this.setSize();
    // this.visible = false;
  }

  init() {
    var res = this.getVertex();
    var index = this.getIndex();

    // vertex info，static_draw is enough for both vertex and index now
    this.vertexBuffer    = this.createArrayBuffer(new Float32Array(res.vertices),     states.gl.STATIC_DRAW);
    this.indexBuffer     = this.createArrayBuffer(new Uint16Array(index.vertex_index), states.gl.STATIC_DRAW);
    this.lineIndexBuffer = this.createArrayBuffer(new Uint16Array(index.line_index), states.gl.STATIC_DRAW);
    this.lessLineIndexBuffer = this.createArrayBuffer(new Uint16Array(index.less_line_index), states.gl.STATIC_DRAW);
    this.lessLSIndexBuffer = this.createArrayBuffer(new Uint16Array(index.less_ls_index), states.gl.STATIC_DRAW);
  }


  paint() {
    states.gl.bindBuffer(states.gl.ARRAY_BUFFER, this.vertexBuffer);
    states.gl.vertexAttribPointer(attributes.vertex_position, 3, states.gl.FLOAT, false, 6 * 4, 0);
    states.gl.vertexAttribPointer(attributes.vertex_normal,   3, states.gl.FLOAT, false, 6 * 4, 0);
    states.gl.vertexAttribPointer(attributes.color,           3, states.gl.FLOAT, false, 6 * 4, 3 * 4);

    states.gl.uniformMatrix4fv(uniforms.m_matrix, false, this.mMatrix);
    states.gl.uniformMatrix4fv(uniforms.pmv_matrix, false, this.mvpMatrix);
    switch (this.drawMode) {
      case this.MODE_LINE:
        states.gl.uniform1f(uniforms.alpha, this.line_alpha);          //  set alpha value
        states.gl.bindBuffer(states.gl.ELEMENT_ARRAY_BUFFER, this.lineIndexBuffer);
        states.gl.drawElements(states.gl.LINES, this.lineIndexBuffer.numItems, states.gl.UNSIGNED_SHORT, 0);
        break;
      case this.MODE_LESSLINE:
        states.gl.uniform1f(uniforms.alpha, this.line_alpha);          //  set alpha value
        states.gl.bindBuffer(states.gl.ELEMENT_ARRAY_BUFFER, this.lessLineIndexBuffer);
        states.gl.drawElements(states.gl.LINES, this.lessLineIndexBuffer.numItems, states.gl.UNSIGNED_SHORT, 0);
        // the surface on which equator lies
        states.gl.bindBuffer(states.gl.ELEMENT_ARRAY_BUFFER, this.lessLSIndexBuffer);
        states.gl.drawElements(states.gl.TRIANGLES, this.lessLSIndexBuffer.numItems, states.gl.UNSIGNED_SHORT, 0);
        break;
      case this.MODE_SURFACE:
      default:
        states.gl.uniform1f(uniforms.alpha, this.alpha);
        states.gl.bindBuffer(states.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        states.gl.drawElements(states.gl.TRIANGLES, this.indexBuffer.numItems, states.gl.UNSIGNED_SHORT, 0);
        break;
    }
  }

  onViewChanged(matrix) {
    this.pvMatrix = matrix || this.pvMatrix;
    mat4.mul(this.mvpMatrix, this.pvMatrix, this.mMatrix);
  }

  setSize(size) {
    if(size)
      this.size = size;
    else
      this.size = this.DEFAULT_RADIUS;

    vec3.set(this.vscale, this.size, this.size, this.size);
    mat4.fromScaling(this.mMatrix, this.vscale);
    this.onViewChanged();
  }

  setDrawMode(mode) {
    this.drawMode = mode;
  }

  setAlpha(alpha) {
    this.alpha = alpha;
  }

  /**
   * 计算得到球面的所有顶点的位置
   * 先绘制经线，后绘制纬线
   * @returns 返回所有类型的顶点个数
   */
  getVertex() {
    var vertices = [];
    var vertex = [];
    //    var vn = [];        // 顶点法向量数组，当球心在原点时，与顶点坐标相同
    var i, j, k;

    // i indicates vertical line while j indicates horizontal line,
    // vertical line is half a circle, so the number should be 1 more
    for (j = 0; j <= this.vn; j++) {
      for (i = 0; i <= this.hn; i++) {
        // (n+1)*n points are needed
        k = coordCarte(degToRad(i * 180 / this.hn), degToRad(j * 360 / this.vn), 1);
        vertex = vertex.concat(k[0], k[1], k[2]);
      }
    }
    // add origin point into array
    vertex = vertex.concat([0, 0, 0]);
    vertices = genVertices(vertex, this.color);

    return {
      "vertices": vertices
    }
  }

  // 获取绘制球面时需要的顶点索引
  getIndex() {
    var vertexIndex = []; // surfaceDrawMode  绘制时所用的索引
    var lineIndex = []; // lineDrawMode     绘制时所用的索引
    var lessLineIndex = []; // lessLineDrawMode 绘制时所用的索引
    var lessLSIndex = [];
    var i = 0, j = 0;

    for (j = 0; j < this.vn; j++) {  // the last half circle (j = 0) overlaps the first one (j = 0)
      for (i = 0; i < this.hn + 1; i++) {
        // for line mode index
        lineIndex.push(
          i + j * (this.hn + 1),
          i + 1 + j * (this.hn + 1),
          i + j * (this.hn + 1),
          i + (j + 1) * (this.hn + 1)
        );

        // for surface mode index
        vertexIndex.push(
          i + j * (this.hn + 1),        // 0
          i + 1 + j * (this.hn + 1),      // 1
          i + 1 + (j + 1) * (this.hn + 1)   // n+1
        );
        vertexIndex.push(
          i + j * (this.hn + 1),            // 0
          i + 1 + (j + 1) * (this.hn + 1),      // n+1
          i + (j + 1) * (this.hn + 1)         // n
        );
      }
    }
    for (i = 0; i < this.hn + 1; i++) {
      // 绘出 4 条经线
      j = 0;
      lessLineIndex.push(i + j * (this.hn + 1), i + 1 + j * (this.hn + 1));
      j = 0.25 * this.vn;
      lessLineIndex.push(i + j * (this.hn + 1), i + 1 + j * (this.hn + 1));
      j = 0.5 * this.vn;
      lessLineIndex.push(i + j * (this.hn + 1), i + 1 + j * (this.hn + 1));
      j = 0.75 * this.vn;
      lessLineIndex.push(i + j * (this.hn + 1), i + 1 + j * (this.hn + 1));
    }
    for (j = 0; j < this.vn; j++) {
      i = this.hn / 2;
      lessLineIndex.push(i + j * (this.hn + 1), i + (j + 1) * (this.hn + 1)); // equator line
    }
    // 赤道所在平面
    for (j = this.vn * 0.5; j < this.vn * 0.75; j++) {
      // 原点 -- 赤道上的点 -- 赤道上的点
      lessLSIndex.push((this.vn + 1) * (this.hn + 1));   // origin point
      lessLSIndex.push(this.hn * 0.5 + j * (this.hn + 1));
      lessLSIndex.push(this.hn * 0.5 + (j + 1) * (this.hn + 1));
      lessLSIndex.push((this.vn + 1) * (this.hn + 1));   // origin point
      lessLSIndex.push(this.hn * 0.5 + (j + 1) * (this.hn + 1));
      lessLSIndex.push(this.hn * 0.5 + j * (this.hn + 1));
    }

    //        this.vertex_index = vertexIndex;
    //        this.line_index   = lineIndex;
    //        this.less_line_index = lessLineIndex;
    //        this.less_ls_index   = lessLSIndex;
    return {
      vertex_index: vertexIndex,
      line_index: lineIndex,
      less_line_index: lessLineIndex,
      less_ls_index: lessLSIndex
    }
  }
}

// end of Sphere prototype


/**
* ReferenceCircle Object (球面上的参考圆圈)
* 通过该对象管理分离的 26 个不同的 circle。但为了节省内存占用和
* 减少绑定的缓冲区的次数，实际上只存储了一个 Circle 的 buffer，
* 利用模型变换矩阵绘制出 26 个圆圈。
**/
class RefCircle extends PaintObj{
  constructor(props) {
    props = props || {};
    super(props);
    this.dis = props.dis || 4;
    this.visible = false;
    var circles = [];
    var red = [1.0, 0.0, 0.0];
    var green = [0.0, 1.0, 0.0];
    var blue = [0.0, 0.0, 1.0];
    var i = 0, j = 0, k = 0;
    circles[k] = new ReferCircle({ "pos": [0, 0, this.dis], color: green, gl: states.gl });
    k++;
    for (i = 0; i <= 2; i++) {
      for (j = 0; j < 8; j++) {
        if (i === 1 && j % 2 === 0) {
          circles[k] = new ReferCircle({ "pos": [(i + 1) * 45, j * 45, this.dis], color: green, gl: states.gl });
        }
        else {
          circles[k] = new ReferCircle({ "pos": [(i + 1) * 45, j * 45, this.dis], color: blue, gl: states.gl });
        }
        k++;
      }
    }
    circles[k] = new ReferCircle({ "pos": [4 * 45, 0, this.dis], color: green, gl: states.gl });
    this.circles = circles;
    this.setScale(props.size || 1);
    this.init();
  }

  
  init() {
    var initSize = 1;
    var vertex = circleShape(initSize, this.sides, 0, Math.PI * 2);
    var vertices = genVertices(vertex, this.color, vertex);

    var i = 0;
    var index = [];
    for (i = 1; i < this.sides + 1; i++) {
      index.push(i);
    }
    this.vertexBuffer = this.createArrayBuffer(new Float32Array(vertices), states.gl.STATIC_DRAW);
    this.indexBuffer = this.createArrayBuffer(new Uint16Array(index), states.gl.STATIC_DRAW);
  }

  paint() {
    if (!this.visible) {
      return;
    }
    states.gl.uniform1f(uniforms.alpha, this.alpha);
    states.gl.uniform1i(uniforms.specColor, 1);

    states.gl.bindBuffer(states.gl.ARRAY_BUFFER, this.vertexBuffer);
    states.gl.vertexAttribPointer(attributes.vertex_position, 3, states.gl.FLOAT, false, 9 * 4, 0);
    states.gl.vertexAttribPointer(attributes.vertex_normal, 3, states.gl.FLOAT, false, 9 * 4, 3 * 4);
    states.gl.vertexAttribPointer(attributes.color, 3, states.gl.FLOAT, false, 9 * 4, 6 * 4);

    states.gl.bindBuffer(states.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    for (var i = 0; i < 26; i++) {
      //            this.circles[i].paint();
      //        states.gl.uniformMatrix4fv( uniforms.m_matrix, false, this.mMatrix );
      states.gl.uniform3fv(uniforms.vertexColor, this.circles[i].color);
      states.gl.uniformMatrix4fv(uniforms.pmv_matrix, false, this.circles[i].mvpMatrix);
      states.gl.drawElements(this.circles[i].drawMode, this.sides, states.gl.UNSIGNED_SHORT, 0);
    }
    states.gl.uniform1i(uniforms.specColor, 0);
  }

  onViewChanged(matrix) {
    for (var i = 0; i < 26; i++) {
      this.circles[i].onViewChanged(matrix);
    }
  }

  setDis(dis) {
    this.dis = dis;
    for (var i = 0; i < 26; i++) {
      this.circles[i].setTranslation(this.dis + 0.1);
    }
  }

  setScale(size) {
    //        this.size = size;
    for (var i = 0; i < 26; i++) {
      this.circles[i].setScale(size);
    }
  }

  onSphericalChanged(params) {
    for (var i = 0; i < 26; i++) {
      //            this.circles[i].current = false;
      this.circles[i].isCurrent(params);
    }
  }
}


/**
* 参考圆圈
* 为节省内存和提高性能，该类不再存储圆圈的顶点缓冲区。
* 实际上该类存储的只是每个圆圈的位置等信息。
* 在 SensorPoint 移动时检测 SensorPoint 是否与当前圆圈相近，
* 若距离很近则会改变绘制方式。
**/
class ReferCircle extends PaintObj{
  constructor(props) {
    super(props);
    this.type = "RCircle";
    if (props.pos !== undefined) {
      this.setTranslation(props.pos[2], degToRad(props.pos[0]), degToRad(props.pos[1]));
      this.setQuat(props.pos[0], props.pos[1]);
    }
    this.current = false;
    this.drawMode = states.gl.LINES;
    //    this.init();
  }
  
  onViewChanged(matrix) {
    this.pvMatrix = matrix || this.pvMatrix;
    mat4.fromRotationTranslationScale(this.mMatrix, this.quat, this.translation, this.vscale);
    mat4.mul(this.mvpMatrix, this.pvMatrix, this.mMatrix);
  }

  setTranslation(r, theta, phi) {
    if (theta !== undefined) {
      this.theta = theta;
    }

    if (phi !== undefined) {
      this.phi = phi;
    }

    this.translation = coordCarte(this.theta, this.phi, r);
    this.onViewChanged();
  }

  setQuat(a_theta, a_phi, a_beta) {
    quat.fromEuler(this.quat, 0, a_theta, a_phi);
    this.onViewChanged();
  }

  setScale(size) {
    this.size = size;
    this.vscale = vec3.fromValues(size, size, size);
    this.onViewChanged();
  }

  // 判断 Sensor point 是否接近该圆圈。（目前只考虑 theta 和 phi 角而不是计算两个圆心的距离）
  isCurrent(spherical) {
    if (Math.abs(spherical.theta - this.theta) < Math.PI * 0.02
      && Math.abs(spherical.phi - this.phi) < Math.PI * 0.02) {
      this.current = true;
      var size = spherical.size * 1.15;
      vec3.set(this.vscale, size, size, size);
      this.originColor = new Float32Array(this.color);
      this.color = [1.0, 0.0, 0.0];
      this.drawMode = states.gl.LINE_LOOP;
    } else if (this.current) {
      this.current = false;
      vec3.set(this.vscale, this.size, this.size, this.size);
      this.color = this.originColor;
      this.drawMode = states.gl.LINES;
    }
    this.onViewChanged();
  }
}
// end of ReferCircle prototype

export {Sphere, RefCircle};