import {PaintObj, cylinderShape, rotateVertex, degToRad, genVertices} from './PaintObj'
import {states, uniforms, attributes} from './Variables'
/**
* Coord Object
* 用于绘制坐标轴
**/
class Coord extends PaintObj {
  constructor(props) {
    super(props);
    this.type = "Coord";
    this.length = 10.0;
    this.init();
  }
  
  init() {
    var xcoord = cylinderShape(0.01, this.sides, this.length);
    rotateVertex(xcoord.vertex, degToRad(90), 0);
    var xvertices = genVertices(xcoord.vertex, [0.9, 0.1, 0.0], [1.0, 1.0, 1.0]);

    var ycoord = cylinderShape(0.01, this.sides, this.length);
    rotateVertex(ycoord.vertex, degToRad(90), degToRad(90));
    var yvertices = genVertices(ycoord.vertex, [0.0, 0.9, 0.0], [1.0, 1.0, 1.0]);

    var zcoord = cylinderShape(0.01, this.sides, this.length);
    var zvertices = genVertices(zcoord.vertex, [0.0, 0.0, 0.9], [1.0, 1.0, 1.0]);

    var vertices = [];
    vertices = vertices.concat(xvertices);
    vertices = vertices.concat(yvertices);
    vertices = vertices.concat(zvertices);

    var index = [];
    index = index.concat(xcoord.index);
    //        index = index.concat( ycoord.index );
    var length = 2 * this.sides + 2;
    for (var i = 0; i < ycoord.index.length; i++) {
      index.push(length + ycoord.index[i]);
    }
    //        index = index.concat( zcoord.index );
    length = 4 * this.sides + 4;
    for (var i = 0; i < zcoord.index.length; i++) {
      index.push(length + zcoord.index[i]);
    }
    this.buffers.vertex = this.createArrayBuffer(new Float32Array(vertices), states.gl.STATIC_DRAW);
    this.buffers.index = this.createArrayBuffer(new Uint16Array(index), states.gl.STATIC_DRAW);
    this.buffers.index.numItems = index.length;
  }

  paint() {
    states.gl.uniform1f(uniforms.alpha, this.alpha);
    states.gl.uniformMatrix4fv(uniforms.m_matrix, false, this.mMatrix);
    states.gl.uniformMatrix4fv(uniforms.pmv_matrix, false, this.mvpMatrix);
    // console.log("Coord", this)
    states.gl.bindBuffer(states.gl.ARRAY_BUFFER, this.buffers.vertex);
    states.gl.vertexAttribPointer(attributes.vertex_position, 3, states.gl.FLOAT, false, 9 * 4, 0);
    states.gl.vertexAttribPointer(attributes.color, 3, states.gl.FLOAT, false, 9 * 4, 3 * 4);
    states.gl.vertexAttribPointer(attributes.vertex_normal, 3, states.gl.FLOAT, false, 9 * 4, 6 * 4);
    states.gl.bindBuffer(states.gl.ELEMENT_ARRAY_BUFFER, this.buffers.index);
    states.gl.drawElements(states.gl.TRIANGLES, this.buffers.index.numItems, states.gl.UNSIGNED_SHORT, 0);
  }

  onViewChanged(matrix) {
    this.pvMatrix = matrix || this.pvMatrix;
    mat4.mul(this.mvpMatrix, this.pvMatrix, this.mMatrix);
    // this.paint()
  }
}
// end of Coord prototype

export default Coord