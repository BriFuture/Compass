/******************************
  filename: SpacePath.js
  feature:  绘制 3D 动态图形
  author:   brifuture
  date:     2017.04.10
  Last Update :  2018.01.03, seperate each object into different reign whose ratation
        and transparation is controlled by itself.
*******************************/

Qt.include("gl-matrix.js");

// 绘制球面时的精度, 至少为 4 的倍数
var accuracy = 48;
var pointVertexSides = 48;

// 相关绘图变量
var canvasArgs;
var u, v;

/**
  * UI initializing
**/
function initUI() {
    selectDrawMode(lineRB);
    argItem.ball_radius = 8.0
    argItem.cam_dis     = 18.0
    argItem.cam_theta   = 70
    argItem.cam_beta    = 50
    argItem.path_gap    = 1
    argItem.point_size  = 2
    argItem.path_width  = 3
    argItem.ball_alpha  = 0.1
    argItem.enable_path = true;
    canvasArgs = argItem

    axisBox.checked = false;
    selectDrawMode(surfaceRB);
}

function selectDrawMode(mode) {
    for(var cbi in drawMode.children) {
        drawMode.children[cbi].checked = false;
    }

    mode.checked      = true;
    argItem.drawMode  = mode.text;
}

// some problem occurred when cam_x or cam_y equals to zero
function rotateCamera() {
    var pos = calcVertex(degToRad(argItem.cam_theta), degToRad(argItem.cam_beta), argItem.cam_dis);
    argItem.cam_x = pos[0];
    argItem.cam_y = pos[1];
    argItem.cam_z = pos[2];
}

function mouseDraged() {
    var xoffset = (mouseListener.mouseX - mouseListener.lpx)*2 / container.width;
    var yoffset = (mouseListener.mouseY - mouseListener.lpy)*2 / container.height;
    var beta = 540 + argItem.cam_beta - xoffset*360; // - indicates that drag direction is oppsite with movement
    argItem.cam_beta   = beta % 360 - 180;
    argItem.cam_theta -= yoffset*180;
    if( argItem.cam_theta.toFixed(2) == 0.00 ) {
        argItem.cam_theta = 0.01;
    }
    if( argItem.cam_theta.toFixed(2) == 180.00 ) {
        argItem.cam_theta = 179.99
    }
    rotateCamera();
}

function reset() {
    argItem.heading_offset = argItem.heading;
    var angle = calcAngle(argItem.pitch, 0);
    var u = angle[0], v = angle[1];
    sensorPoint.resetAllPath(u, v, argItem.vector_length);
}
/******************** end of UI init *****************************/



/******************** start of GL ********************************/
/* 保存画布上下文 */
var gl;
var gl2d;  // this is used for HUD drawing

var width = 0;
var height = 0;

var attributes = {};  // attribute variables from shader
var uniforms = {};    // uniform variables from shader

// matrixs
var pMatrix   = mat4.create();
var vMatrix   = mat4.create();
var pvMatrix  = mat4.create();
var mvpMatrix = mat4.create();
var nMatrix   = mat4.create();

var obj = {};
var coord;
var ball;
var sensorPoint;
var sensorPath;
var cube;

