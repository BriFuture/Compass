import {states} from './Variables'
/**
* 所有需要绘制的对象在构造时需要调用此函数对参数进行初始化
**/
class PaintObj {
  constructor(props) {
    if (props === undefined) {
      props = {};
    }
    this.sides = props.sides || 24;
    this.alpha = props.alpha || 1.0;
    this.color = props.color || [0.8, 0.8, 0.8];
    this.size = props.size || 1.0;
    this.gl = props.gl;
    this.buffers = {};
    this.mMatrix = mat4.create();
    this.pvMatrix = mat4.create();
    this.mvpMatrix = mat4.create();
    this.quat = quat.create();
    this.vscale = vec3.fromValues(1.0, 1.0, 1.0); // vec3.create equals to fromValues(0.0, 0.0, 0.0)
    this.translation = vec3.create();
    this.visible = true;
    this._x = 0;
    this._y = 0;
    this._z = 0;
    this._rotateX = 0;
    this._rotateY = 0;
    this._rotateZ = 0;
  }

  /**
  * @param {*} data  数组或 long 型整数
  * @param {*} drawtype  STATIC or DYNAMIC
  * @param {*} type  ELEMENT or ARRAY
  */
  createArrayBuffer(data, drawtype, type) {
    var buffer = states.gl.createBuffer();

    if (type === undefined) {
      type = states.gl.ELEMENT_ARRAY_BUFFER;
      buffer.itemSize = data.itemSize || 1;
      if (data instanceof Float32Array) {
        type = states.gl.ARRAY_BUFFER;
        buffer.itemSize = data.itemSize || 3;
      }
      buffer.numItems = data.length / buffer.itemSize;
    }

    states.gl.bindBuffer(type, buffer);
    states.gl.bufferData(type, data, drawtype);
    states.gl.bindBuffer(type, null);
    return buffer;
  }

  
  subBuffer(buffer, offset, data) {
    var type = states.gl.ELEMENT_ARRAY_BUFFER;
    if (data instanceof Float32Array) {
      type = states.gl.ARRAY_BUFFER;
    }
    // console.log(type, offset + data.length)
    states.gl.bindBuffer(type, buffer);
    states.gl.bufferSubData(type, offset, data);
  }
}


/**
* 计算出圆柱体需要的顶点和索引
**/
function cylinderShape(radius, segment, height) {
  var bottom = circleShape(radius, segment);
  var upper = circleShape(radius, segment, 0, Math.PI * 2, height);
  var vertex = bottom.concat(upper);

  var index = [];
  var i = 0;
  // bottom
  for (i = 1; i < segment; i++) {
    index.push(0, i + 1, i);
  }
  index.push(0, 1, i);

  // upper
  for (i = segment + 2; i < 2 * segment + 1; i++) {
    index.push(segment + 1, i, i + 1);
  }
  index.push(segment + 1, i, segment + 2);

  // side
  for (i = 1; i < segment; i++) {
    index.push(segment + 1 + i, i, i + 1);
    index.push(segment + i + 1, i + 1, segment + i + 2);
  }
  index.push(segment + 1 + i, i, 1);
  index.push(segment + i + 1, 1, segment + 2);

  return {
    vertex: vertex,
    index: index
  }
}

/**
* calculate circle on the plane xoy with given sides and distance between each vertex and origin point
* Note that the origin point is the first element of the array and
* the direction of the circle is anti-clock viewed from Z+ to Z-
*
* @return vertex.size = (segment+1) * 3
*/
function circleShape(radius, segment, thetaStart, thetaEnd, pos) {
  var vertex = [];
  var x = 0.0;
  var y = 0.0;
  var z = pos || 0.0;
  var start = thetaStart || 0;
  var end = thetaEnd || Math.PI * 2;

  var dtheta = (end - start) / segment;
  vertex = vertex.concat([x, y, 0.0]);
  for (var i = 0; i < segment; i++) {
    x = Math.cos(i * dtheta + start) * radius;
    y = Math.sin(i * dtheta + start) * radius;
    vertex = vertex.concat([x, y, z]);
  }
  return vertex;
}



