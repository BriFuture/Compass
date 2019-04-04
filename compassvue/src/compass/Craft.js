import {PaintObj, degToRad} from './PaintObj'
import {states, attributes, uniforms} from './Variables'

// import CraftObj from '!'
/**
* 飞行器模拟器，模型是从 https://archive3d.net/ 中下载的，
* 模型转换成 OBJ 格式，并利用 [webgl-obj-loader](https://github.com/frenchtoast747/webgl-obj-loader)
* 进行加载
**/
class Craft extends PaintObj{
  constructor(props) {
    super(props);
    this.type = "Craft";
    var scale = props.size || 1;
    this.setScale(scale);
    this.visible = false;
    this.heading = 0;
    this.pitch = 0;
    this.roll = 0;
    this.headingOffset = 0;
    this.pitchOffset = 0;
    this.rollOffset = 0;
    // this.init();
    if(props.obj) {
      this.init(props.obj)
    }
  }

  init(objPromise) {
    objPromise.then( (obj) => {
      // console.log("test", txt.default)
      // console.log(obj, typeof(obj))
      this.mesh = new OBJ.Mesh(obj.default)
      OBJ.initMeshBuffers(states.gl, this.mesh)
      this.visible = true;
    })
  }

  paint() {

    if (this.mesh === undefined) {
      return;
    }

    states.gl.uniform1f(uniforms.alpha, this.alpha);
    states.gl.uniform3fv( uniforms.frag_color, [0.8, 0.3, 0.6] );
    //  states.gl.uniform1i(  uniforms.has_texture, true );
    states.gl.uniform1i(uniforms.specColor, 1);
    states.gl.uniform3fv(uniforms.vertexColor, this.color);

    // states.gl.bindBuffer(states.gl.ARRAY_BUFFER, this.vertexBuffer);
    // console.log(this.mesh.vertexBuffer)
    states.gl.bindBuffer(states.gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
    states.gl.vertexAttribPointer(attributes.vertex_position, 
      this.mesh.vertexBuffer.itemSize, states.gl.FLOAT, false, 0, 0);
    states.gl.vertexAttribPointer(attributes.color,   
      3, states.gl.FLOAT, false, 0, 0);
    
    if(!this.mesh.textures.length){
        states.gl.disableVertexAttribArray(attributes.textureCoordAttribute);
    }
    else{
        // if the texture vertexAttribArray has been previously
        // disabled, then it needs to be re-enabled
        states.gl.enableVertexAttribArray( attributes.texture );
        states.gl.bindBuffer( states.gl.ARRAY_BUFFER, this.mesh.textureBuffer );
        states.gl.vertexAttribPointer( attributes.texture, this.mesh.textureBuffer.itemSize, states.gl.FLOAT, false, 0, 0);
    }

    states.gl.bindBuffer(states.gl.ARRAY_BUFFER, this.mesh.normalBuffer);
    states.gl.vertexAttribPointer(attributes.vertex_normal, this.mesh.normalBuffer.itemSize, 
      states.gl.FLOAT, false, 0, 0);

    states.gl.uniformMatrix4fv(uniforms.m_matrix, false, this.mMatrix);
    states.gl.uniformMatrix4fv(uniforms.pmv_matrix, false, this.mvpMatrix);

    states.gl.bindBuffer(states.gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
    states.gl.drawElements(states.gl.TRIANGLES, this.mesh.indexBuffer.numItems, states.gl.UNSIGNED_SHORT, 0);
    
    // var binding1 = states.gl.getParameter(states.gl.ARRAY_BUFFER_BINDING);
    // var binding2 = states.gl.getParameter(states.gl.ELEMENT_ARRAY_BUFFER_BINDING);
    // console.log("this: ", this.mesh.vertexBuffer, this.mesh.indexBuffer)
    // console.log("binding: ", binding1, binding2)
    // states.gl.drawElements(states.gl.TRIANGLES, this.elements, states.gl.UNSIGNED_SHORT, 0);
    
//        states.gl.uniform1i( uniforms.has_texture, false );
    states.gl.uniform1i(uniforms.specColor, false);
  }

  onViewChanged(matrix) {
    this.pvMatrix = matrix || this.pvMatrix;
    mat4.mul(this.mvpMatrix, this.pvMatrix, this.mMatrix);
  }

  /**
    * 加载模型不进行旋转操作时，可以看到模型指向 Z 轴负半轴，模型顶部指向 Y 轴
    * 正半轴，因此需要在跟随 SensorPoint 做旋转操作时需要首先调整指向。
    * mat4.rotate 方法会将物体的坐标轴进行旋转，即旋转后物体坐标轴与世界坐标系的轴不同
  **/
  setRotation(params) {
    this.pitch = params.pitch || this.pitch;
    this.heading = params.heading || this.heading;
    this.roll = params.roll || this.roll;
    //        quat4.fromEuler( this.quat, params.heading, params.pitch, params.roll );
    mat4.fromScaling(this.mMatrix, this.vscale);    
    // if craft's look at [1, 0, 0] and its up is [0, 0, 1]
    // following rotation will be fine, now it needs to some calibrations
    // what's more, the coordinate will rotate with the angle
    //        mat4.rotateZ( this.mMatrix, this.mMatrix, degToRad( params.heading ) );
    //        mat4.rotateY( this.mMatrix, this.mMatrix, degToRad( params.pitch ) );
    //        mat4.rotateX( this.mMatrix, this.mMatrix, degToRad( params.roll ) );

    mat4.rotateX(this.mMatrix, this.mMatrix, degToRad(this.pitchOffset));
    //        mat4.rotateY( this.mMatrix, this.mMatrix, degToRad( 270 ) );
    mat4.rotateY(this.mMatrix, this.mMatrix, degToRad(this.heading + this.headingOffset));
    mat4.rotateX(this.mMatrix, this.mMatrix, degToRad(this.pitch));
    mat4.rotateZ(this.mMatrix, this.mMatrix, degToRad(this.roll));
    this.onViewChanged();
  }

  setScale(size) {
    this.size = size;
    vec3.set(this.vscale, size, size, size);
    this.setRotation({});
    // sensorPoint.update();
  }
}
Craft.prototype.onSphericalChanged = Craft.prototype.setRotation

export {Craft};