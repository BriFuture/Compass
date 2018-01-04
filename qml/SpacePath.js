/******************************
  filename: SpacePath.js
  feature:  绘制 3D 动态图形
  author:   brifuture
  date:     2017.04.10
  Last Update :  2018.01.03, seperate each object into different reign whose ratation
        and transparation is controlled by itself.
*******************************/

Qt.include("gl-matrix.js");

/* 保存画布上下文 */
var gl;
var gl2d;  // this is used for HUD drawing

var width = 0;
var height = 0;

var attributes = {};  // attribute variables from shader
var uniforms = {};    // uniform variables from shader

// matrixs
var pMatrix   = mat4.create();
var mMatrix   = mat4.create();
var vMatrix   = mat4.create();
var pmvMatrix = mat4.create();
var nMatrix   = mat4.create();


// 绘制球面时的精度, 至少为 4 的倍数
var accuracy = 48;

// 传感器路径
var maxPathNum  = 4800; // 每条路径上的最多点的个数,由于每个 sensorPoint 面有 8*3 个数据，该数值最好为 24 的整数倍
var currentPath = 0; // 当前路径的序号
var pointVertexSides = 12;

// 相关绘图变量
var canvasArgs;
var u, v;

/**
  * UI initializing
**/
function initUI() {
    selectDrawMode(lineRB);
    argItem.ball_radius = 5
    argItem.cam_dis     = 18
    argItem.cam_theta   = 90
    argItem.cam_beta    = 0
    argItem.cam_x       = 15
    argItem.cam_y       = 5
    argItem.cam_z       = 5
    argItem.line_width  = 1.0
    argItem.point_size  = 15
    argItem.path_width  = 30
    argItem.ball_alpha  = 0.5
    canvasArgs = argItem

    axisBox.checked = false;
    selectDrawMode(surfaceRB);
}

function selectDrawMode(mode) {
    lineRB.checked    = false;
    surfaceRB.checked = false;
    lessLineRB.checked= false;
    caliRB.checked    = false;
    mode.checked      = true;
    argItem.drawMode  = mode.text;
}

// some problem occurred when cam_x or cam_y equals to zero
function rotateCamera() {
    var pos = calcVertex(argItem.cam_theta / 180, argItem.cam_beta / 360, argItem.cam_dis);
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

var coord;
var ball;
var sensorPoint;
var cube;
var refCircle;

function initializeGL(canvas) {
    gl  = canvas.getContext("canvas3d",
                           { depth: true, antilias: true }
                           );
    gl2d = canvas.getContext("2d");
    gl.enable(gl.DEPTH_TEST);  // depth test
    gl.depthFunc(gl.LESS);
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
        'attribute vec3  aColor;\n'          +
        'uniform highp mat4 uPMVMatrix;\n'   +
        'uniform highp mat4 uMMatrix;\n'     +
        'uniform vec3 uLightDirection;\n'    + // 直射光的方向
        'uniform vec3  uLight;\n'            +
        'varying vec3  vLight;\n'            +
        'void main(void) {\n'                +
        '  gl_Position = uPMVMatrix * vec4(aVertexPosition, 1.0);\n'      +
        '  highp vec3 ambientLight = vec3(0.28, 0.28, 0.28);\n'           +
        '  highp vec3 directionalLightColor = vec3(0.51, 0.55, 0.52);\n'  +
        '  highp float directional = max(dot(aVertexNormal, normalize(uLightDirection)), 0.0);\n' +        // 直接使用顶点的法线数据进行漫反射计算
        '  vLight = aColor * (ambientLight + (directionalLightColor * directional));\n'  +
        '}\n';
    var vertexShader = getShader(gl, vertexCode, gl.VERTEX_SHADER);

    var fragCode =
        'varying vec3 vLight;\n'          +
        'uniform float uAlpha;\n'         +
        'uniform vec4 uFragColor;\n'      +
        'void main(void) {\n'             +
        '  gl_FragColor = vec4(vLight, uAlpha);\n'  +
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
    ball        = new Ball(accuracy, canvasArgs.ball_radius);
    sensorPoint = new SensorPoint(pointVertexSides);
    refCircle   = new RefCircle(pointVertexSides, canvasArgs.ball_radius);
    cube        = new Cube(canvasArgs.ball_radius);
    ball.init(gl);
    coord.init(gl);
    // sensorPoint.init(gl);
    // refCircle.init(gl);
    // cube.init(gl);
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
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);   // clear color buffer and depth buffer bit 
    mat4.lookAt(vMatrix, [canvasArgs.cam_x, canvasArgs.cam_y, canvasArgs.cam_z], [0, 0, 0], [0, 0, 1]);
    
    gl.uniform3fv(uniforms.light_direction, canvasArgs.light_direction);  // where light origins
    setArguments();
    startPaint();
}