function initializeGL(canvas) {
    gl  = canvas.getContext("canvas3d",
                           { depth: true, antilias: true }
                           );
    gl2d = canvas.getContext("2d");
    gl.enable(gl.DEPTH_TEST);  // depth test
    gl.depthFunc(gl.LESS);
    gl.enable(gl.CULL_FACE); // 设置遮挡剔除有效
    gl.cullFace(gl.BACK);
    gl.clearColor(0.97, 0.97, 0.97, 1.0);  // background color
    gl.clearDepth(1.0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.enable(gl.BLEND);   // enable blend for alpha
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    initShaders();
    initBuffers();
}

function resizeGL(canvas) {
    var pixelRatio = canvas.devicePixelRatio;
    canvas.pixelSize = Qt.size(canvas.width * pixelRatio, canvas.height * pixelRatio);
}

function initShaders() {
    var vertexCode = 
        'attribute vec3 aVertexPosition;\n'  +
        'attribute vec3 aVertexNormal;\n'    + 
        'attribute vec2 aTexture;\n'         +
        'attribute vec3 aColor;\n'           +
        'uniform highp mat4 uPMVMatrix;\n'   +
        'uniform highp mat4 uMMatrix;\n'     +
        'uniform vec3  uLightDirection;\n'   + // 直射光的方向
        'varying vec3  vLight;\n'            +
        'varying vec2  vTexture;\n'          +
        'void main(void) {\n'                +
        '  gl_Position = uPMVMatrix * vec4(aVertexPosition, 1.0);\n'      +
        '  highp vec3 ambientLight = vec3(0.28, 0.28, 0.28);\n'           +
        '  highp vec3 directionalLightColor = vec3(0.51, 0.55, 0.52);\n'  +
        '  highp float directional = max(dot(aVertexNormal, normalize(uLightDirection)), 0.0);\n' +        // 直接使用顶点的法线数据进行漫反射计算
        '  vLight = aColor * (ambientLight + (directionalLightColor * directional));\n'  +
        '}\n';
    var vertexShader = getShader(gl, vertexCode, gl.VERTEX_SHADER);

    var fragCode =
        'varying vec3  vLight;\n'         +
        'varying vec2  vTexture;'         +
        'uniform float uAlpha;\n'         +
        // 'uniform sampler2D uXSampler;\n'  +
        // 'uniform sampler2D uYSampler;\n'  +
        // 'uniform sampler2D uZSampler;\n'  +
        // 'uniform int uEnableTexture;\n'   +
        'uniform vec4 uFragColor;\n'      +
        'void main(void) {\n'             +
        '  gl_FragColor = vec4(vLight, uAlpha);\n'  +
        // '  mediump vec4 xtextureColor = texture2D(uXSampler, vec2(vXTexture.s, vXTexture.t));\n' +
        // '  mediump vec4 ytextureColor = texture2D(uYSampler, vec2(vXTexture.s, vXTexture.t));\n' +
        // '  mediump vec4 ztextureColor = texture2D(uZSampler, vec2(vXTexture.s, vXTexture.t));\n' +
        // '  if( uEnableTexture == 0 ) {\n'             +
        // '    gl_FragColor = vec4(vLight, uAlpha);\n'  +
        // '  }\n' +
        // '  else if( uEnableTexture == 1 ) {\n'    +
        // '    gl_FragColor = vec4(vLight, 1.0) * xtextureColor;\n' +
        // '  }\n' +
        // '  else if( uEnableTexture == 2 ) {\n' +
        // '    gl_FragColor = vec4(vLight, 1.0) * ytextureColor;}\n' +
        // '  else if( uEnableTexture == 3 ) {\n' +
        // '    gl_FragColor = vec4(vLight, 1.0) * ztextureColor;\n' +
        // '  }\n' +
        '}\n';
    var fragShader = getShader(gl, fragCode, gl.FRAGMENT_SHADER);

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    attributes.vertex_position = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(attributes.vertex_position);

    attributes.vertex_normal = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(attributes.vertex_normal)

    attributes.color = gl.getAttribLocation(shaderProgram, "aColor");
    gl.enableVertexAttribArray(attributes.color);
    
    attributes.color           = gl.getAttribLocation(shaderProgram, "aColor");

    uniforms.pmv_matrix      = gl.getUniformLocation(shaderProgram, "uPMVMatrix"); // 透视模型视图矩阵
    uniforms.m_matrix        = gl.getUniformLocation(shaderProgram, "uMMatrix")
//    uniforms.normal_matrix = gl.getUniformLocation(shaderProgram, "uNormalMatrix"); // 法线
    uniforms.light_direction = gl.getUniformLocation(shaderProgram, "uLightDirection"); // 光照
    uniforms.alpha           = gl.getUniformLocation(shaderProgram, "uAlpha");
    uniforms.frag_color      = gl.getUniformLocation(shaderProgram, "uFragColor");

}

/**
 * 初始化缓冲数据
 */
function initBuffers() {
    coord       = new Coord();
    coord.init(gl);
    ball        = new Ball(accuracy);
    ball.init(gl);
    sensorPoint = new SensorPoint(pointVertexSides);
    sensorPoint.init(gl);
    sensorPath  = new SensorPath();
    sensorPath.init(gl);
    cube        = new Cube(canvasArgs.ball_radius);
    cube.init(gl);
    obj.refCircle = new RefCircle(pointVertexSides, canvasArgs.ball_radius);
}

/**
 * @param {*} type  ELEMENT or ARRAY
 * @param {*} data  数组或 long 型整数
 * @param {*} drawtype  STATIC or DYNAMIC
 */
function createArrayBuffer(type, data, drawtype) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, data, drawtype);
    return buffer;
}


function paintGL(canvas, args) {
    var pixelRatio = canvas.devicePixelRatio;
    var currentWidth = canvas.width * pixelRatio;
    var currentHeight = canvas.height * pixelRatio;

    if (currentWidth !== width || currentHeight !== height) {
        width = canvas.width;
        height = canvas.height;
        gl.viewport(0, 0, width, height);
        mat4.perspective(pMatrix, 45 / 180 * Math.PI, width / height, 0.5, 500.0);
    }

    canvasArgs = args;
    /** 如果 heading 有偏移，应把偏移算上(以复位后的位置作为基准方向) **/
    canvasArgs.heading = canvasArgs.heading - canvasArgs.heading_offset;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);   // clear color buffer and depth buffer bit 
    mat4.lookAt(vMatrix, [canvasArgs.cam_x, canvasArgs.cam_y, canvasArgs.cam_z], [0, 0, 0], [0, 0, 1]);
    mat4.multiply(pvMatrix, pMatrix, vMatrix);

    gl.uniform3fv(uniforms.light_direction, canvasArgs.light_direction);  // where light origins
    startPaint();
}

/** 开始执行实际的绘图操作，由于开启了 ALPHA BLEND 功能，先绘制球内物体 **/
function startPaint(canvas) {
    var angle = calcAngle(canvasArgs.pitch, canvasArgs.heading);
    var vangle = calcSensorNormal();  // vertical of angle
    var pos = calcVertex(degToRad(90-canvasArgs.pitch), degToRad(canvasArgs.heading), canvasArgs.vector_length);
    sensorPoint.paint(gl, {"pos": pos,
                          "angle": vangle,
                          "point_size": canvasArgs.point_size});
    sensorPath.paint(gl,  {"pos": pos,
                         "angle": vangle,
                         "enable": canvasArgs.enable_path,
                         "vector_length": canvasArgs.vector_length,
                         "path_gap": canvasArgs.path_gap,
                         "path_width": canvasArgs.path_width
                     });
    coord.paint(gl);
    ball.paint(gl, canvasArgs.ball_radius);
}



