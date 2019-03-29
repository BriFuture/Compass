import {PaintObj, cylinderShape, genVertices, coordCarte, degToRad} from './PaintObj'
import {states, attributes, uniforms} from './Variables'

/**
* SensorPoint Object
* 在三维空间中绘制斑点，用于模拟传感器的指向。
* 当指向变化时会通知注册的回调函数，以便其它对象可以得到最新的传感器位置
* 尚未实现的功能：
* - 从原点指向 Point 的圆锥体
**/
class SensorPoint extends PaintObj {
  constructor(props) {
    // PaintObj.call(this, props);
    super(props);
    this.type = "SensorPoint";
    // the reason why rotation and then translation is out of expections
    // but if rMatrix is introduced, the result seems good
    // now all vertices are calculated by function, no need for rMatrix
    // this.rMatrix  = mat4.create();
    this.inv_color = props.inv_color || [0.0, 1.0, 0.0];
    this.dis = 4;
    this.pitch = 0;
    this.heading = 0;
    this.headingOffset = 0;
    this.roll = 0;
    this.callbacks = [];
  }
  
  init() {
    var cylinder = cylinderShape(this.size, this.sides, 0.01);

    var vertex = cylinder.vertex;
    var index = cylinder.index;

    var i = 0;
    var color = [];
    for (i = 0; i <= this.sides; i++) {
      color = color.concat(this.inv_color);
    }
    for (i = 0; i <= this.sides; i++) {
      color = color.concat(this.color);
    }

    var vertices = genVertices(vertex, color, [0, 1, 1]);
    this.index_count = index.length;

    this.vertexBuffer = this.createArrayBuffer(new Float32Array(vertices), states.gl.STATIC_DRAW);
    this.indexBuffer  = this.createArrayBuffer(new Uint16Array(index), states.gl.STATIC_DRAW);
  }

  paint() {
    states.gl.bindBuffer(states.gl.ARRAY_BUFFER, this.vertexBuffer);
    states.gl.vertexAttribPointer(attributes.vertex_position, 3, states.gl.FLOAT, false, 9 * 4, 0);
    states.gl.vertexAttribPointer(attributes.color, 3, states.gl.FLOAT, false, 9 * 4, 3 * 4);
    states.gl.vertexAttribPointer(attributes.vertex_normal, 3, states.gl.FLOAT, false, 9 * 4, 6 * 4);

    states.gl.uniform1f(uniforms.alpha, this.alpha);          //  set alpha value

    states.gl.uniformMatrix4fv(uniforms.m_matrix, false, this.mMatrix);
    states.gl.uniformMatrix4fv(uniforms.pmv_matrix, false, this.mvpMatrix);

    states.gl.bindBuffer(states.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    states.gl.drawElements(states.gl.TRIANGLES, this.index_count, states.gl.UNSIGNED_SHORT, 0);
  }

  onViewChanged(matrix) {
    this.pvMatrix = matrix || this.pvMatrix;
    mat4.mul(this.mvpMatrix, this.pvMatrix, this.mMatrix);
  }

  setScale(size) {
    this.size = size;
    vec3.set(this.vscale, size, size, size);
    this.update();
  }

  /**
   * 
   * @param {*} r  中心点与原点的距离
   * @param {*} a_theta  角度制（与Z轴正半轴的夹角）
   * @param {*} a_phi    角度制（与X轴正半轴的夹角）
   */
  setTranslation(r, a_theta, a_phi) {
    this.translation = coordCarte(degToRad(a_theta), degToRad(a_phi), r);
    quat.fromEuler(this.quat, 0, a_theta, a_phi);
    this.update();
  }

  /**
   * 根据给定的参数更新俯仰角，航向角，中心点与原点的距离等
   * @param {*} params  
   * dis  中心点与原点的距离
   * pitch 俯仰角（与X轴平面的夹角，在 Z 轴正向一侧为正）
   * heading 航向角（在 XOY 平面上的投影与X轴正半轴的夹角）
   * roll 横滚角。对于 SensorPoint 对象来说没有作用
   */
  setParam(params) {

    this.dis = params.dis || this.dis;
    if(params.pitch) {
      this.pitch = params.pitch;
    }
    if(params.heading) {
      this.heading = params.heading;
      params.heading = params.heading - this.headingOffset;
    }
    if(params.roll) {
      this.roll = params.roll;
    }
    var theta = 90 - this.pitch;
    this.setTranslation(this.dis, theta, this.heading);
  }

  /**
    * 更新自身的模型视图矩阵并通知已注册的回调函数
  **/
  update() {
    mat4.fromRotationTranslationScale(this.mMatrix,
      this.quat,
      this.translation,
      this.vscale);
    this.onViewChanged();

    var spherical = this.spherical();
    for (var i = 0; i < this.callbacks.length; i++) {
      this.callbacks[i].onSphericalChanged({
        dis: this.dis, pitch: this.pitch, heading: this.heading,
        roll: this.roll, theta: spherical[0], phi: spherical[1],
        size: this.size
      });
    }
  }

  /**
    * 注册回调函数
  **/
  addSphericalChange(cb) {
    this.callbacks.push(cb);
  }

  /**
  * @param {Number} pitch   range [-90, 90]
  * @param {Number} heading range [0, 360]
  * @returns {Vec3} the angle returned is in unit of rad  vec[0] and vec[1] is in unit of RAD
  *  当前指向的球坐标系坐标
  */
  spherical() {
    var u = (90 - this.pitch) / 180 * Math.PI;
    var v = this.heading / 180 * Math.PI;
    return vec3.fromValues(u, v, this.dis);
  }

  // 重置指向
  reset() {
    this.headingOffset += this.heading;
    //        console.log( this.heading, this.headingOffset );
    this.setParam({ pitch: this.pitch, heading: this.heading, roll: this.roll, dis: this.dis });
  }
}
// end of SensorPoint prototype

/**
* SensorPath Object
* 1. 绘制传感器的路径，由于绘制路径采用的是记录传感器位置周围点的方法。因此很可能在运行过程中出现缓冲区被用完的情况，
* 会自动申请新的缓冲区，记录的点越多，需要的缓冲区越多。
* 2. 每申请一次约占用 90k 的内存（或显存）。另外 js 数组中保存的数据也会占用内存，所以根据已写入缓冲区的数据量进行
* 偏移，对之后的缓冲区进行写操作，不在 js 数组中保留所有的点。
* 3. 18.03.03 将路径绘制成虚线的绘制方法存在问题。因此路径每隔 gap 段绘制一次并没有实现，调整 gap 不会
* 影响路径的绘制。（即路径以实线形式绘制）
**/
class SensorPath extends PaintObj{
  MaxPathNum = 4800 * 12
  constructor(props) {
    super(props);
    this.type = "SensorPath";
    this.all_index_count = 0;
    this.cur_path_count = 0;
    this.cur_index_count = 0;
    this.cur_pi = 0; // path index
    this.buffer_path_bytes = this.MaxPathNum * 4; // 4 means the bytes float occupies, 3 means a point contains 3 coordinate
    this.buffer_index_bytes = this.MaxPathNum * 2; // 2 means the bytes uint  occupies
    this.gap = 1; // must equal or greater then 1
    this.pg = 1; // path gap count
    this.init();
  }

  
  init() {
    this.angle = this.last_point;
    this.path = [];
    this.index = [];

    // path buffer initialization
    this.buffers.path = [];
    this.buffers.index = [];

    this.createBuffer();
  }