/** 开始执行实际的绘图操作，由于开启了 ALPHA BLEND 功能，先绘制球内物体 **/
function startPaint(canvas) {
    
    var angle = calcAngle(canvasArgs.pitch, canvasArgs.heading);

    coord.paint(gl);
    ball.paint(gl);
}

function updateSubBuffer(type, buffer, offset, data) {
    gl.bindBuffer(type, buffer);
    gl.bufferSubData(type, offset, data);
}

function setArguments() {
    /** 如果 heading 有偏移，应把偏移算上(以复位后的位置作为基准方向) **/
    canvasArgs.heading = canvasArgs.heading - canvasArgs.heading_offset;
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
 * 假设球心即为原点，将球面坐标系转换成平面直角坐标系
 * @param   u   球心到顶点的连线与 Z 轴正方向的夹角为 theta, u = theta / pi,   0<= u <= 1
 * @param   v   球心到顶点的连线在 xoy 平面上的投影与 X 轴正方向的夹角为 beta, v = beta / (2*pi), 0<= v <= 1
 * @param   r   球半径
 * @return      顶点的坐标，用三维数组表示
 */
function calcVertex(u, v, r) {
    var st = Math.sin(Math.PI * u);
    var ct = Math.cos(Math.PI * u);
    var sb = Math.sin(Math.PI * 2 * v);
    var cb = Math.cos(Math.PI * 2 * v);
    var x = r * st * cb;
    var y = r * st * sb;
    var z = r * ct;
    return [x, y, z];
}


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


// **************** SensorPoint Object **************** //
function SensorPoint(sides) {
    this.sides      = sides;
    this.pathCount  = 0;
    this.lastPoint  = [-1, -1, -1];
    this.sensorPath = [];
}

SensorPoint.prototype.setLastPoint = function(u, v, l) {
    this.lastPoint = [u, v, l];
}

SensorPoint.prototype.init = function() {
    /** 将 sensor point 显示为圆形  **/
    // 初始化顶点，以便在缓冲区分配空间
    var vertexPoint = calcSensorPoint([0.5, 0.0, 0.0], 1, canvasArgs.point_size, this.sides, [0.0, 0.0, 0.0]);
    vertexPoint = vertexPoint.concat([0, 0, 0], [0.0, 0.0, 0.0]) // 手动将原点添加进去
    this.vertex_buffer = createArrayBuffer(gl.ARRAY_BUFFER, new Float32Array(vertexPoint), gl.DYNAMIC_DRAW);
    // sensor point 绘制正反两面，索引不需要改变
    var vertexIndex = [];
    var i = 0;
    for (i = 1; i < this.sides; i++) {
        //        vertexIndex.push(this.sides+1, i, i+1, this.sides+1, i+1, i);
        vertexIndex.push(0, i, i + 1, 0, i + 1, i);
    }
    //    vertexIndex.push(this.sides+1, 1, this.sides, this.sides+1, this.sides, 1);
    vertexIndex.push(0, 1, this.sides, 0, this.sides, 1);
    for (i = 0; i < this.sides; i++) {
        //        vertexIndex.push(0, i, i+1, 0, i+1, i, this.sides+1, i, i+1, this.sides+1, i+1, i);
        vertexIndex.push(this.sides + 1, i, i + 1,
            this.sides + 1, i + 1, i);
    }
    this.index_buffer = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndex), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 6 * 4, 0);

    // path Buffer initialization
    this.path_buffer        = [];
    this.path_index_buffer  = [];
    this.path_index2_buffer = [];
    this.path_buffer[currentPath]        = createArrayBuffer(gl.ARRAY_BUFFER,     4 * maxPathNum, gl.DYNAMIC_DRAW);
    this.path_index_buffer[currentPath]  = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, 4 * maxPathNum, gl.DYNAMIC_DRAW);
    this.path_index2_buffer[currentPath] = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, 2 * maxPathNum, gl.DYNAMIC_DRAW);
    this.path_index = [];
    this.path_index2 = [];
}