/*
 * 根据渲染类型返回渲染器
 * @param  gl       gl 对象
 * @param  codestr  渲染程序代码，具体渲染方式
 * @param  type     渲染类型
 * @return  渲染器
 */
function getShader(gl, codestr, type) {
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

function degToRad(deg) {
    return deg * Math.PI /180;
}

/**
* @param {Number} pitch   range [-90, 90]
* @param {Number} heading range [0, 360]
*/
function calcAngle(pitch, heading) {
    var u, v;
    if (Math.abs(pitch) <= 90) {
        // 将俯仰角转换成绘图时的 theta 角
        u = (90 - pitch) / 180;
        // 绘图时的 beta 角
        v = heading / 360;
    } else {
        // pitch 绝对值超过 90
        if (pitch > 0) {
            u = (pitch - 90) / 180;
        } else {
            u = (270 + pitch) / 180;
        }
        v = (heading + 180) % 360 / 360;
    }
    //    console.log("u: " + u);
    return [u, -v];
}

/**
* @param {Number} pitch   range [-90, 90]
* @param {Number} heading range [0, 360]
* @returns {Vec3} the angle returned is in unit of rad
*/
function calcSensorNormal() {
    var pitch   = canvasArgs.pitch;
    var heading = canvasArgs.heading;
    var u = (90-pitch)/180 * Math.PI;
    var v = heading   /180 * Math.PI;
//    return [u, v, canvasArgs.vector_length];
    return vec3.fromValues(u, v, canvasArgs.vector_length)
}



/**
 * 假设球心即为原点，将球面坐标系转换成平面直角坐标系
 * @param   theta {Rad}     球心到顶点的连线与 Z 轴正方向的夹角为 theta
 * @param   beta  {Rad}     球心到顶点的连线在 xoy 平面上的投影与 X 轴正方向的夹角为 beta
 * @param   r     {Number}  球半径
 * @return      顶点的坐标，用三维数组表示
 */
function calcVertex(theta, beta, r) {
    var st = Math.sin(theta);
    var ct = Math.cos(theta);
    var sb = Math.sin(beta);
    var cb = Math.cos(beta);
    var x  = r * st * cb;
    var y  = r * st * sb;
    var z  = r * ct;
    return [x, y, z];
}

function vectorPos(vec) {
    return calcVertex(vec[0], vec[1], vec[2]);
}

/**
 * calculate circle on the plane xoy with given sides and distance between each vertex and origin point
 * the first vertex lies on X coordinate. 
 * Note that the origin point is excluded from the array and the direction of the circle is anti-clock viewed from Z+ to Z-
 * @param   {Number} sides   the number of sides of this circle
 * @param   {Number} dis     the distance between each vertex and origin point
 * @param   {Array} color
 * @returns {}
 */
function calcCircle(sides, dis, color) {
    var vertex = [];
    var colors = [];
    var angle = Math.PI * 2 / sides;
    var x = 0.0;
    var y = 0.0;

    if( typeof color == "undefined") {
        color = [0.5, 0.5, 0.5];
    }

    for(var i = 0; i < sides; i++) {
        x = Math.cos(-i * angle) * dis;  // signal - indicates it is anti-clock
        y = Math.sin(-i * angle) * dis;
        vertex = vertex.concat([x, y, 0.0]);
        colors = colors.concat(color);
    }
    return {
        "vertex": vertex,
        "color": colors
    };
}

/**
*  @param offset {Number}  the bytes of the offset
*/
function updateSubBuffer(type, buffer, offset, data) {
    gl.bindBuffer(type, buffer);
    gl.bufferSubData(type, offset, data);
}


// **************** SensorPoint Object **************** //
function SensorPoint(sides) {
    this.sides        = sides;
    this.vscale   = vec3.create();
    // the reason why rotation and then translation is out of expections
    // but if rMatrix is introduced, the result seems good
    this.mMatrix  = mat4.create();
    this.rMatrix  = mat4.create();
    this.d_size   = 1.0;
    this.alpha    = 1.0;
    this.color    = [0.1, 0.9, 0.1];      // default color
    this.inv_color  = [1.0, 0.0, 0.0];
    this.point_size = 1.0;
}

SensorPoint.prototype.init = function(gl) {
    this.buffers = {};

    var circle = calcCircle(this.sides, this.d_size, this.color);
    var color  = circle.color;
    var vertex = circle.vertex;
    color  = color.concat(this.color);
    vertex = vertex.concat([0.0, 0.0, 0.0]) // add origin point
    // inv sides
    circle = calcCircle(this.sides, this.d_size, this.inv_color);
    color  = color.concat(circle.color);
    color  = color.concat(this.inv_color);
    vertex = vertex.concat(circle.vertex);
    vertex = vertex.concat([0.0, 0.0, 0.0]) // add origin point

    var index = [];       // sensor point need both sides
    var i = 0;

    // inv sides
    index.push(2*this.sides+1);
    for (i = 2*this.sides; i >= this.sides+1; i--) {
        index.push(i);
    }
    index.push(2*this.sides);

    index.push(this.sides);
    for (i = 0; i < this.sides; i++) {
        index.push(i);
    }
    index.push(0);
    this.index = index;

    this.buffers.vertex = createArrayBuffer(gl.ARRAY_BUFFER,         new Float32Array(vertex),  gl.STATIC_DRAW);
    this.buffers.color  = createArrayBuffer(gl.ARRAY_BUFFER,         new Float32Array(color),   gl.STATIC_DRAW);
    this.buffers.index  = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(index),    gl.STATIC_DRAW);
}