  paint() {
    if (!this.visible) {
      return;
    }
    states.gl.uniform1f(uniforms.alpha, this.alpha);     // set alpha value
    states.gl.uniformMatrix4fv(uniforms.m_matrix, false, this.mMatrix);
    states.gl.uniformMatrix4fv(uniforms.pmv_matrix, false, this.mvpMatrix);

    // 分批绘制路径
    for (var i = 0; i < this.cur_pi; i++) {
      states.gl.bindBuffer(states.gl.ARRAY_BUFFER, this.buffers.path[i]);
      states.gl.vertexAttribPointer(attributes.vertex_normal, 3, states.gl.FLOAT, false, 6 * 4, 0);
      states.gl.vertexAttribPointer(attributes.vertex_position, 3, states.gl.FLOAT, false, 6 * 4, 0);
      states.gl.vertexAttribPointer(attributes.color, 3, states.gl.FLOAT, false, 6 * 4, 3 * 4);
      states.gl.bindBuffer(states.gl.ELEMENT_ARRAY_BUFFER, this.buffers.index[i]);
      states.gl.drawElements(states.gl.TRIANGLES, this.MaxPathNum, states.gl.UNSIGNED_SHORT, 0);
    }
    if (this.cur_index_count > 0) {
      //            console.log( this.cur_index_count );
      states.gl.bindBuffer(states.gl.ARRAY_BUFFER, this.buffers.path[this.cur_pi]);
      states.gl.vertexAttribPointer(attributes.vertex_normal, 3, states.gl.FLOAT, false, 6 * 4, 0);
      states.gl.vertexAttribPointer(attributes.vertex_position, 3, states.gl.FLOAT, false, 6 * 4, 0);
      states.gl.vertexAttribPointer(attributes.color, 3, states.gl.FLOAT, false, 6 * 4, 3 * 4);
      states.gl.bindBuffer(states.gl.ELEMENT_ARRAY_BUFFER, this.buffers.index[this.cur_pi]);
      states.gl.drawElements(states.gl.TRIANGLES, this.cur_index_count, states.gl.UNSIGNED_SHORT, 0);
    }
  }