/**
 * 绘制传感器指向的方向，如果需要记录路径的话，从当前位置开始记录路径
 * @param {*} gl
 * @param {*} pitch     俯仰角的角度，范围是[-180, 180]
 * @param {*} heading   航向角的角度，增大的方向为从 Z 轴正无穷远处向原点看时顺时针方向，范围是[0, 360)
 * @param {*} offset    斑点到原点的距离
 * @param {*} radial    是否绘制射线
 */
SensorPoint.prototype.paint = function(gl, u, v, offset, radial) {
    gl.uniform4fv(uniforms.color_unit, [0.0, 0.8, 0.6, 1.0]);
    /******** 在球面上绘制斑点，连接原点到球面斑点的线段 **********/
    var sensorPoint = calcSensorPoint([u, v, 0], offset, canvasArgs.point_size, this.sides);
    updateSubBuffer(gl.ARRAY_BUFFER, this.vertex_buffer, 0, new Float32Array(sensorPoint))
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(attributes.vertex_normal, 3, gl.FLOAT, false, 0, 0); // 认为顶点方向就是法线方向
    //    gl.vertexAttribPointer(attributes.color,           3, gl.FLOAT, false, 6*4, 3*4);          // 偏移量为 3 个数据 * sizeof(float)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
    if (radial) {
        // 由于需要绘制射线，因此索引数目需要加倍
        gl.drawElements(gl.TRIANGLES, this.sides * 6 * 2, gl.UNSIGNED_SHORT, 0);
    } else {
        gl.drawElements(gl.TRIANGLES, this.sides * 6, gl.UNSIGNED_SHORT, 0);
    }

    gl.uniform4fv(uniforms.color_unit, [0.0, 0.0, 0.0, 0.0]);
}

/**
 * 绘制路径
 * 全部改成用直线相连
 * 通过线性插值后，不用记录每个顶点，如果前后两点之间的距离过大，用线性插值加入路径中
 **/
