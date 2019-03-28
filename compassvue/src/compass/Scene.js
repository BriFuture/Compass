import {states, attributes, uniforms} from './Variables'
import {coordCarte, degToRad} from './PaintObj'

/**
* @class Camera
* @desc  透视角度摄像机，通过该类控制视窗变化
*    设置 pos 改变摄像机的位置
*    设置 up  改变摄像机的上方向
*    设置 lookat 改变摄像机的视点
* 摄像机对象维护 pvMatrix，并会在视图矩阵更新时通知相关联的 watcher 对象，
* 若没有设置 watcher 对象则不会更新视图。
* 默认摄像机的 lookat 一直是 [0, 0, 0] 原点，up 是 Z 轴方向
**/
class Camera {
  defaultTheta = 45
  defaultPhi = 45
  defaultDis = 15
  defaultViewWidth = 800
  defaultViewHeight = 600

  constructor(props) {
    //    PaintObj.call( this );
    this.type = "Camera";
    
    this.theta = props.theta || this.defaultTheta;
    this.theta = degToRad(this.theta);
    this.phi = props.phi || this.defaultPhi;
    this.phi = degToRad(this.phi);
    this.dis = props.dis || this.defaultDis;

    this.width = props.width || this.defaultViewWidth;
    this.height = props.height || this.defaultViewHeight;
    this.pos = coordCarte(this.theta, this.phi, this.dis);
    this.up = vec3.fromValues(0, 0, 1);
    this.lookat = vec3.fromValues(0, 0, 0);
    this.pMatrix = mat4.create();
    this.vMatrix = mat4.create();
    this.pvMatrix = mat4.create();
    
    this.setSize(this.width, this.height);
  }

  /**
    * @desc 更新视图矩阵并通知 watcher 对象 pvMatrix 已更新
  **/
  update() {
    mat4.lookAt(this.vMatrix, this.pos, this.lookat, this.up);
    mat4.mul(this.pvMatrix, this.pMatrix, this.vMatrix);
    if (this.watcher !== undefined) {
      this.watcher(this.pvMatrix);
    }
  }

  /**
  * 设置 watcher 对象
  **/
  recv(watcher) {
    this.watcher = watcher;
  }

  /**
  * 设置摄像机的旋转操作
  * @param a_theta  用角度制表示的 theta 角，与 Z 轴正半轴的夹角,
  *   [0, 180]，为了便于区分参数中的角度制和弧度制，在变量名前加 a 表示角度制
  * @param a_phi 用角度制表示的 phi 角， 与 X 轴正半轴的夹角，[0, 360]
  * @param r  到原点的距离
  * @note  some problem occurred when x or y equals to zero
  *    because you can't set up [0, 0, 1] and look at [0, 0, 0] the origin point.
  **/
  rotate(a_theta, a_phi, r) {
    if(a_theta) {
      if (a_theta < 0.01) {
        a_theta = 0.01;
      } else if (a_theta > 179.99) {
        a_theta = 179.99;
      }
      this.theta = degToRad(a_theta);
    }
    if(a_phi) {
      this.phi = degToRad(a_phi);
    }
    if(r) {
      this.dis = r;
    }
    /**
     * 当 POS 距离 图像超过 1 时，无法显示
     */
    // this.pos = [0.65, 0.65, 0.65]
    this.pos = coordCarte(this.theta, this.phi, this.dis);
    this.update();
  }

  /**
  * 设置 gl 的视口，并更新透视矩阵和视图矩阵
  **/
  setSize(width, height) {
    this.width = width;
    this.height = height;
    states.gl.viewport(0, 0, width, height);
    mat4.perspective(this.pMatrix, 45 / 180 * Math.PI, width / height, 0.5, 500.0);
    this.update();
  }

  /**
  * 重置摄像机位置
  **/
  reset() {
    this.rotate(this.defaultTheta, this.defaultPhi, this.dis);
    this.update();
  }
}