  onViewChanged(matrix) {
    this.pvMatrix = matrix || this.pvMatrix;
    mat4.mul(this.mvpMatrix, this.pvMatrix, this.mMatrix);
  }

  /**
    * @param nangle next sphericalCoord
    * @param langle last sphericalCoord
    */
  updateBuffer(nangle) {
    var langle = [this.last_point.theta, this.last_point.phi, this.last_point.dis];
    var presult = this.getLinearPoint(nangle, langle);
    this.all_index_count += presult.index.length;

    this.subBuffer(this.buffers.path[this.cur_pi], this.cur_path_count * 4, new Float32Array(presult.vertices));
    this.subBuffer(this.buffers.index[this.cur_pi], this.cur_index_count * 2, new Uint16Array(presult.index));

    // Note! because the updateSubBuffer() should use the offset as the parameter,
    // the addition of path or index count should be later, or the buffer will be out of its size
    this.cur_path_count += presult.vertices.length;
    this.cur_index_count += presult.index.length;

    // when path index count is greater or equal to this.MaxPathNum, then a new buffer should be realloced
    // and the counter should be reset
    if (this.cur_index_count >= this.MaxPathNum) {
      this.cur_pi++;
      console.log("Info: [Path] create a new buffer!\n");
      this.createBuffer();
      this.resetCurrentPath();
    }
  }

  setGap(gap) {
    this.gap = gap;
  }

  setSize(size) {
    this.size = size;
  }

  /**
   * 用于绘制路径所需的顶点和索引, 每次返回 4 个顶点
   * @param {Array} p     p[0] = theta    p[1] = beta    p[2] = radius
   * @param {Array} lp   lp[0] = theta   lp[1] = beta   lp[2] = lradius
   * @return {Object}
   */
  getLinearPoint(p, lp) {
    var s1 = coordCarte(p[0], p[1], p[2]);
    var s2 = coordCarte(lp[0], lp[1], lp[2]);
    var s = [s1[0] - s2[0], s1[1] - s2[1], s1[2] - s2[2]];
    //    console.log("s1: "+ s1 + "  s2: "+s2 + "  s: " + s +"\n");
    var n0 = coordCarte((p[0] + lp[0]) * 0.5, (p[1] + lp[1]) * 0.5, p[2]);
    var l = vec3.create();
    vec3.cross(l, s, n0);
    vec3.normalize(l, l);
    vec3.scale(l, l, this.size * 0.02);
    //    console.log("vec l: " + vec3.str(l));

    var vertex;
    var vertices = [];
    var that = this;

    var pushVertex = function () {
      vertices = vertices.concat(vertex);
      vertices = vertices.concat(that.color);
    }

    vertex = [s1[0] - l[0], s1[1] - l[1], s1[2] - l[2]];   // 0
    pushVertex();
    vertex = [s1[0] + l[0], s1[1] + l[1], s1[2] + l[2]];   // 1
    pushVertex();
    vertex = [s2[0] - l[0], s2[1] - l[1], s2[2] - l[2]];   // 2
    pushVertex();
    vertex = [s2[0] + l[0], s2[1] + l[1], s2[2] + l[2]];   // 3
    pushVertex();
    // until now, vertices length should be 24

    var index = [];
    var seg = 6;
    var n = this.cur_path_count / seg;  // it is better than index.length
    index.push(n + 0, n + 2, n + 3, n + 0, n + 3, n + 1);
    index.push(n + 0, n + 3, n + 2, n + 0, n + 1, n + 3);

    return {
      //            "point" : linearPoint,
      //            "color" : color,
      "vertices": vertices,
      "index": index,
    }
  }

  onSphericalChanged(params) {
    if (this.last_point === undefined) {
      this.last_point = params;
      //            return;
    }

    var lpos = coordCarte(this.last_point.theta, this.last_point.phi, this.last_point.dis);
    var pos = coordCarte(params.theta, params.phi, params.dis);
    var dist = vec3.dist(lpos, pos);
    var angle = [params.theta, params.phi, params.dis];

    if (dist > Math.PI * params.dis * 0.002) {
      this.updateBuffer(angle);
      this.angle = angle;
      this.last_point = params;
    }

    // angle[2] is vector length
    //        if( dist > Math.PI * params.dis * 0.03 ) {
    //            this.updateBuffer( angle );
    //            this.angle      = angle;
    //            this.last_point = params;
    //        } else if( dist > Math.PI * params.dis * 0.001 ) {
    //            this.pg ++;
    //            this.last_point = params;

    //            if( this.pg === this.gap ) {
    //                this.angle = angle;
    //            }
    //            if( this.pg === this.gap+1 ) {
    //                this.pg = 1;
    //                this.updateBuffer( angle );
    //                this.angle = angle;
    //            }
    //        }
  }