SensorPoint.prototype.drawPath = function(gl, u, v) {
    gl.uniform4fv(uniforms.color_unit, [0.0, 0.0, 0.6, 1.0]); // 传入颜色 uniform，就不再需要颜色顶点数据
    //     * 使用全局数组绘制路径，使用内存和绘制耗时较多，但没有显示错误
    //     * 取消了颜色和顶点数据的绑定，不需要对内存进行偏移
    if (calcVertexDistance([u, v, canvasArgs.vector_length], this.lastPoint) > canvasArgs.point_size * 0.2) {
        var sensorPoint = this.getLinearSensorPoint([u, v, canvasArgs.vector_length], this.lastPoint);
        this.lastPoint = [u, v, canvasArgs.vector_length];
        var n = this.sensorPath.length / 24; // 第 n 个 sensorPoint

        // 向路径中添加新的位置
        //      ** 当 sensorPath.length 超过 20000 时，数组过大，不再显示顶点
        this.sensorPath.push.apply(this.sensorPath, sensorPoint); // 每 24 个数据意味着包含一个 SensorPoint, 每 6 个数据代表一个点
        this.path_index.push(
            n * 8 + 0, n * 8 + 4, n * 8 + 1, n * 8 + 1, n * 8 + 4, n * 8 + 5,   // 0 - 1 - 0' - 1'
            n * 8 + 1, n * 8 + 5, n * 8 + 2, n * 8 + 2, n * 8 + 6, n * 8 + 5,   // 1 - 2 - 1' - 2'
            n * 8 + 2, n * 8 + 6, n * 8 + 3, n * 8 + 3, n * 8 + 7, n * 8 + 6,   // 2 - 3 - 2' - 3'
            n * 8 + 3, n * 8 + 7, n * 8 + 0, n * 8 + 0, n * 8 + 4, n * 8 + 7,   // 3 - 0 - 3' - 0'
            n * 8 + 0, n * 8 + 1, n * 8 + 4, n * 8 + 1, n * 8 + 5, n * 8 + 4,   // 0 - 1 - 1' - 0'
            n * 8 + 1, n * 8 + 2, n * 8 + 5, n * 8 + 2, n * 8 + 5, n * 8 + 6,   // 1 - 2 - 2' - 1'
            n * 8 + 2, n * 8 + 3, n * 8 + 6, n * 8 + 3, n * 8 + 6, n * 8 + 7,   // 2 - 3 - 3' - 2'
            n * 8 + 3, n * 8 + 0, n * 8 + 7, n * 8 + 0, n * 8 + 7, n * 8 + 4    // 3 - 0 - 0' - 3'
        );
        this.path_index2.push(
            n * 8 + 0, n * 8 + 1, n * 8 + 4, n * 8 + 0, n * 8 + 1, n * 8 + 5,   // 0 - 1 - 0' - 1'
            n * 8 + 1, n * 8 + 2, n * 8 + 5, n * 8 + 1, n * 8 + 2, n * 8 + 6,   // 1 - 2 - 1' - 2'
            n * 8 + 2, n * 8 + 3, n * 8 + 6, n * 8 + 2, n * 8 + 3, n * 8 + 7,   // 2 - 3 - 2' - 3'
            n * 8 + 3, n * 8 + 0, n * 8 + 7, n * 8 + 3, n * 8 + 0, n * 8 + 4    // 3 - 0 - 3' - 0'
        );

        this.pathCount++;
        updateSubBuffer(gl.ARRAY_BUFFER,         this.path_buffer[currentPath],        0, new Float32Array(this.sensorPath));
        updateSubBuffer(gl.ELEMENT_ARRAY_BUFFER, this.path_index_buffer[currentPath],  0, new Uint16Array(this.path_index));
        updateSubBuffer(gl.ELEMENT_ARRAY_BUFFER, this.path_index2_buffer[currentPath], 0, new Uint16Array(this.path_index2));
        if (this.path_index.length >= 2 * maxPathNum) {
            currentPath++;
            this.path_buffer[currentPath]        = createArrayBuffer(gl.ARRAY_BUFFER, 4 * maxPathNum,         gl.DYNAMIC_DRAW);
            this.path_index_buffer[currentPath]  = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, 4 * maxPathNum, gl.DYNAMIC_DRAW);
            this.path_index2_buffer[currentPath] = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, 2 * maxPathNum, gl.DYNAMIC_DRAW);
            this.resetCurrentPath(u, v, canvasArgs.vector_length);
        }
    }
    // 分批绘制路径
    for (var i = 0; i < currentPath; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.path_buffer[i]);
        gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
        if (canvasArgs.path_real_line) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.path_index_buffer[i]);
            gl.drawElements(gl.TRIANGLES, 2 * maxPathNum, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.path_index2_buffer[i]);
            gl.drawElements(gl.TRIANGLES, maxPathNum, gl.UNSIGNED_SHORT, 0);
        }
    }
    if (this.path_index.length > 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.path_buffer[currentPath]);
        gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
        if (canvasArgs.path_real_line) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.path_index_buffer[currentPath]);
            gl.drawElements(gl.TRIANGLES, this.path_index.length, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.path_index2_buffer[i]);
            gl.drawElements(gl.TRIANGLES, this.path_index2.length, gl.UNSIGNED_SHORT, 0);
        }
    }
    gl.uniform4fv(uniforms.color_unit, [0.0, 0.0, 0.0, 0.0]);
}

/**
 * 线性插值，得到一系列补充的 sensorPoint, 用于绘制路径
 * @param {Array} p     p[0] = u    p[1] = v    p[2] = radius
 * @param {Array} lp    lp[0] = lu  lp[1] = lv  lp[2] = lradius
 * @param {*} u         与 theta 角对应，l 前缀表示上一个点
 * @param {*} v         与 beta  角对应
 * @param {*} radius    与原点的距离
 */