/**
 * 绘制传感器指向的方向，如果需要记录路径的话，从当前位置开始记录路径
 * @param {*} gl
 * @param {*} u         与 Z 轴正向夹角，范围是[0.0, 1.0]
 * @param {*} v         与 X 轴正向夹角，增大的方向为从 Z 轴正无穷远处向原点看时逆时针方向，范围是[0, 1.0]
 * @param {*} offset    斑点到原点的距离
 * @param {*} radial    是否绘制射线
 */
SensorPoint.prototype.paint = function(gl, addon) {
    if( this.point_size !== addon.point_size ) {
        this.point_size   = addon.point_size || 1;
    }

    this.vscale  = vec3.fromValues(1.0, 1.0, 1.0);
    vec3.scale(this.vscale, this.vscale, this.point_size / this.d_size / 10);

    mat4.fromZRotation(this.rMatrix,         addon.angle[1]);
    mat4.rotateY(this.rMatrix, this.rMatrix, addon.angle[0]);
    mat4.identity(this.mMatrix);
    mat4.translate(this.mMatrix, this.mMatrix, addon.pos);
//    mat4.fromTranslation(this.mMatrix, this.mMatrix, addon.pos);
//    mat4.fromRotationTranslation(this.mMatrix, this.rMatrix, addon.pos);
//    mat4.rotateZ(this.mMatrix, this.mMatrix, addon.angle[1] * Math.PI*2);
//    mat4.rotateY(this.mMatrix, this.mMatrix, addon.angle[0] * Math.PI);
    mat4.mul(this.mMatrix,   this.mMatrix, this.rMatrix);
    mat4.scale(this.mMatrix, this.mMatrix, this.vscale);            // scale by pointSize

    mat4.mul(mvpMatrix, pvMatrix, this.mMatrix);
    gl.uniformMatrix4fv(uniforms.pmv_matrix, false, mvpMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
    gl.vertexAttribPointer(attributes.color,           3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.vertex);    // normal info
    gl.vertexAttribPointer(attributes.vertex_normal,   3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.vertex);    // vertex info
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);

    gl.uniform1f(uniforms.alpha, this.alpha);          //  set alpha value
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.index);
    gl.drawElements(gl.TRIANGLE_FAN, this.index.length, gl.UNSIGNED_SHORT, 0);
}
// ================= SensorPoint Object ======================= //

// ****************  SensorPath Object  **************** //
function SensorPath() {
    this.mMatrix         = mat4.create();
    this.alpha           = 1.0;
    this.all_path_count  = 0;
    this.all_index_count = 0;
    this.cur_path_count  = 0;
    this.cur_index_count = 0;
    this.cur_pi          = 0;  // path index
    this.color           = [0.9, 0.5, 0.2];  // path color
    this.max_path_num    = 4800 * 12;
    this.buffer_path_bytes  = this.max_path_num * 4;  // 4 means the bytes float occupies, 3 means a point contains 3 coordinate
    this.buffer_index_bytes = this.max_path_num * 2;  // 2 means the bytes uint  occupies
    this.path_gap        = 4;       // must equal or greater then 1
    this.pg              = 1;       // path gap count
    this.path_width      = 1.0;
}

SensorPath.prototype.init = function(gl) {
    this.last_point = calcSensorNormal();
    this.angle      = this.last_point;
    this.path       = [];
    this.index      = [];

    this.buffers    = {};
    // path buffer initialization
    this.buffers.path  = [];
    this.buffers.index = [];
    this.buffers.color = [];

    this.createBuffer();
}

/**
 * 绘制路径
**/
SensorPath.prototype.paint = function(gl, addon) {
    if(!addon.enable) {
        return;
    }
    var lpos = vectorPos(this.last_point);
    var  pos = vectorPos(addon.angle);
    var dist = vec3.dist(lpos, pos);

    if( this.path_width !== addon.path_width ) {
        this.path_width   = addon.path_width || 1.0;
    }

    var path_gap = Math.floor(addon.path_gap) || this.path_gap;

    if( dist > Math.PI * addon.vector_length * 0.01 ) {
        this.updateBuffer(addon.angle, this.angle);
        this.angle = addon.angle;
        this.last_point = addon.angle;
    } else {
        if( dist > Math.PI * addon.vector_length * 0.001 ) {
            this.pg ++;
            this.last_point = addon.angle;
        }
        if( this.pg === path_gap ) {
            this.angle = addon.angle;
        }
        if( this.pg === path_gap+1 ) {
            this.pg = 1;
            this.updateBuffer(addon.angle, this.angle);
            this.angle = addon.angle;
        }
    }
//    if( vec3.dist(lpos, pos) > Math.PI * addon.vector_length * 0.001 ) {
//        this.updateBuffer(addon.angle, this.last_point);
//        this.last_point = addon.angle;
//    }

    gl.uniform1f(uniforms.alpha, this.alpha);     // set alpha value
    mat4.identity(this.mMatrix);
    mat4.mul(mvpMatrix, pvMatrix, this.mMatrix);
    gl.uniformMatrix4fv(uniforms.pmv_matrix, false, mvpMatrix);

    // 分批绘制路径
    for(var i = 0; i < this.cur_pi; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color[i]);     // color buffer
        gl.vertexAttribPointer(attributes.color,           3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.path[i]);    // normal info
        gl.vertexAttribPointer(attributes.vertex_normal,   3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.path[i]);
        gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.index[i]);
        gl.drawElements(gl.TRIANGLES,     this.max_path_num, gl.UNSIGNED_SHORT, 0);
    }
    if( this.cur_index_count > 0 ) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color[this.cur_pi]);     // color buffer
        gl.vertexAttribPointer(attributes.color,           3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.path[this.cur_pi]);    // normal info
        gl.vertexAttribPointer(attributes.vertex_normal,   3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.path[this.cur_pi]);
        gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.index[this.cur_pi]);
        gl.drawElements(gl.TRIANGLES,     this.cur_index_count, gl.UNSIGNED_SHORT, 0);
    }
}