/**
* @desc 场景控制器
* 1. 封装了对 gl 的设置，若无必要，不用再设置 gl；异步加载着色器代码，封装了对着色器的编译连接等操作。
* 包含对全局变量 attributes 和 uniforms 的设置
* 2. 为了方便，实际上将 Renderer 的功能集成到了 Scene 中，需要绘制时，调用 Scene 对象的 render 方法即可。
* 3. 场景只能接收一个 Camera 对象，若多次添加 Camera 对象，则会将最后一个 Camera 对象设为当前的 Camera 对象
**/
class Scene {
  /**
   * 
   * @param {Object} props 
   */
  constructor(props) {
    let gl = states.gl;
    // states.gl = gl;
    gl.enable(gl.DEPTH_TEST); // depth test
    gl.depthFunc(gl.LESS);
    gl.enable(gl.CULL_FACE); // 设置遮挡剔除有效
    gl.cullFace(gl.BACK);
    gl.clearColor(0.97, 0.97, 0.97, 1.0); // background color
    gl.clearDepth(1.0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.enable(gl.BLEND); // enable blend for alpha
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.type = "Scene";
    this.objs = [];
    this.light_direct = [0.35, 0.35, 0.7];
  }


  /**
    * @params first  将物体添加到序列头部，每次绘制时优先绘制
    * @desc 添加要绘制的物体。不包含摄像机
  **/
  add(obj, first) {
    if (obj === undefined) {
      console.log("[Warn] Undefined on Scene adding.");
      return;
    }

    if (first) {
      this.objs.unshift(obj);
    } else {
      this.objs.push(obj);
    }
    if (this.camera !== undefined) {
      // force camera to notify all added object refresh mvpMatrix
      this.camera.update();
    }
  }

  /**
   * 添加摄像机，重复添加则会更新 camera 对象（只有一个有效）
   * 
   * @param {*} camera 
   */
  addCamera(camera) {
    this.camera = camera;
    camera.recv((matrix) => {
      /**
        * 通知所有物体视图矩阵有变化
       **/
      for (var i = 0; i < this.objs.length; i++) {
        this.objs[i].onViewChanged(matrix);
      }
      // this.render()
    });
  }

  /**
  * 依次绘制物体
  **/
  render() {
    this.running = true;
    var scope = this;
    function r() {
      states.gl.clear(states.gl.COLOR_BUFFER_BIT | states.gl.DEPTH_BUFFER_BIT);   // clear color buffer and depth buffer bit
      for (var i = 0; i < scope.objs.length; i++) {
        scope.objs[i].paint();
      }
      if(scope.running) {
        requestAnimationFrame(r)
      }
    }
    requestAnimationFrame(r)
    // r()
    // this.render()
  }


  /*
  * 根据渲染类型返回渲染器
  * @param  gl       gl 对象
  * @param  codestr  渲染程序代码，具体渲染方式
  * @param  type     渲染类型
  * @return  渲染器
  */
  getShader(gl, codestr, type) {
    // 创建渲染器
    var shader = gl.createShader(type);

    gl.shaderSource(shader, codestr);
    // 编译渲染器
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log("JS:Shader compile failed");
      console.log(gl.getShaderInfoLog(shader));
      return null;
    }
    //    console.log("compile done!");
    return shader;
  }

  /**
  * 初始化着色器
  * @desc 异步加载着色器代码并在完成加载后进行编译链接
  * @param {String} vertexCode
  * @param {String} fragCode
  **/
  initShaders(vertexCode, fragCode) {
    var shaderProgram = states.gl.createProgram();
    var vertexShader = this.getShader(states.gl, vertexCode, states.gl.VERTEX_SHADER);
    states.gl.attachShader(shaderProgram, vertexShader);

    var fragShader = this.getShader(states.gl, fragCode, states.gl.FRAGMENT_SHADER);
    states.gl.attachShader(shaderProgram, fragShader);
    this._onShaderReady(shaderProgram);

  }

  /**
  * 在着色器代码准备好后进行着色器的编译链接；
  * 设置全局变量 attributes 和 uniforms
  **/
  _onShaderReady(shaderProgram) {
    states.gl.linkProgram(shaderProgram);
    states.gl.useProgram(shaderProgram);

    attributes.vertex_position = states.gl.getAttribLocation(shaderProgram, "aVertexPosition");
    states.gl.enableVertexAttribArray(attributes.vertex_position);

    attributes.vertex_normal = states.gl.getAttribLocation(shaderProgram, "aVertexNormal");
    states.gl.enableVertexAttribArray(attributes.vertex_normal)

    attributes.color = states.gl.getAttribLocation(shaderProgram, "aColor");
    states.gl.enableVertexAttribArray(attributes.color);

    attributes.texture = states.gl.getAttribLocation(shaderProgram, "aTexture");
    attributes.color = states.gl.getAttribLocation(shaderProgram, "aColor");

    uniforms.pmv_matrix = states.gl.getUniformLocation(shaderProgram, "uPMVMatrix"); // 透视模型视图矩阵
    uniforms.m_matrix = states.gl.getUniformLocation(shaderProgram, "uMMatrix")
    uniforms.n_matrix = states.gl.getUniformLocation(shaderProgram, "uNMatrix"); // 法线
    uniforms.alpha = states.gl.getUniformLocation(shaderProgram, "uAlpha");
    uniforms.frag_color = states.gl.getUniformLocation(shaderProgram, "uFragColor");
    uniforms.has_texture = states.gl.getUniformLocation(shaderProgram, "uHasTexture");
    uniforms.light_direction = states.gl.getUniformLocation(shaderProgram, "uLightDirection"); // 光照
    uniforms.specColor = states.gl.getUniformLocation(shaderProgram, "uSpecColor");
    uniforms.vertexColor = states.gl.getUniformLocation(shaderProgram, "uVertColor");

    states.gl.uniformMatrix4fv(uniforms.n_matrix, false, mat4.create());
    states.gl.uniform3fv(uniforms.light_direction, this.light_direct);  // where light origins
  }
}

export {Camera, Scene}