SensorPoint.prototype.getLinearSensorPoint = function(p, lp) {
    var u = p[0],
        v = p[1],
        offset = p[2];
    var lu = lp[0],
        lv = lp[1],
        loffset = lp[2];
    var linearSensorPoint = [];

    //    /* 将对应面上的四个点用索引相连接，节省内存
    var uoff = canvasArgs.path_size / 180;
    var voffp = canvasArgs.path_size / 360 / Math.sin(Math.PI * (u + uoff));
    var voffs = canvasArgs.path_size / 360 / Math.sin(Math.PI * (u - uoff));
    var voffp2 = canvasArgs.path_size / 360 / Math.sin(Math.PI * (lu + uoff));
    var voffs2 = canvasArgs.path_size / 360 / Math.sin(Math.PI * (lu - uoff));

    // 0 - 1 - 2 - 3  first
    linearSensorPoint.push.apply(linearSensorPoint, calcVertex(u - uoff, v - voffs, offset)); // 0
    linearSensorPoint.push.apply(linearSensorPoint, calcVertex(u + uoff, v - voffp, offset)); // 1
    linearSensorPoint.push.apply(linearSensorPoint, calcVertex(u + uoff, v + voffp, offset)); // 2
    linearSensorPoint.push.apply(linearSensorPoint, calcVertex(u - uoff, v + voffs, offset)); // 3
    // 0' - 1' - 2' - 3'  second
    linearSensorPoint.push.apply(linearSensorPoint, calcVertex(lu - uoff, lv - voffs2, loffset)); // 0'
    linearSensorPoint.push.apply(linearSensorPoint, calcVertex(lu + uoff, lv - voffp2, loffset)); // 1'
    linearSensorPoint.push.apply(linearSensorPoint, calcVertex(lu + uoff, lv + voffp2, loffset)); // 2'
    linearSensorPoint.push.apply(linearSensorPoint, calcVertex(lu - uoff, lv + voffs2, loffset)); // 3'
    //    */

    //    linearSensorPoint.push.apply(linearSensorPoint, this.getSensorPathPoint([u, v, -0.375], offset, canvasArgs.path_size, 4));
    //    linearSensorPoint.push.apply(linearSensorPoint, this.getSensorPathPoint([lu, lv, -0.375], loffset, canvasArgs.path_size, 4));
    return linearSensorPoint;
}

SensorPoint.prototype.getSensorPathPoint = function(angles, offset, pointSize, n) {
    var u = angles[0];
    var v = angles[1];
    var f = angles[2];
    var sensorPoint = [];
    var points = []; // 二维数组，每个元素是一个三维数组，包含顶点的 xyz 坐标
    points.push.apply(points, drawSurfaceAndMove([u, v, f], pointSize, n));

    // 将顶点添加到 sensorPoint 数组中，并将得到的平面进行平移
    points.forEach(function(element) {
        sensorPoint.push.apply(sensorPoint, movePointByAngle(element, [u, v], offset));
    });
    return sensorPoint;
}

/**
 * 重置路径变量
 */
SensorPoint.prototype.resetCurrentPath = function(u, v, length) {
    this.lastPoint   = [u, v, length];
    this.sensorPath  = [];
    this.path_index  = [];
    this.path_index2 = [];
}

SensorPoint.prototype.resetAllPath = function(u, v, length) {
    // 删掉无用的buffer，节省内存
    for (var i = 0; i < currentPath; i++) {
        gl.deleteBuffer(this.path_buffer[i]);
        gl.deleteBuffer(this.path_index_buffer[i]);
    }
    currentPath = 0;
    this.path_buffer[currentPath]        = createArrayBuffer(gl.ARRAY_BUFFER, 4 * maxPathNum, gl.DYNAMIC_DRAW);
    this.path_index_buffer[currentPath]  = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, 4 * maxPathNum, gl.DYNAMIC_DRAW);
    this.path_index2_buffer[currentPath] = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, 2 * maxPathNum, gl.DYNAMIC_DRAW);
    this.resetCurrentPath(u, v, length);
}
// ================= SensorPoint Object ======================= //

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