SensorPath.prototype.updateBuffer = function(nangle, langle) {
    var presult = this.getLinearPoint(nangle, langle);
    this.all_path_count  += presult.point.length;
    this.all_index_count += presult.index.length;

//        this.path.push.apply(this.path,   presult.point);
//        this.index.push.apply(this.index, presult.index);
    //  updateSubBuffer(gl.ARRAY_BUFFER,         this.buffers.path[this.cur_pi],  0,  new Float32Array(this.path));
    //  updateSubBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.index[this.cur_pi], 0,  new Uint16Array(this.index));
    updateSubBuffer(gl.ARRAY_BUFFER,         this.buffers.color[this.cur_pi], this.cur_path_count  * 4, new Float32Array(presult.color));
    updateSubBuffer(gl.ARRAY_BUFFER,         this.buffers.path[this.cur_pi],  this.cur_path_count  * 4, new Float32Array(presult.point));
    updateSubBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.index[this.cur_pi], this.cur_index_count * 2, new Uint16Array(presult.index));
    // Note! because the updateSubBuffer() should use the offset as the parameter,
    // the addition of path or index count should be later, or the buffer will be out of its size
    this.cur_path_count  += presult.point.length;
    this.cur_index_count += presult.index.length;

    // when path index count is greater or equal to this.max_path_num, then a new buffer should be realloced
    // and the counter should be reset
    if( this.cur_index_count >= this.max_path_num) {
        this.cur_pi++;
        console.log("Info: [Path] create a new buffer!\n");
        this.createBuffer();
        this.resetCurrentPath();
    }
}

/**
 * 用于绘制路径
 * @param {Array} p     p[0] = theta    p[1] = beta    p[2] = radius
 * @param {Array} lp   lp[0] = theta   lp[1] = beta   lp[2] = lradius
 * @return {Array}
 */
SensorPath.prototype.getLinearPoint = function(p, lp) {
    var s1 = vectorPos( p  );
    var s2 = vectorPos( lp );
    var s  = [ s1[0]-s2[0], s1[1]-s2[1], s1[2]-s2[2] ];
//    console.log("s1: "+ s1 + "  s2: "+s2 + "  s: " + s +"\n");
    var n0  = calcVertex( (p[0]+lp[0])*0.5, (p[1]+lp[1])*0.5, p[2] );
    var l = vec3.create();
    vec3.cross(l, s, n0);
    vec3.normalize(l, l);
    vec3.scale(l, l, this.path_width * 0.002);
//    console.log("vec l: " + vec3.str(l));

    var linearPoint = [];
    var color = [];
    var vertex;
    var that = this;

    var pushVertex = function() {
        color = color.concat(that.color);
        linearPoint.push.apply(linearPoint, vertex);
    }

    vertex = [s1[0]-l[0], s1[1]-l[1], s1[2]-l[2]];   // 0
    pushVertex();
    vertex = [s1[0]+l[0], s1[1]+l[1], s1[2]+l[2]];   // 1
    pushVertex();
    vertex = [s2[0]-l[0], s2[1]-l[1], s2[2]-l[2]];   // 2
    pushVertex();
    vertex = [s2[0]+l[0], s2[1]+l[1], s2[2]+l[2]];   // 3
    pushVertex();

    var index  = [];
    var n = this.cur_path_count / 3;  // it is better than index.length
    index.push(n + 0, n + 2, n + 3, n + 0, n + 3, n + 1);
    index.push(n + 0, n + 3, n + 2, n + 0, n + 1, n + 3);

    return {
        "point" : linearPoint,
        "color" : color,
        "index" : index,
    }
}

/**
 * 重置路径变量
 */
SensorPath.prototype.resetCurrentPath = function(vec) {
    this.cur_path_count  = 0;
    this.cur_index_count = 0;
    this.pg              = 0;
}

SensorPath.prototype.resetAllPath = function() {
    this.cur_pi = 0;
    // 删掉无用的buffer，节省内存
    for (var i = 0; i <= this.cur_pi; i++) {
        gl.deleteBuffer(this.buffers.path[i] );
        gl.deleteBuffer(this.buffers.index[i]);
        gl.deleteBuffer(this.buffers.color[i]);
    }
    this.all_path_count  = 0;
    this.all_index_count = 0;
    this.createBuffer();
    this.last_point = calcSensorNormal();
    this.resetCurrentPath();
}

SensorPath.prototype.createBuffer = function() {
    this.buffers.color[this.cur_pi]   = createArrayBuffer(gl.ARRAY_BUFFER,         this.buffer_path_bytes,  gl.DYNAMIC_DRAW);
    this.buffers.path[this.cur_pi]    = createArrayBuffer(gl.ARRAY_BUFFER,         this.buffer_path_bytes,  gl.DYNAMIC_DRAW);
    this.buffers.index[this.cur_pi]   = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer_index_bytes, gl.DYNAMIC_DRAW);
}