  // 重置路径变量
  resetCurrentPath(vec) {
    this.cur_path_count = 0;
    this.cur_index_count = 0;
    this.pg = 0;
  }

  resetAllPath(args) {
    // 删掉无用的buffer，节省内存
    for (var i = 1; i <= this.cur_pi; i++) {
      gl.deleteBuffer(this.buffers.path[i]);
      gl.deleteBuffer(this.buffers.index[i]);
    }
    this.all_index_count = 0;
    this.cur_pi = 0;
    this.last_point = undefined
    this.resetCurrentPath();
  }

  createBuffer() {
    this.buffers.path[this.cur_pi] = this.createArrayBuffer(this.buffer_path_bytes, states.gl.DYNAMIC_DRAW, states.gl.ARRAY_BUFFER);
    this.buffers.index[this.cur_pi] = this.createArrayBuffer(this.buffer_index_bytes, states.gl.DYNAMIC_DRAW, states.gl.ELEMENT_ARRAY_BUFFER);
  }
}
// end of SensorPath prototype


/**
* 打点操作
* 初始化时为顶点申请一定大小的缓冲区，打点的数量有限制，
* 因为在程序运行时不会自动申请缓冲区。
**/
class RecordPoint extends PaintObj{
  constructor(props) {
    super(props)
    this.type = "RecordPoint";
    this.max_vertex = this.sides * 1000;
    this.vertex_count = 0;
    this.index_count = 0;
    this.init();
  }
  
  init () {
    this.buffers.vertex = this.createArrayBuffer(this.max_vertex * 4, states.gl.DYNAMIC_DRAW, states.gl.ARRAY_BUFFER);
    this.buffers.index = this.createArrayBuffer(this.max_vertex * 2, states.gl.DYNAMIC_DRAW, states.gl.ELEMENT_ARRAY_BUFFER);
  }

  paint () {
    // 进行采点操作
    if (this.vertex_count === 0 || !this.visible) {
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.vertex);
    gl.vertexAttribPointer(attributes.vertex_normal, 3, gl.FLOAT, false, 6 * 4, 0);
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 6 * 4, 0);
    gl.vertexAttribPointer(attributes.color, 3, gl.FLOAT, false, 6 * 4, 3 * 4);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.index);

    gl.uniform1f(uniforms.alpha, this.alpha);
    gl.uniformMatrix4fv(uniforms.m_matrix, false, this.mMatrix);
    gl.uniformMatrix4fv(uniforms.pmv_matrix, false, this.mvpMatrix);
    gl.drawElements(gl.TRIANGLES, this.index_count, gl.UNSIGNED_SHORT, 0);
  }

  onViewChanged (matrix) {
    this.pvMatrix = matrix || this.pvMatrix;
    mat4.mul(this.mvpMatrix, this.pvMatrix, this.mMatrix);
  }

  setSize (size) {
    this.size = size;
    vec3.fromValues(this.vscale, size, size, size);
    mat4.fromRotationTranslationScale(this.mMatrix, this.quat, this.translation, this.vscale);
    this.onViewChanged();
  }

  record () {
    if (!this.visible) {
      return;
    }

    console.log("[Info]: record a point.");

    var i = 0, j = 0;
    var point = [];
    var index = [];

    point = circleShape(this.size, this.sides, 0, Math.PI * 2);
    rotateVertex(point, this.theta, this.phi, this.dis);

    var vertices = genVertices(point, [0.0, 0.5, 0.5]);

    var n = this.vertex_count / 6;
    for (i = 1; i < this.sides; i++) {
      index.push(n, n + i, n + i + 1,
        n, n + i + 1, n + i
      );
    }
    index.push(n, n + this.sides, n + 1,
      n, n + 1, n + this.sides
    );
    this.subBuffer(this.buffers.vertex, this.vertex_count * 4, new Float32Array(vertices));
    this.subBuffer(this.buffers.index, this.index_count * 2, new Uint16Array(index));

    this.vertex_count += vertices.length;
    this.index_count += index.length;
  }

  onSphericalChanged (params) {
    this.theta = params.theta;
    this.phi = params.phi;
    this.dis = params.dis * 1.01;
    this.size = params.size * 0.95;
  }

  // 重置已经打的点
  reset () {
    this.vertex_count = 0;
    this.index_count = 0;
  }
}
// end of RecordPoint prototype

export {SensorPoint, SensorPath, RecordPoint};