Cube.prototype.init = function() {
    // sensor simulator and line 长方体共需 6*4 个顶点, 每个顶点 9 个数据，数据类型为 Float32，4字节
    //    this.vertexBuffer = createArrayBuffer(gl.ARRAY_BUFFER, 4 * 24 * 9, gl.DYNAMIC_DRAW);
    var u = 0.5, v = 0;
    var sback  = this.getCubePoint(1 - u, v + 0.5, 0.125, this.radius * 0.375 * 0.3);   // surface on back
    var sfront = this.getCubePoint(u, v, 0.125, this.radius * 0.375 * 0.6);             // surface on front

    var i = 0;
    for (i = 0; i < 4; i++) {
        sfront.push(sback[i]);
    }
    var surface = [];
    var surfaceIndex = [
        2, 3, 0, 1, // front - x
        6, 7, 4, 5, // back  - red
        2, 5, 4, 3, // left  - green
        0, 7, 6, 1, // right - y
        5, 2, 1, 6, // up    - z
        3, 4, 7, 0, // down  - blue
        //                6, 7, 5, 4,     // back2
        //                0, 7, 1, 6,     // right2
        //                3, 4, 0, 7     // down2
    ];
    for (i = 0; i < 8; i++) {
        surface.push.apply(surface, sfront[surfaceIndex[i]]);
        surface.push.apply(surface, this.downColor);
    }
    for (i = 8; i < 16; i++) {
        surface.push.apply(surface, sfront[surfaceIndex[i]]);
        surface.push.apply(surface, this.leftColor);
    }
    for (i = 16; i < surfaceIndex.length; i++) {
        surface.push.apply(surface, sfront[surfaceIndex[i]]);
        surface.push.apply(surface, this.backColor);
    }

    this.vertexBuffer = createArrayBuffer(gl.ARRAY_BUFFER, new Float32Array(surface), gl.STATIC_DRAW);

    var vertexIndex = [];
    for (i = 0; i < 6; i++) {
        vertexIndex.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
    }
    this.indexBuffer = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndex), gl.STATIC_DRAW); // 索引不需改变

    /** 由于 2D 纹理只需要 xy 坐标，因此只用两个坐标表示纹理的位置即可 */
    var textureCoord = [
        // front
        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
        // back
        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
        // left
        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
        // right
        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
        // up
        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
        // down
        0.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
    ];
    this.texture_coord = createArrayBuffer(gl.ARRAY_BUFFER, new Float32Array(textureCoord), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attributes.xtexture, 2, gl.FLOAT, false, 0, 0);

    loadTextureImage("qrc:/img/x.png", 0, gl.TEXTURE0);
    loadTextureImage("qrc:/img/y.png", 1, gl.TEXTURE1);
    loadTextureImage("qrc:/img/z.png", 2, gl.TEXTURE2);
}

Cube.prototype.paint = function(gl, u, v) {
    mat4.rotate(this.mMatrix, this.mMatrix, u * Math.PI * 2, [0, 1, 0]);
    mat4.rotate(this.mMatrix, this.mMatrix, v * Math.PI * 2, [0, 0, 1]);
    mat4.multiply(this.mvMatrix, this.mMatrix, vMatrix);
    mat4.multiply(this.mvMatrix, pMatrix, this.mMatrix);
    gl.uniformMatrix4fv(uniforms.pmv_matrix, false, this.mvMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 6 * 4, 0); // 顶点间隔变为 6
    gl.vertexAttribPointer(attributes.color, 3, gl.FLOAT, false, 6 * 4, 3 * 4);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    //    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

    gl.enableVertexAttribArray(attributes.xtexture); // 使用纹理
    /** 每个面采用不同的贴图，需要分别进行绘制 **/
    gl.bindTexture(gl.TEXTURE_2D, xTexture);
    gl.uniform1i(uniforms.enable_texture, 1);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    gl.bindTexture(gl.TEXTURE_2D, yTexture);
    gl.uniform1i(uniforms.enable_texture, 2);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 18 * 2);
    gl.bindTexture(gl.TEXTURE_2D, zTexture);
    gl.uniform1i(uniforms.enable_texture, 3);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 24 * 2);
    gl.uniform1i(uniforms.enable_texture, 0);
    //    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 6*2);
    //    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 12*2);
    //    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 30*2);
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    /** 取消纹理，如果不取消使用纹理的话，会导致之后的图形无法正常显示 **/
    gl.disableVertexAttribArray(attributes.xtexture);
    gl.uniformMatrix4fv(uniforms.pmv_matrix, false, pmvMatrix);
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
    var cubePoint = [];
    var points = drawSurfaceAndMove([u, v, f], this.radius * 0.375 * 0.2, 4);
    var i = 0;
    for (i = 0; i < 4; i++) {
        cubePoint.push(movePointByAngle(points[i], [u, v], offset));
    }
    return cubePoint;
}
// =================  Cube Object  =================== //