// ================= SensorPath Object ======================= //

// ****************  Cube Object (Sensor simulator)  **************** //
function Cube(radius) {
    this.downColor = [0.6, 0.1, 0.1];
    this.leftColor = [0.1, 0.6, 0.1];
    this.backColor = [0.1, 0.1, 0.6];
    this.alpha     = 0.8;
    this.radius    = radius;
    this.direction = [0.5, 0];  // 0.5 == u,  0 == v
    this.mvMatrix  = mat4.create();
    this.mMatrix   = mat4.create();
}

Cube.prototype.setRadius = function(radius) {
    this.radius = radius;
}

Cube.prototype.init = function(gl) {

}

Cube.prototype.paint = function(gl, u, v) {

}

/**
 * 根据 u，v 计算传感器模拟长方体当前的位置
 * @param {double} u
 * @param {double} v
 * @param {double} offset 与原点的距离
 * @param {*} rgb  三维数组
 * @returns 坐标和颜色的数组
 */
Cube.prototype.getCubePoint = function(u, v, f, offset) {

}
// =================  Cube Object  =================== //

// **************** Ball Object **************** //
/**
 *  n   循环次数，绘制球形时的精度
 *  r   球体的半径
 */
function Ball(n) {
    this.n = n;
    this.dr = 5.0;  // default radius
    this.line_alpha = 0.55;
    this.mMatrix    = mat4.create();
    this.vscale     = vec3.create();
}

Ball.prototype.init = function(gl) {
    this.getVertex();
    this.getIndex();
    this.buffers = {};

    // vertex info，static_draw is enough for both vertex and index now
    this.buffers.vertex          = createArrayBuffer(gl.ARRAY_BUFFER,         new Float32Array(this.vertex),         gl.STATIC_DRAW);
    this.buffers.vertex_index    = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.vertex_index),    gl.STATIC_DRAW);
    this.buffers.line_index      = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.line_index),      gl.STATIC_DRAW);
    this.buffers.less_line_index = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.less_line_index), gl.STATIC_DRAW);
    this.buffers.less_ls_index   = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.less_ls_index),   gl.STATIC_DRAW);
    this.buffers.color           = createArrayBuffer(gl.ARRAY_BUFFER,         new Float32Array(this.color),          gl.STATIC_DRAW);        // color info for each vertex
    // no need for normal vertex buffer anymore
    // this.vertex_normal_buffer   = createArrayBuffer(gl.ARRAY_BUFFER,         new Float32Array(this.vertex),    gl.STATIC_DRAW);
}

Ball.prototype.paint = function(gl, radius) {
    this.vscale     = vec3.fromValues(1.0, 1.0, 1.0);
    vec3.scale(this.vscale, this.vscale, radius / this.dr * 0.5);
    mat4.identity(this.mMatrix);
    mat4.scale(this.mMatrix, this.mMatrix, this.vscale);

    mat4.multiply(mvpMatrix, pvMatrix, this.mMatrix);
    gl.uniformMatrix4fv(uniforms.pmv_matrix, false, mvpMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);     // color buffer
    gl.vertexAttribPointer(attributes.color,           3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.vertex);    // normal info
    gl.vertexAttribPointer(attributes.vertex_normal,   3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.vertex);    // vertex info
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
    
    gl.uniform1f(uniforms.alpha, this.line_alpha);          //  set alpha value
    switch (canvasArgs.drawMode) {
        case "line":
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.line_index);
            gl.drawElements(gl.LINES, this.line_index.length, gl.UNSIGNED_SHORT, 0);
            break;
        case "lessLine":
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.less_line_index);
            gl.drawElements(gl.LINES, this.less_line_index.length, gl.UNSIGNED_SHORT, 0);
            // the surface on which equator lies
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.less_ls_index);
            gl.drawElements(gl.TRIANGLE_FAN, this.less_ls_index.length, gl.UNSIGNED_SHORT,  0);  // multiply 2 times means that UNSIGNED_SHORT occupies 2 bytes
            break;
        case "calibration":
        case "surface":
        default:
            gl.uniform1f(uniforms.alpha, canvasArgs.ball_alpha);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.vertex_index);
            gl.drawElements(gl.TRIANGLES, this.vertex_index.length, gl.UNSIGNED_SHORT, 0);
            break;
    }
}

/**
 * 计算得到球面的所有顶点的位置
 * 先绘制经线，后绘制纬线
 * 返回所有类型的顶点个数
 */
Ball.prototype.getVertex = function() {
    var n = this.n;
    var r = this.dr;
    var vertex = []; 
    var color  = [];
    //    var vn = [];        // 顶点法向量数组，当球心在原点时，与顶点坐标相同
    var i, j, k;
    // i indicates vertical line while j indicates horizontal line, 
    // vertical line is half a circle, so the number should be 1 more 
    for (j = 0; j <= n; j++) {
        for (i = 0; i <= n; i++) {
            // (n+1)*n points are needed
            k = calcVertex(degToRad(i/n*180), degToRad(j/n*360), r);
            vertex.push.apply(vertex, k);
            color.push(0.3, 0.3, 0.3);
        }
    }
    // add origin point into array
    vertex.push.apply(vertex, [0, 0, 0]);
    color.push(0.3, 0.3, 0.3);
    this.vertex = vertex;
    this.color  = color;
}

/**
 * 获取绘制球面时需要的顶点索引
 */