/**
*  @param {Array} vertex  the vertices to rotate around the origin point
*  @param {Number}   theta is in terms of RAD
*  @param {Number}   beta  is in terms of RAD
*  @desc 将所有顶点按照世界坐标轴 Y 轴，Z 轴依次进行 theta 角和 beta 角的旋转
**/
function rotateVertex(vertex, theta, beta, dis) {
  var v = vec3.create();
  var d = dis || 0;
  for (var i = 0; i < vertex.length; i += 3) {
    vec3.set(v, vertex[i + 0], vertex[i + 1], vertex[i + 2] + d);
    vec3.rotateY(v, v, [0, 0, 0], theta);
    vec3.rotateZ(v, v, [0, 0, 0], beta);
    vertex[i + 0] = v[0];
    vertex[i + 1] = v[1];
    vertex[i + 2] = v[2];
  }
  //    return vertex;
}


function degToRad(deg) {
  return deg * Math.PI / 180;
}


/**
* 用更紧凑的方式得到顶点信息的数组，
* 认为每 9 个数据表示一个顶点、颜色和法向量数据，
* 可根据 color，normal 的长度自动进行颜色的复制
**/
function genVertices(vertex, color, normal) {
  var vertices = [];
  var i = 0;
  if (color.length <= 3) {
    if (normal === undefined) {
      for (i = 0; i < vertex.length; i += 3) {
        vertices = vertices.concat(vertex[i], vertex[i + 1], vertex[i + 2]);
        vertices = vertices.concat(color[0], color[1], color[2]);
      }
    } else if (normal.length <= 3) {
      for (i = 0; i < vertex.length; i += 3) {
        vertices = vertices.concat(vertex[i], vertex[i + 1], vertex[i + 2]);
        vertices = vertices.concat(color[0], color[1], color[2]);
        vertices = vertices.concat(normal[0], normal[1], normal[2]);
      }
    } else {
      for (i = 0; i < vertex.length; i += 3) {
        vertices = vertices.concat(vertex[i], vertex[i + 1], vertex[i + 2]);
        vertices = vertices.concat(color[0], color[1], color[2]);
        vertices = vertices.concat(normal[i], normal[i + 1], normal[i + 2]);
      }
    }
  } else {
    if (normal === undefined) {
      for (i = 0; i < vertex.length; i += 3) {
        vertices = vertices.concat(vertex[i], vertex[i + 1], vertex[i + 2]);
        vertices = vertices.concat(color[i], color[i + 1], color[i + 2]);
      }
    } else if (normal.length <= 3) {
      for (i = 0; i < vertex.length; i += 3) {
        vertices = vertices.concat(vertex[i], vertex[i + 1], vertex[i + 2]);
        vertices = vertices.concat(color[i], color[i + 1], color[i + 2]);
        vertices = vertices.concat(normal[0], normal[1], normal[2]);
      }
    } else {
      for (i = 0; i < vertex.length; i += 3) {
        vertices = vertices.concat(vertex[i], vertex[i + 1], vertex[i + 2]);
        vertices = vertices.concat(color[i], color[i + 1], color[i + 2]);
        vertices = vertices.concat(normal[i], normal[i + 1], normal[i + 2]);
      }
    }
  }

  return vertices;
}


/**
* 假设球心即为原点，将球极坐标系转换成平面直角坐标系
* @param   theta {Numer}    Rad 弧度制，球心到顶点的连线与 Z 轴正方向的夹角为 theta
* @param   phi  {Numer}    Rad 弧度制，球心到顶点的连线在 xoy 平面上的投影与 X 轴正方向的夹角为 phi
* @param   r     {Number}  球半径
* @return  {vec3}    顶点的坐标，表示
*/
function coordCarte(theta, phi, r) {
  var st = Math.sin(theta);
  var ct = Math.cos(theta);
  var sp = Math.sin(phi);
  var cp = Math.cos(phi);
  var x = r * st * cp;
  var y = r * st * sp;
  var z = r * ct;
  // return [x, y, z]
  return vec3.fromValues(x, y, z);
}

export {PaintObj, cylinderShape, circleShape, rotateVertex, degToRad, genVertices,
  coordCarte
};