// **************** Ball Object **************** //
/**
 *  n   循环次数，绘制球形时的精度
 *  r   球体的半径
 */
function Ball(n, r) {
    this.n = n;
    this.r = r;
    this.line_alpha    = 0.55;
    this.mvMatrix = mat4.create();
}

Ball.prototype.init = function(gl) {
    var ball  = this.getVertex();
    var index = this.getIndex();
    this.vertex_num            = ball.vertex.length;
    this.vertex_index_length   = index.vertexIndex.length;
    this.line_index_length     = index.lineIndex.length
    this.lessline_index_length = index.lessLineIndex.length;

    // vertex info，static_draw is enough for index
    this.vertex_buffer          = createArrayBuffer(gl.ARRAY_BUFFER,         new Float32Array(ball.vertex), gl.DYNAMIC_DRAW);
    this.vertex_index_buffer    = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(index.vertexIndex),   gl.STATIC_DRAW);
    this.line_index_buffer      = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(index.lineIndex),     gl.STATIC_DRAW);
    this.less_line_index_buffer = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(index.lessLineIndex), gl.STATIC_DRAW);
    // no need for vertex buffer anymore
    // this.vertex_normal_buffer   = createArrayBuffer(gl.ARRAY_BUFFER,         new Float32Array(ball.vertex),    gl.STATIC_DRAW);
    // color info for each vertex
    this.color_buffer           = createArrayBuffer(gl.ARRAY_BUFFER,         new Float32Array(ball.color), gl.STATIC_DRAW);
}

Ball.prototype.paint = function(gl) {
    mat4.multiply(this.mvMatrix, pMatrix, vMatrix);
    gl.uniformMatrix4fv(uniforms.pmv_matrix, false, this.mvMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.color_buffer);
    gl.vertexAttribPointer(attributes.color, 3, gl.FLOAT, false, 0, 0);
    // 法线数据
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
    gl.vertexAttribPointer(attributes.vertex_normal,   3, gl.FLOAT, false, 0, 0);
    // 顶点数据
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
    
    gl.uniform1f(uniforms.alpha, this.line_alpha);          //  set alpha
    switch (canvasArgs.drawMode) {
        case "line":
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.line_index_buffer);
            gl.drawElements(gl.LINES, this.line_index_length, gl.UNSIGNED_SHORT, 0);
            break;
        case "lessLine":
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.less_line_index_buffer);
            gl.drawElements(gl.LINES, this.n*10+6, gl.UNSIGNED_SHORT, 0);
            console.log("lessLine: "+this.lessline_index_length);
            // 绘制赤道所在的圆面
            gl.drawElements(gl.TRIANGLE_FAN, this.n*10+6, gl.UNSIGNED_SHORT, (this.n*0.25*2) );  // multiply 2 times means that UNSIGNED_SHORT occupies 2 bytes
            break;
        case "calibration":
        case "surface":
        default:
            // 绘制球形
            gl.uniform1f(uniforms.alpha, canvasArgs.ball_alpha);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertex_index_buffer);
            gl.drawElements(gl.TRIANGLES, this.vertex_index_length, gl.UNSIGNED_SHORT, 0);
            break;
    }
}

Ball.prototype.repaint = function(r) {
    this.r = r;
    var bvertex = this.getVertex();
    updateSubBuffer(gl.ARRAY_BUFFER, this.vertex_buffer, 0, new Float32Array(bvertex.vertex));
}