Ball.prototype.getIndex = function() {
    var n       = this.n;
    var vertexIndex   = []; // surfaceDrawMode  绘制时所用的索引
    var lineIndex     = []; // lineDrawMode     绘制时所用的索引
    var lessLineIndex = []; // lessLineDrawMode 绘制时所用的索引
    var lessLSIndex   = []; 
    var i = 0, j = 0;

    for (j = 0; j < n; j++) {  // the last half circle (j = 0) overlaps the first one (j = 0)
        for (i = 0; i < n+1; i++) {
            // for line mode index
            lineIndex.push( 
                this.calcIndex(i, j),
                this.calcIndex(i+1, j), 
                this.calcIndex(i, j),   
                this.calcIndex(i, j+1)
            );
            
            // for surface mode index
            vertexIndex.push(
                this.calcIndex(i, j),       // 0
                this.calcIndex(i+1, j),     // 1
                this.calcIndex(i+1, j+1)    // n+1
            );
            vertexIndex.push(
                this.calcIndex(i, j),       // 0
                this.calcIndex(i+1, j+1),   // n+1
                this.calcIndex(i, j+1)      // n
            );
        }
    }
    for (i = 0; i < n+1; i++) {
        // 绘出 4 条经线
        lessLineIndex.push( this.calcIndex(i, 0),      this.calcIndex(i+1, 0)      );
        lessLineIndex.push( this.calcIndex(i, 0.25*n), this.calcIndex(i+1, 0.25*n) );
        lessLineIndex.push( this.calcIndex(i, 0.5 *n), this.calcIndex(i+1, 0.5 *n) );
        lessLineIndex.push( this.calcIndex(i, 0.75*n), this.calcIndex(i+1, 0.75*n) );
    }
    for (j = 0; j < n; j++) {  
        i = n / 2 ;
        lessLineIndex.push(this.calcIndex(i, j), this.calcIndex(i, j+1)); // equator line
    }
    // 赤道所在平面
    for (j = n*0.5; j < n*0.75+1; j++) {
        // 原点 -- 赤道上的点 -- 赤道上的点
        // lessLineIndex.push(this.calcIndex(n+1, n-1), this.calcIndex(n/2, j), this.calcIndex(n/2, j));
        // lessLineIndex.push(this.calcIndex(n+1, n-1), this.calcIndex(n/2, j), this.calcIndex(n/2, j));
        lessLSIndex.push(this.calcIndex(n*0.5, j));
    }
    lessLSIndex.push((n+1)*(n+1));   // origin point

    this.vertex_index = vertexIndex;
    this.line_index   = lineIndex;
    this.less_line_index = lessLineIndex;
    this.less_ls_index   = lessLSIndex;
}

/**
 * 方便计算球体索引 index 的值
 * @param  i       半圆中第 i 部分
 * @param  j       第 j 个半圆
 */
Ball.prototype.calcIndex = function(i, j) {
    return i + j * (this.n+1); 
}
// ===================== Ball Object ================ //


// ****************  Coord Object **************** //
function Coord() {
    this.coord_length = 10.0;
    this.mMatrix = mat4.create();
}

Coord.prototype.init = function(gl) {
    this.buffers = {};
    var coordVertex = [ // x coord
        0.0, 0.0, 0.0,
        this.coord_length, 0.0, 0.0,
        // y coord
        0.0, 0.0, 0.0,
        0.0, this.coord_length, 0.0,
        // z coord
        0.0, 0.0, 0.0,
        0.0, 0.0, this.coord_length
    ];
    var coordIndex = [0, 1, 2, 3, 4, 5];
    // 坐标轴的颜色
    var lineColorData = [
        // x
        0.9, 0.1, 0,
        0.9, 0.1, 0,
        // y
        0, 0.9, 0,
        0, 0.9, 0,
        // z blue
        0, 0, 0.9,
        0, 0, 0.9,
    ];

    // 顶点信息，索引只需要用static draw
    this.buffers.coord  = createArrayBuffer(gl.ARRAY_BUFFER,         new Float32Array(coordVertex),   gl.STATIC_DRAW);
    this.buffers.index  = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(coordIndex),     gl.STATIC_DRAW);
    this.buffers.color  = createArrayBuffer(gl.ARRAY_BUFFER,         new Float32Array(lineColorData), gl.STATIC_DRAW);
}

Coord.prototype.paint = function(gl) {
    mat4.multiply(mvpMatrix, pvMatrix, this.mMatrix);
    gl.uniformMatrix4fv(uniforms.pmv_matrix, false, mvpMatrix);

    gl.uniform1f(uniforms.alpha, 1.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
    gl.vertexAttribPointer(attributes.color,           3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.coord);      // normal
    gl.vertexAttribPointer(attributes.vertex_normal,   3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.coord);      // vertex
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
    // 绘制坐标轴
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.index);
    gl.drawElements(gl.LINES, 6, gl.UNSIGNED_SHORT, 0);
}
// ================  Coord Object ================ //

// **************** ReferenceCircle Object **************** //
// 球面上的参考圆圈
function RefCircle(sides, radius) {
    this.sides    = sides;
    this.greenNum = 6;
    this.radius   = radius;
}

