

/**
* 飞行器模拟器，模型是从 https://archive3d.net/ 中下载的，
* 模型转换成 OBJ 格式，并利用 [webgl-obj-loader](https://github.com/frenchtoast747/webgl-obj-loader)
* 进行加载
**/
class Craft {
  constructor(props) {
    PaintObj.call(this);
    this.type = "Craft";
    this.url = "qrc:/res/obj/craft.obj";
    var scale = props.size || 1;
    this.setScale(scale);
    this.init();
  }
  init() {
    var that = this;
    readFile(this.url, function (text) {
      that.mesh = new ObjLoader.OBJ.Mesh(text);
      ObjLoader.OBJ.initMeshBuffers(gl, that.mesh);
    });
  }

  paint() {

    if (this.mesh === undefined || !this.visible) {
      return;
    }

    gl.uniform1f(uniforms.alpha, this.alpha);
    //        gl.uniform3fv( uniforms.frag_color, [0.8, 0.3, 0.6] );
    //        gl.uniform1i(  uniforms.has_texture, true );
    gl.uniform1i(uniforms.specColor, 1);
    gl.uniform3fv(uniforms.vertexColor, this.color);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
    gl.vertexAttribPointer(attributes.vertex_position, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

    //        if(!this.mesh.textures.length){
    //            gl.disableVertexAttribArray(attributes.textureCoordAttribute);
    //        }
    //        else{
    //            // if the texture vertexAttribArray has been previously
    //            // disabled, then it needs to be re-enabled
    //            gl.enableVertexAttribArray( attributes.texture );
    //            gl.bindBuffer( gl.ARRAY_BUFFER, this.mesh.textureBuffer );
    //            gl.vertexAttribPointer( attributes.texture, this.mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
    //        }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
    gl.vertexAttribPointer(attributes.vertex_normal, this.mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(uniforms.m_matrix, false, this.mMatrix);
    gl.uniformMatrix4fv(uniforms.pmv_matrix, false, this.mvpMatrix);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    //        gl.uniform1i( uniforms.has_texture, false );
    gl.uniform1i(uniforms.specColor, false);
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
    this.pitch = params.pitch;
    this.heading = params.heading;
    this.roll = params.roll;
    //        quat4.fromEuler( this.quat, params.heading, params.pitch, params.roll );
    mat4.fromScaling(this.mMatrix, this.vscale);
    // if craft's look at [1, 0, 0] and its up is [0, 0, 1]
    // following rotation will be fine, now it needs to some calibrations
    // what's more, the coordinate will rotate with the angle
    //        mat4.rotateZ( this.mMatrix, this.mMatrix, degToRad( params.heading ) );
    //        mat4.rotateY( this.mMatrix, this.mMatrix, degToRad( params.pitch ) );
    //        mat4.rotateX( this.mMatrix, this.mMatrix, degToRad( params.roll ) );

    mat4.rotateX(this.mMatrix, this.mMatrix, degToRad(90));
    //        mat4.rotateY( this.mMatrix, this.mMatrix, degToRad( 270 ) );
    mat4.rotateY(this.mMatrix, this.mMatrix, degToRad(params.heading + 270));
    mat4.rotateX(this.mMatrix, this.mMatrix, degToRad(params.pitch));
    mat4.rotateZ(this.mMatrix, this.mMatrix, degToRad(params.roll));
    this.onViewChanged();
  }

  setScale(size) {
    this.size = size;
    vec3.set(this.vscale, size, size, size);
    sensorPoint.update();
    //        this.setRotation( {} );
  }
}

export {Craft};