/**
 * 计算得到球面的所有顶点的位置
 * 先绘制经线，后绘制纬线
 * 返回所有类型的顶点个数
 */
Ball.prototype.getVertex = function() {
    var n = this.n;
    var r = this.r;
    var vertex = []; 
    var color  = [];
    //    var vn = [];        // 顶点法向量数组，当球心在原点时，与顶点坐标相同
    var i, j, k;
    // i indicates vertical line while j indicates horizontal line, 
    // vertical line is half a circle, so the number should be 1 more 
    for (j = 0; j <= n; j++) {
        for (i = 0; i <= n; i++) {
            // (n+1)*n points are needed
            k = calcVertex(i/n, j/n, r);
            vertex.push.apply(vertex, k);
            color.push(0.3, 0.3, 0.3);
        }
    }
    vertex.push.apply(vertex, [0, 0, 0]);
    color.push(0.3, 0.3, 0.3);
    // (n+1)*(n+1) times loop, so there is (n+1)*(n+1) verties
    return {
        "vertex": vertex,
        // "vertexNormal": vertex,
        "color":  color
    };
}

/**
 * 获取绘制球面时需要的顶点索引
 */
Ball.prototype.getIndex = function() {
    var n       = this.n;
    var vertexIndex   = []; // surfaceDrawMode  绘制时所用的索引
    var lineIndex     = []; // lineDrawMode     绘制时所用的索引
    var lessLineIndex = []; // lessLineDrawMode 绘制时所用的索引
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
        lessLineIndex.push(this.calcIndex(i, 0),           this.calcIndex(i+1, 0)       );
        lessLineIndex.push(this.calcIndex(i, 1/4 * n - 1), this.calcIndex(i+1, 1/4 * n - 1) );
        lessLineIndex.push(this.calcIndex(i, 1/2 * n - 1), this.calcIndex(i+1, 1/2 * n - 1) );
        lessLineIndex.push(this.calcIndex(i, 3/4 * n - 1), this.calcIndex(i+1, 3/4 * n - 1) );
    }
    for (j = 0; j < n; j++) {  
        i = n / 2 - 1;
        lessLineIndex.push(this.calcIndex(i, j), this.calcIndex(i, j+1)); // equator line
    }
    // 赤道所在平面
    for (j = n*0.5; j < n*0.75; j++) {
        // 原点 -- 赤道上的点 -- 赤道上的点
        // lessLineIndex.push(this.calcIndex(n+1, n-1), this.calcIndex(n/2, j), this.calcIndex(n/2, j));
        // lessLineIndex.push(this.calcIndex(n+1, n-1), this.calcIndex(n/2, j), this.calcIndex(n/2, j));
        lessLineIndex.push(this.calcIndex(n*0.5, j));
    }

    return {
        "vertexIndex": vertexIndex,
        "lineIndex": lineIndex,
        "lessLineIndex": lessLineIndex
    };
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
    this.mvMatrix = mat4.create();
}

Coord.prototype.init = function(gl) {
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
    this.coord_buffer       = createArrayBuffer(gl.ARRAY_BUFFER,         new Float32Array(coordVertex),   gl.STATIC_DRAW);
    this.coord_index_buffer = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(coordIndex),     gl.STATIC_DRAW);
    this.color_buffer       = createArrayBuffer(gl.ARRAY_BUFFER,         new Float32Array(lineColorData), gl.STATIC_DRAW);
}

Coord.prototype.paint = function(gl) {
    mat4.multiply(this.mvMatrix, pMatrix, vMatrix);
    gl.uniformMatrix4fv(uniforms.pmv_matrix, false, this.mvMatrix);

    gl.uniform1f(uniforms.alpha, 1.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.color_buffer);
    gl.vertexAttribPointer(attributes.color, 3, gl.FLOAT, false, 0, 0);
    // 顶点数据和法线数据
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_normal_buffer);
    gl.vertexAttribPointer(attributes.vertex_normal,   3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.coord_buffer);
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
    // 绘制坐标轴
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.coord_index_buffer);
    gl.drawElements(gl.LINES, 6, gl.UNSIGNED_SHORT, 0);
}
// ================  Coord Object ================ //