RefCircle.prototype.init = function() {
    this.record_point_index = [];
    this.record_point = [];

    // 绘制参考圆圈
    var refpoints = this.getPoints();
    var coordIndex = [];
    var i = 0, j = 0;
    for (i = 0; i < 26; i++) {
        for (j = 1; j < pointVertexSides; j++) {
            coordIndex.push(i * (pointVertexSides + 1) + j);
            coordIndex.push(i * (pointVertexSides + 1) + j + 1);
        }
        coordIndex.push(i * (pointVertexSides + 1) + pointVertexSides);
        coordIndex.push(i * (pointVertexSides + 1) + 1);
    }

    this.refcircle_buffer       = createArrayBuffer(gl.ARRAY_BUFFER,         new Float32Array(refpoints), gl.DYNAMIC_DRAW);
    this.refcircle_index_buffer = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(coordIndex), gl.STATIC_DRAW);
    // normal line
    var normal = [];
    for(i = 0; i < refpoints.length / 3; i++) {
        normal.push.apply(normal, canvasArgs.light_direction);
    }
    this.normal_buffer       = createArrayBuffer(gl.ARRAY_BUFFER, new Float32Array(normal), gl.STATIC_DRAW);
    this.record_buffer       = createArrayBuffer(gl.ARRAY_BUFFER,         4 * maxPathNum, gl.DYNAMIC_DRAW);
    this.record_index_buffer = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, 8 * maxPathNum, gl.DYNAMIC_DRAW);
}


/**
 *  绘制球面上的参考圆圈
 *  首先设置线宽和颜色
 **/
RefCircle.prototype.paint = function(gl) {
    gl.bindBuffer(gl.ARRAY_BUFFER,         this.normal_buffer);
    gl.vertexAttribPointer(attributes.vertex_normal,   3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER,         this.refcircle_buffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.refcircle_index_buffer);
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);

    // 画出球面上的圆圈，绿色的圆圈个数为6,先画出绿色圆圈，然后画出蓝色圆圈
    gl.lineWidth(3.0);
    gl.uniform4fv(uniforms.color_unit, [0.05, 1.0, 0.1, 1.0]);
    gl.drawElements(gl.LINES, this.sides * 2 * this.greenNum, gl.UNSIGNED_SHORT, 0); // x2 是线段需要的索引数
    gl.uniform4fv(uniforms.color_unit, [0.05, 0.1, 1.0, 1.0]);
    gl.drawElements(gl.LINES, (26 - this.greenNum) * this.sides * 2, gl.UNSIGNED_SHORT, this.sides * 2 * this.greenNum * 2);
    gl.lineWidth(canvasArgs.line_width);
    // 进行采点操作
    if(this.record_point.length > 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.record_buffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.record_index_buffer);
        gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
        gl.uniform4fv(uniforms.color_unit, [0.1, 0.1, 0.95, 1.1]); // 传入颜色 uniform，就不再需要颜色顶点数据
        gl.drawElements(gl.TRIANGLES, this.record_point_index.length, gl.UNSIGNED_SHORT, 0);
    }
    gl.uniform4fv(uniforms.color_unit, [0.0, 0.0, 0.0, 0.0]);
}

RefCircle.prototype.repaint = function(radius) {
    this.radius = radius;
    var refcirclePoints = refCircle.getPoints();
    updateSubBuffer(gl.ARRAY_BUFFER, this.refcircle_buffer, 0, new Float32Array(refcirclePoints));
}

// 获取参考圆圈的顶点
RefCircle.prototype.getPoints = function() {
    var i, j;
    var points = [];
    var sensorPoint;

    points.push.apply(points, calcSensorPoint([0, 0, 0], this.radius, 0.15, this.sides)); // north polar
    points.push.apply(points, calcSensorPoint([1, 0, 0], this.radius, 0.15, this.sides)); // south polar

    // 赤道上 0, 90, 180, 270 位置上的四个圆圈
    i = 2;
    for (j = 0; j < 8; j = j + 2) {
        sensorPoint = calcSensorPoint([i / 4, j / 8, 0], this.radius, 0.15, this.sides);
        points.push.apply(points, sensorPoint);
    }
    for (j = 1; j < 8; j = j + 2) {
        sensorPoint = calcSensorPoint([i / 4, j / 8, 0], this.radius, 0.15, this.sides);
        points.push.apply(points, sensorPoint);
    }

    for (j = 0; j < 8; j++) {
        for (i = 1; i < 4; i += 2) {
            sensorPoint = calcSensorPoint([i / 4, j / 8, 0], this.radius, 0.15, this.sides);
            points.push.apply(points, sensorPoint);
        }
    }
    return points;
}

// 打点操作
RefCircle.prototype.record = function() {
    var n = this.record_point.length / 3;
    var i = 0;
    var sensorPoint = calcSensorPoint([u, v, 0], this.radius, canvasArgs.point_size, this.sides);
    this.record_point.push.apply(this.record_point, sensorPoint);
    var vertexIndex = [];
    for (i = 1; i < this.sides; i++) {
        vertexIndex.push(
            n + 0, n + i, n + i + 1,
            n + 0, n + i + 1, n + i);
    }
    vertexIndex.push(
        n + 0, n + this.sides, n + 1,
        n + 0, n + 1, n + this.sides);
    this.record_point_index.push.apply(this.record_point_index, vertexIndex);
    updateSubBuffer(gl.ARRAY_BUFFER,         this.record_buffer,       0, new Float32Array(this.record_point));
    updateSubBuffer(gl.ELEMENT_ARRAY_BUFFER, this.record_index_buffer, 0, new Uint16Array(this.record_point_index));
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
}

// 重置已经打的点s
RefCircle.prototype.reset = function() {
    this.recordPointsAngle  = [];
    this.record_point       = [];
    this.record_point_index = [];
}
// ================= ReferenceCircle Object =======================//
