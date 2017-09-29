/******************************
  filename: SpacePath.js
  feature:  绘制 3D 动态图形
  author:   brifuture
  date:     2017.04.10
*******************************/

Qt.include("gl-matrix.js");
Qt.include("PaintObj.js");

/* 保存画布上下文 */
var gl;
var gl2d;

var width = 0;
var height = 0;

// attribute variables from shader
var attributes = {};

// uniform variables from shader
var uniforms = {}

// 绘制缓冲区
var buffers = {};

var vertexes = {};
var indexes = {};

// matrixs
var pMatrix = mat4.create();
var mMatrix = mat4.create();
var vMatrix = mat4.create();
var pmvMatrix = mat4.create();
var nMatrix = mat4.create();

// 纹理
var xTexture;
var yTexture;
var zTexture;

// 顶点索引
var ball_vertex_count = [];

// 绘制球面时的精度, 至少为 4 的倍数
var accuracy = 48;
var calcIndexMode = "line";

// 传感器路径
var lastSensorPoint = [-1, -1, 1];
var sensorPath = [];
var maxPathNum = 4800; // 每条路径上的最多点的个数,由于每个 sensorPoint 面有 8*3 个数据，该数值最好为 24 的整数倍
var currentPath = 0; // 当前路径的序号
var pointVertexSides = 12;

// 相关绘图变量
var canvasArgs;
var u, v;
var recordPointsAngle = [];

function initializeGL(canvas) {
    gl = canvas.getContext("canvas3d", { depth: true, antilias: true });
    gl2d = canvas.getContext("2d");
    /* 设置 OpenGL 状态 */
    gl.enable(gl.DEPTH_TEST); // 深度测试
    gl.depthFunc(gl.LESS);
    gl.enable(gl.CULL_FACE); // 设置遮挡剔除有效
    gl.cullFace(gl.BACK);
    gl.clearColor(0.97, 0.97, 0.97, 1.0); // background color
    gl.clearDepth(1.0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.enable(gl.BLEND); // 开启混合，启用透明层
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.lineWidth(canvas.line_width);

    initArguments(canvas);
    initShaders();
    initBuffers();
    loadTextureImage("qrc:/img/x.png", 0, gl.TEXTURE0);
    loadTextureImage("qrc:/img/y.png", 1, gl.TEXTURE1);
    loadTextureImage("qrc:/img/z.png", 2, gl.TEXTURE2);
}

function initArguments(canvas) {
    lastSensorPoint = calcAngle(canvas.pitch, canvas.heading);
    lastSensorPoint[2] = canvas.vector_length;
    canvasArgs = canvas.args;

    indexes.sensor_path_index = [];
    indexes.sensor_path_index2 = [];

    indexes.record_point = [];
    vertexes.record_point = [];
}

function initShaders() {
    var vertCode = 'attribute vec3 aVertexPosition;' +
        'attribute vec3 aVertexNormal;' + // 法线
        'attribute vec3 aColor;' +
        'attribute vec2 aXTexture;' +

        'uniform highp mat4 uPMVMatrix;' + // 透视模型视图矩阵
        'uniform highp mat4 uMMatrix;' + // 透视模型视图矩阵
        'uniform highp mat4 uNormalMatrix;' + // 模型法线矩阵
        'uniform vec3 uLightDirection;' + // 直射光的方向
        'uniform vec4 uColor;' +

        'varying vec3 vLight;' +
        'varying vec2 vXTexture;' +

        'void main(void) {' +
        'gl_Position = uPMVMatrix * vec4(aVertexPosition, 1.0); ' +
        'highp vec3 ambientLight = vec3(0.28, 0.28, 0.28);' +                               // 环境光
        'highp vec3 directionalLightColor = vec3(0.51, 0.55, 0.52);' +                      // 直射光，与物体的颜色矩阵相乘
//        'highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);' +
//        'highp vec3 directionalVector = vec3(0.75, 0.75, 0.75);' +                       // 直射光的方向，改由uLightDirection控制
//        'highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);' +
        'highp float directional = max(dot(aVertexNormal, normalize(uLightDirection)), 0.0);' +        // 直接使用顶点的法线数据进行漫反射计算
        'if( uColor[3] > 1.0 ) {vLight = vec3(uColor);}' +                                  // 通过uniform 改变颜色
        'else if( uColor[3] > 0.0 ) {vLight = vec3(uColor) * (ambientLight + (directionalLightColor * directional));}' +
        'else {vLight = aColor * (ambientLight + (directionalLightColor * directional));}' +
        'vXTexture = aXTexture;' +
        '}';
    var vertShader = getShader(gl, vertCode, gl.VERTEX_SHADER);

    var fragCode = 'precision highp float;' +
        'varying vec3 vLight;' +
        'varying vec2 vXTexture;' +
        'uniform sampler2D uXSampler;' +
        'uniform sampler2D uYSampler;' +
        'uniform sampler2D uZSampler;' +
        'uniform int uEnableTexture;' +
        'uniform float uAlpha;' +
        'void main(void) {' +
        'mediump vec4 xtextureColor = texture2D(uXSampler, vec2(vXTexture.s, vXTexture.t));' +
        'mediump vec4 ytextureColor = texture2D(uYSampler, vec2(vXTexture.s, vXTexture.t));' +
        'mediump vec4 ztextureColor = texture2D(uZSampler, vec2(vXTexture.s, vXTexture.t));' +
        'if( uEnableTexture == 0 ) {gl_FragColor = vec4(vLight, uAlpha);}' +
        'else if( uEnableTexture == 1 ) {gl_FragColor = vec4(vLight, 1.0) * xtextureColor;}' +
        'else if( uEnableTexture == 2 ) {gl_FragColor = vec4(vLight, 1.0) * ytextureColor;}' +
        'else if( uEnableTexture == 3 ) {gl_FragColor = vec4(vLight, 1.0) * ztextureColor;}' +
        //                        'gl_FragColor = vec4(vLight, 0.5);' +
        '}';
    var fragShader = getShader(gl, fragCode, gl.FRAGMENT_SHADER);

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    attributes.vertex_position = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(attributes.vertex_position);

    attributes.vertex_normal = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(attributes.vertex_normal)

    attributes.color = gl.getAttribLocation(shaderProgram, "aColor");
    gl.enableVertexAttribArray(attributes.color);

    attributes.xtexture = gl.getAttribLocation(shaderProgram, "aXTexture");
    //    gl.enableVertexAttribArray(attributes.xtexture);

    uniforms.pmv_matrix      = gl.getUniformLocation(shaderProgram, "uPMVMatrix"); // 透视模型视图矩阵
    uniforms.m_matrix        = gl.getUniformLocation(shaderProgram, "uMMatrix")
//    uniforms.normal_matrix = gl.getUniformLocation(shaderProgram, "uNormalMatrix"); // 法线
    uniforms.light_direction = gl.getUniformLocation(shaderProgram, "uLightDirection"); // 光照
    uniforms.alpha           = gl.getUniformLocation(shaderProgram, "uAlpha");

    uniforms.xSamplerUniform = gl.getUniformLocation(shaderProgram, "uXSampler");
    uniforms.ySamplerUniform = gl.getUniformLocation(shaderProgram, "uYSampler");
    uniforms.zSamplerUniform = gl.getUniformLocation(shaderProgram, "uZSampler");

    uniforms.enable_texture = gl.getUniformLocation(shaderProgram, "uEnableTexture"); // 启用纹理贴图

    uniforms.color_unit = gl.getUniformLocation(shaderProgram, "uColor");
}

/**
 * 初始化缓冲数据
 */
function initBuffers() {
    var coord = [ // x coord
        0.0, 0.0, 0.0,
        10.0, 0.0, 0.0,
        // y coord
        0.0, 0.0, 0.0,
        0.0, 10.0, 0.0,
        // z coord
        0.0, 0.0, 0.0,
        0.0, 0.0, 10.0
    ];
    var coordIndex = [0, 1, 2, 3, 4, 5];
    var lineIndex = [0, 1, 2, 3, 4, 5];
    var lessLineIndex = [0, 1, 2, 3, 4, 5];
    // 坐标轴的颜色
    var lineColorData = [
        // x
        0.1, 0.1, 0,
        0.1, 0.1, 0,
        // y
        0, 0.1, 0,
        0, 0.1, 0,
        // z blue
        0, 0, 0.1,
        0, 0, 0.1,
    ];

    // 球体表面各处顶点坐标及索引
    var ball = getBallVertex(accuracy, canvasArgs.radius, coordIndex.length);
    coord.push.apply(coord, ball.vertex);
    coordIndex.push.apply(coordIndex, ball.vertexIndex);
    lineIndex.push.apply(lineIndex, ball.lineIndex);
    lessLineIndex.push.apply(lessLineIndex, ball.lessLineIndex);
    // color
    lineColorData.push.apply(lineColorData, ball.lineColor);

    var vertexNormalData = ball.vertexNormal;

    ball_vertex_count[0] = ball.vertexIndex.length;
    ball_vertex_count[1] = lineIndex.length;
    ball_vertex_count[2] = lessLineIndex.length;

    // 顶点信息
    buffers.coord = createArrayBuffer(gl.ARRAY_BUFFER, new Float32Array(coord), gl.DYNAMIC_DRAW);
    buffers.coord_index = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(coordIndex), gl.STATIC_DRAW);
    buffers.line_index = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineIndex), gl.STATIC_DRAW);
    buffers.less_line_index = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lessLineIndex), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0); // 传递顶点数据

    // 法线
    buffers.vertex_normal_buffer = createArrayBuffer(gl.ARRAY_BUFFER, new Float32Array(coord), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attributes.vertex_normal, 3, gl.FLOAT, false, 0, 0);

    // 色彩信息
    buffers.color_buffer = createArrayBuffer(gl.ARRAY_BUFFER, new Float32Array(lineColorData), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attributes.color, 3, gl.FLOAT, false, 0, 0);

    // 绘制参考圆圈
    coord = getRefCirclePoints();
    //    console.log(coord.length);
    var i = 0,
        j = 0;
    coordIndex = [];
    for (i = 0; i < 26; i++) {
        for (j = 1; j < pointVertexSides; j++) {
            coordIndex.push(i * (pointVertexSides + 1) + j);
            coordIndex.push(i * (pointVertexSides + 1) + j + 1);
        }
        coordIndex.push(i * (pointVertexSides + 1) + pointVertexSides);
        coordIndex.push(i * (pointVertexSides + 1) + 1);
    }

    buffers.refcircle = createArrayBuffer(gl.ARRAY_BUFFER, new Float32Array(coord), gl.DYNAMIC_DRAW);
    buffers.refcircle_index = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(coordIndex), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);

    /** 将 sensor point 显示为圆形  **/
    // 初始化顶点，以便在缓冲区分配空间
    var vertexPoint = getSensorPoint([0.5, 0.0, 0.0], 1, canvasArgs.point_size, pointVertexSides, [0.0, 0.0, 0.0]);
    vertexPoint = vertexPoint.concat([0, 0, 0], [0.0, 0.0, 0.0]) // 手动将原点添加进去
    buffers.point = createArrayBuffer(gl.ARRAY_BUFFER, new Float32Array(vertexPoint), gl.DYNAMIC_DRAW);
    // 绘制正反两面，索引不需要改变
    var vertexIndex = [];

    for (i = 1; i < pointVertexSides; i++) {
        //        vertexIndex.push(pointVertexSides+1, i, i+1, pointVertexSides+1, i+1, i);
        vertexIndex.push(0, i, i + 1, 0, i + 1, i);
    }
    //    vertexIndex.push(pointVertexSides+1, 1, pointVertexSides, pointVertexSides+1, pointVertexSides, 1);
    vertexIndex.push(0, 1, pointVertexSides, 0, pointVertexSides, 1);
    for (i = 0; i < pointVertexSides; i++) {
        //        vertexIndex.push(0, i, i+1, 0, i+1, i, pointVertexSides+1, i, i+1, pointVertexSides+1, i+1, i);
        vertexIndex.push(pointVertexSides + 1, i, i + 1,
            pointVertexSides + 1, i + 1, i);
    }
    buffers.point_index = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndex), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 6 * 4, 0);

    // path Buffer initialization
    buffers.path = [];
    buffers.path_index = [];
    buffers.path_index2 = [];
    buffers.path[currentPath] = createArrayBuffer(gl.ARRAY_BUFFER, 4 * maxPathNum, gl.DYNAMIC_DRAW);
    buffers.path_index[currentPath] = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, 4 * maxPathNum, gl.DYNAMIC_DRAW);
    buffers.path_index2[currentPath] = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, 2 * maxPathNum, gl.DYNAMIC_DRAW);

    buffers.record_point = createArrayBuffer(gl.ARRAY_BUFFER, 4 * maxPathNum, gl.DYNAMIC_DRAW);
    buffers.record_point_index = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, 8 * maxPathNum, gl.DYNAMIC_DRAW);

    // sensor simulator and line 长方体共需 6*4 个顶点, 每个顶点 9 个数据，数据类型为 Float32，4字节
    buffers.sensor_simulator = createArrayBuffer(gl.ARRAY_BUFFER, 4 * 24 * 9, gl.DYNAMIC_DRAW);
    vertexIndex = [];
    for (i = 0; i < 6; i++) {
        vertexIndex.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
    }
    buffers.sensor_simulator_index = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndex), gl.STATIC_DRAW); // 索引不需改变

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
    buffers.texture_coord = createArrayBuffer(gl.ARRAY_BUFFER, new Float32Array(textureCoord), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attributes.xtexture, 2, gl.FLOAT, false, 0, 0);

}

/**
 * 
 * @param {*} type 
 * @param {*} data  数组或 long 型整数
 * @param {*} drawtype 
 * @param {*} unbind 
 */
function createArrayBuffer(type, data, drawtype, unbind) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, data, drawtype);

    if (unbind) {
        gl.bindBuffer(type, null);
    }
    return buffer;
}

/**
 * 加载纹理
 * @param {string} imgsrc 
 * @param {int} index 
 * @param {*} textureUnit 
 */
function loadTextureImage(imgsrc, index, textureUnit) {
    var image = TextureImageFactory.newTexImage();
    image.src = imgsrc;
    image.imageLoaded.connect(function() {
        // 成功加载图片
        gl.activeTexture(textureUnit);
        var texture = gl.createTexture(); // 绑定 2D 纹理
        gl.bindTexture(gl.TEXTURE_2D, texture);
        switch (index) {
            case 0:
                xTexture = texture;
                gl.uniform1i(uniforms.xSamplerUniform, 0);
                break;
            case 1:
                yTexture = texture;
                gl.uniform1i(uniforms.ySamplerUniform, 1);
                break;
            case 2:
                zTexture = texture;
                gl.uniform1i(uniforms.zSamplerUniform, 2);
                break;
        }

        // 将图片绘制到 2D 纹理上
        gl.texImage2D(gl.TEXTURE_2D, // target
            0, // level
            gl.RGBA, // internalformat
            gl.RGBA, // format
            gl.UNSIGNED_BYTE, // type
            image); //

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

        // 生成 2D 纹理
        gl.generateMipmap(gl.TEXTURE_2D);
        //        gl.bindTexture(gl.TEXTURE_2D, 0);
    })
}

function paintGL(canvas) {
    var pixelRatio = canvas.devicePixelRatio;
    var currentWidth = canvas.width * pixelRatio;
    var currentHeight = canvas.height * pixelRatio;
    if (currentWidth !== width || currentHeight !== height) {
        width = canvas.width;
        height = canvas.height;
        gl.viewport(0, 0, width, height);
        mat4.perspective(pMatrix, degToRad(45), width / height, 0.5, 500.0);
//        gl.uniformMatrix4fv(uniforms.perspective_matrix, false, pMatrix);
    }

    /* 清除给定的标志位 */
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

//    mat4.identity(vMatrix);
    // 设置观察点
    mat4.lookAt(vMatrix, [canvas.cx, canvas.cy, canvas.cz], [0, 0, 0], [0, 0, 1]);
    /* 进行旋转，fromRotation() 函数创造一个新的矩阵，所以之后调用该函数会覆盖掉前面的操作 */
    mat4.fromTranslation(mMatrix, vec3.fromValues(canvas.xPos, canvas.yPos, canvas.zPos));
//    mat4.translate(mMatrix, mMatrix, vec3.fromValues(canvas.xPos, canvas.yPos, canvas.zPos));
    mat4.rotate(mMatrix, mMatrix, degToRad(canvas.xRotAnim), [1, 0, 0]);
    mat4.rotate(mMatrix, mMatrix, degToRad(canvas.yRotAnim), [0, 1, 0]);
    mat4.rotate(mMatrix, mMatrix, degToRad(canvas.zRotAnim), [0, 0, 1]);
    mat4.multiply(pmvMatrix, mMatrix, vMatrix)
    mat4.multiply(pmvMatrix, pMatrix, pmvMatrix);
    gl.uniformMatrix4fv(uniforms.pmv_matrix, false, pmvMatrix);

//    mat4.invert(nMatrix, mvMatrix);
//    mat4.transpose(nMatrix, nMatrix);
//    gl.uniformMatrix4fv(uniforms.normal_matrix, false, nMatrix);
    // 设置光照方向
    gl.uniform3fv(uniforms.light_direction, canvasArgs.light_direction);
    /** 读取相应参数 **/
    setArguments(canvas);
    // 开始绘制
    startPaint(canvas);
}

/** 开始执行实际的绘图操作，由于开启了 ALPHA BLEND 功能，先绘制球内物体 **/
function startPaint(canvas) {
    gl.uniform1f(uniforms.alpha, 0.8);
    var angle = calcAngle(canvasArgs.pitch, canvasArgs.heading);
    u = angle[0];
    v = angle[1];
    /********* 绘制路径 *********/
    if (canvasArgs.enable_path) {
        drawPath(gl, u, v);
        drawPoint(gl, u, v, canvasArgs.vector_length, true);
    } else {
        // no need to draw the radial line between point to ordinary point
        resetAllPath(u, v, canvasArgs.vector_length);
        drawPoint(gl, u, v, canvasArgs.radius);
    }
    // 绘制传感器指向的方向
    /******** 绘制长方体表示的传感器 **********/
    if (canvasArgs.enable_cube) {
        drawCube(gl, u, v);
    }

    if (canvas.drawMode === "calibration") {
        paintRefcircle();
    }

    // 在绘制球面的时候不使用纹理
    gl.uniform1i(uniforms.enable_texture, 0);
    gl.uniform1f(uniforms.alpha, 0.4);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color_buffer);
    gl.vertexAttribPointer(attributes.color, 3, gl.FLOAT, false, 0, 0);
    // 顶点数据和法线数据
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.coord);
    gl.vertexAttribPointer(attributes.vertex_normal, 3, gl.FLOAT, false, 0, 0);
    switch (canvas.drawMode) {
        case "line":
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.line_index);
            gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
            gl.drawElements(gl.LINES, ball_vertex_count[1], gl.UNSIGNED_SHORT, 0);
            //        gl.drawElements(gl.LINES, 6, gl.UNSIGNED_SHORT, 0);
            break;
        case "lessLine":
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.less_line_index);
            gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
            gl.drawElements(gl.LINES, ball_vertex_count[2] - accuracy * 3 * 2, gl.UNSIGNED_SHORT, 0);
            // 绘制赤道所在的圆面
            gl.drawElements(gl.TRIANGLES, accuracy * 3 * 2 * 0.25, gl.UNSIGNED_SHORT, (ball_vertex_count[2] - accuracy * 3 * 2 * 0.5) * 2);
            break;
        case "calibration":
        case "surface":
        default:
            // 绘制坐标轴
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.coord_index);
            gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
            gl.drawElements(gl.LINES, 6, gl.UNSIGNED_SHORT, 0);
            // 绘制球形
            gl.drawElements(gl.TRIANGLES, ball_vertex_count[0], gl.UNSIGNED_SHORT, 6 * 2);
            break;
    }

}


function setArguments(canvas) {
    gl.lineWidth(canvas.line_width);

    // 如果现有的 referenceRadius 与画布的实际参数不同，则进行修改
    if (canvasArgs.radius !== canvas.radius) {
        canvasArgs.radius = canvas.radius;
        //        initBuffers();
        var coord = [ // x coord
            0.0, 0.0, 0.0,
            10.0, 0.0, 0.0,
            // y coord
            0.0, 0.0, 0.0,
            0.0, 10.0, 0.0,
            // z coord
            0.0, 0.0, 0.0,
            0.0, 0.0, 10.0
        ];
        var ball = getBallVertex(accuracy, canvasArgs.radius, 6, "JW");
        coord.push.apply(coord, ball.vertex);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.coord);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(coord));

        var refcirclePoints = getRefCirclePoints();
        updateSubBuffer(gl.ARRAY_BUFFER, buffers.refcircle, 0, new Float32Array(refcirclePoints));
    }

    canvasArgs = canvas.args;
    /** 如果 heading 有偏移，应把偏移算上(以复位后的位置作为基准方向) **/
    canvasArgs.heading = canvas.heading - canvas.headingOffset;

}


/**
 * 绘制传感器指向的方向，如果需要记录路径的话，从当前位置开始记录路径
 * @param {*} gl 
 * @param {*} pitch     俯仰角的角度，范围是[-180, 180]
 * @param {*} heading   航向角的角度，增大的方向为从 Z 轴正无穷远处向原点看时顺时针方向，范围是[0, 360)
 * @param {*} offset    斑点到原点的距离
 */
function drawPoint(gl, u, v, offset, radial) {
    gl.uniform4fv(uniforms.color_unit, [0.0, 0.8, 0.6, 1.0]);
    /******** 在球面上绘制斑点，连接原点到球面斑点的线段 **********/
    var sensorPoint = getSensorPoint([u, v, 0], offset, canvasArgs.point_size, pointVertexSides);
    updateSubBuffer(gl.ARRAY_BUFFER, buffers.point, 0, new Float32Array(sensorPoint))
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(attributes.vertex_normal, 3, gl.FLOAT, false, 0, 0); // 认为顶点方向就是法线方向
    //    gl.vertexAttribPointer(attributes.color,           3, gl.FLOAT, false, 6*4, 3*4);          // 偏移量为 3 个数据 * sizeof(float)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.point_index);
    if (radial) {
        // 由于需要绘制射线，因此索引数目需要加倍
        gl.drawElements(gl.TRIANGLES, pointVertexSides * 6 * 2, gl.UNSIGNED_SHORT, 0);
    } else {
        gl.drawElements(gl.TRIANGLES, pointVertexSides * 6, gl.UNSIGNED_SHORT, 0);
    }

    gl.uniform4fv(uniforms.color_unit, [0.0, 0.0, 0.0, 0.0]);
}

/**
 * 根据 u，v 计算传感器当前位置四周的点的位置
 * 获取点位置用的方法是：先在 XOY 平面上绘制出相应图形，根据 u, v 进行旋转，
 * 然后根据 u, v, offset 确定的向量进行平移
 * 注意：由于可能需要原点，因此这里的顶点个数为n+1。
 * @param {array} angles   angles[0] = u, angles[1] = v, angles[2] = f
 * @param {double} offset 与原点的距离
 * @param {double} pointSize  中心点到顶点的距离
 * @param {int}    n          边数，至少为 4
 * @param {*} rgb  三维数组，可以不再使用
 * @returns 坐标和颜色的数组
 */
function getSensorPoint(angles, offset, pointSize, n, rgb) {
    var u = angles[0];
    var v = angles[1];
    var f = angles[2];
    var sensorPoint = [];

    var points = [
        [0, 0, 0]
    ]; // 二维数组，每个元素是一个三维数组，包含顶点的 xyz 坐标
    // 优化数组连接，concat 在这里的时间复杂度为 O(n2)
    //    points = points.concat(drawSurfaceAndMove([u, v, 0], pointSize, n));
    points.push.apply(points, drawSurfaceAndMove([u, v, f], pointSize, n));

    // 将顶点添加到 sensorPoint 数组中，并将得到的平面进行平移
    points.forEach(function(element) {
        sensorPoint.push.apply(sensorPoint, movePointByAngle(element, [u, v], offset));
        //        sensorPoint.push.apply(sensorPoint, rgb);
    });
    return sensorPoint;
}

/**
 *  绘制球面上的参考圆圈
 *  首先设置线宽和颜色
 **/
function paintRefcircle() {
    gl.lineWidth(3.0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.refcircle);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.refcircle_index);
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(attributes.vertex_normal,   3, gl.FLOAT, false, 0, 0);
    var refIndexes = pointVertexSides;
    var greenNum = 6;
    // 画出经纬度同时为0的圆圈
    gl.uniform4fv(uniforms.color_unit, [0.05, 1.0, 0.1, 1.0]);
    gl.drawElements(gl.LINES, refIndexes * 2 * greenNum, gl.UNSIGNED_SHORT, 0); // x2 是线段需要的索引数
    gl.uniform4fv(uniforms.color_unit, [0.05, 0.1, 1.0, 1.0]);
    gl.drawElements(gl.LINES, (26 - greenNum) * refIndexes * 2, gl.UNSIGNED_SHORT, refIndexes * 2 * greenNum * 2);
    gl.lineWidth(canvasArgs.line_width);
    //    return;
    // 进行采点操作
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.record_point);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.record_point_index);
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
    //    gl.vertexAttribPointer(attributes.vertex_normal,   3, gl.FLOAT, false, 0, 0);
    gl.uniform4fv(uniforms.color_unit, [0.1, 0.1, 0.95, 1.1]); // 传入颜色 uniform，就不再需要颜色顶点数据
    gl.drawElements(gl.TRIANGLES, indexes.record_point.length, gl.UNSIGNED_SHORT, 0);
    gl.uniform4fv(uniforms.color_unit, [0.0, 0.0, 0.0, 0.0]);
}

/**
 *  球面上的参考圆圈
 **/
function getRefCirclePoints() {
    var i, j;
    var points = [];
    var sensorPoint;

    points.push.apply(points, getSensorPoint([0, 0, 0], canvasArgs.radius, 0.15, pointVertexSides)); // north polar
    points.push.apply(points, getSensorPoint([1, 0, 0], canvasArgs.radius, 0.15, pointVertexSides)); // south polar

    // 赤道上 0 90 180 270 位置上的四个圆圈
    i = 2;
    for (j = 0; j < 8; j = j + 2) {
        sensorPoint = getSensorPoint([i / 4, j / 8, 0], canvasArgs.radius, 0.15, pointVertexSides);
        points.push.apply(points, sensorPoint);
    }
    for (j = 1; j < 8; j = j + 2) {
        sensorPoint = getSensorPoint([i / 4, j / 8, 0], canvasArgs.radius, 0.15, pointVertexSides);
        points.push.apply(points, sensorPoint);
    }

    for (j = 0; j < 8; j++) {
        for (i = 1; i < 4; i += 2) {
            sensorPoint = getSensorPoint([i / 4, j / 8, 0], canvasArgs.radius, 0.15, pointVertexSides);
            points.push.apply(points, sensorPoint);
        }
    }
    return points;
}

/***
 *  球面上的打点操作
 **/
function recordPoint() {
    var n = vertexes.record_point.length / 3;
    var i;
    var sensorPoint = getSensorPoint([u, v, 0], canvasArgs.radius, canvasArgs.point_size, pointVertexSides);
    vertexes.record_point.push.apply(vertexes.record_point, sensorPoint);
    var vertexIndex = [];
    for (i = 1; i < pointVertexSides; i++) {
        vertexIndex.push(n + 0, n + i, n + i + 1,
            n + 0, n + i + 1, n + i);
    }
    vertexIndex.push(n + 0, n + pointVertexSides, n + 1,
        n + 0, n + 1, n + pointVertexSides);
    indexes.record_point.push.apply(indexes.record_point, vertexIndex);
    updateSubBuffer(gl.ARRAY_BUFFER, buffers.record_point, 0, new Float32Array(vertexes.record_point));
    updateSubBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.record_point_index, 0, new Uint16Array(indexes.record_point));
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
    //    gl.vertexAttribPointer(attributes.vertex_normal,   3, gl.FLOAT, false, 0, 0);
}


function resetRecordPoint() {
    recordPointsAngle = [];
    vertexes.record_point = [];
    indexes.record_point = [];
}

function drawCube(gl, u, v) {
    /**
     * 在颜色信息数组中添加法线信息，之后对数据的处理需要做相应的改变
     * 由于需要在长方体上添加纹理，实际上需要 24 个顶点，首先计算出 8 个顶点的位置
     * 然后根据各自的方位按逆时针（前后左右上下，正对面时的左上角顶点开始）放置顶点
     **/
    var rgblight = [0.6, 0.1, 0.1].concat(canvasArgs.light_direction);
    var right_rgb = [0.1, 0.6, 0.1].concat(canvasArgs.light_direction);
    var down_rgb = [0.1, 0.1, 0.6].concat(canvasArgs.light_direction);
    var sback = getCubePoint(1 - u, v + 0.5, 0.125, canvasArgs.radius * 0.375 * 0.3);
    var sfront = getCubePoint(u, v, 0.125, canvasArgs.radius * 0.375 * 0.6);
    var i;
    for (i = 0; i < 4; i++) {
        sfront.push(sback[i]);
    }
    var surface = [];
    // direction is based on vector (10, 0, 0) to (0, 0, 0)
    var surfaceIndex = [
        2, 3, 0, 1, // front
        6, 7, 4, 5, // back
        2, 5, 4, 3, // left
        0, 7, 6, 1, // right
        5, 2, 1, 6, // up
        3, 4, 7, 0, // down
        //                6, 7, 5, 4,     // back2
        //                0, 7, 1, 6,     // right2
        //                3, 4, 0, 7     // down2
    ];
    for (i = 0; i < 8; i++) {
        surface.push.apply(surface, sfront[surfaceIndex[i]]);
        surface.push.apply(surface, rgblight);
    }
    for (i = 8; i < 16; i++) {
        surface.push.apply(surface, sfront[surfaceIndex[i]]);
        surface.push.apply(surface, right_rgb);
    }
    for (i = 16; i < surfaceIndex.length; i++) {
        surface.push.apply(surface, sfront[surfaceIndex[i]]);
        surface.push.apply(surface, down_rgb);
    }
    /*
    var surfaceIndex = {
        "front" : [2, 3, 0, 1], "left": [6, 7, 4, 5], "up": [5, 2, 1, 6],
        "right": [0, 7, 6,1], "back" : [6, 7, 4, 5], "down": [3, 4, 7, 0]
    }
    surfaceIndex.forEach(function(elements) {
        surface = surface.concat(sfront[elements], rgblight);
    });
    */

    updateSubBuffer(gl.ARRAY_BUFFER, buffers.sensor_simulator, 0, new Float32Array(surface));
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 9 * 4, 0); // 顶点间隔变为 9
    gl.vertexAttribPointer(attributes.color, 3, gl.FLOAT, false, 9 * 4, 3 * 4);
    // 设置法线，确保模拟器的亮度始终是最亮的
    gl.vertexAttribPointer(attributes.vertex_normal, 3, gl.FLOAT, false, 9 * 4, 6 * 4);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.sensor_simulator_index);

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
}

/**
 * 根据 u，v 计算传感器模拟长方体当前的位置
 * @param {double} u
 * @param {double} v
 * @param {double} offset 与原点的距离
 * @param {*} rgb  三维数组
 * @returns 坐标和颜色的数组
 */
function getCubePoint(u, v, f, offset) {
    var cubePoint = [];
    var points = drawSurfaceAndMove([u, v, f], canvasArgs.radius * 0.375 * 0.2, 4);
    var i = 0;
    for (i = 0; i < 4; i++) {
        cubePoint.push(movePointByAngle(points[i], [u, v], offset));
    }
    return cubePoint;
}

var count = 0;
/**
 * 绘制路径
 * 全部改成用直线相连
 * 通过线性插值后，不用记录每个顶点，如果前后两点之间的距离过大，用线性插值加入路径中
 **/
function drawPath(gl, u, v) {
    gl.uniform4fv(uniforms.color_unit, [0.0, 0.0, 0.6, 1.0]); // 传入颜色 uniform，就不再需要颜色顶点数据
    //    /*
    //     * 使用全局数组绘制路径，使用内存和绘制耗时较多，但没有显示错误
    //     * 取消了颜色和顶点数据的绑定，不需要对内存进行偏移
    if (calcVertexDistance([u, v, canvasArgs.vector_length], lastSensorPoint) > canvasArgs.point_size * 0.2) {
        var sensorPoint = getLinearSensorPoint([u, v, canvasArgs.vector_length], lastSensorPoint);
        lastSensorPoint = [u, v, canvasArgs.vector_length];
        var n = sensorPath.length / 24; // 第 n 个 sensorPoint

        // 向路径中添加新的位置
        //      ** 当 sensorPath.length 超过 20000 时，数组过大，不再显示顶点
        sensorPath.push.apply(sensorPath, sensorPoint); // 每 24 个数据意味着包含一个 SensorPoint, 每 6 个数据代表一个点
        indexes.sensor_path_index.push(
            n * 8 + 0, n * 8 + 4, n * 8 + 1, n * 8 + 1, n * 8 + 4, n * 8 + 5,   // 0 - 1 - 0' - 1'
            n * 8 + 1, n * 8 + 5, n * 8 + 2, n * 8 + 2, n * 8 + 6, n * 8 + 5,   // 1 - 2 - 1' - 2'
            n * 8 + 2, n * 8 + 6, n * 8 + 3, n * 8 + 3, n * 8 + 7, n * 8 + 6,   // 2 - 3 - 2' - 3'
            n * 8 + 3, n * 8 + 7, n * 8 + 0, n * 8 + 0, n * 8 + 4, n * 8 + 7,   // 3 - 0 - 3' - 0'
            n * 8 + 0, n * 8 + 1, n * 8 + 4, n * 8 + 1, n * 8 + 5, n * 8 + 4,   // 0 - 1 - 1' - 0'
            n * 8 + 1, n * 8 + 2, n * 8 + 5, n * 8 + 2, n * 8 + 5, n * 8 + 6,   // 1 - 2 - 2' - 1'
            n * 8 + 2, n * 8 + 3, n * 8 + 6, n * 8 + 3, n * 8 + 6, n * 8 + 7,   // 2 - 3 - 3' - 2'
            n * 8 + 3, n * 8 + 0, n * 8 + 7, n * 8 + 0, n * 8 + 7, n * 8 + 4    // 3 - 0 - 0' - 3'
        );
        indexes.sensor_path_index2.push(
            n * 8 + 0, n * 8 + 1, n * 8 + 4, n * 8 + 0, n * 8 + 1, n * 8 + 5,   // 0 - 1 - 0' - 1'
            n * 8 + 1, n * 8 + 2, n * 8 + 5, n * 8 + 1, n * 8 + 2, n * 8 + 6,   // 1 - 2 - 1' - 2'
            n * 8 + 2, n * 8 + 3, n * 8 + 6, n * 8 + 2, n * 8 + 3, n * 8 + 7,   // 2 - 3 - 2' - 3'
            n * 8 + 3, n * 8 + 0, n * 8 + 7, n * 8 + 3, n * 8 + 0, n * 8 + 4    // 3 - 0 - 3' - 0'
        );
        //        console.log(count + " === " + sensorPath.length + " === " + indexes.sensor_path_index.length )
        count++;
        updateSubBuffer(gl.ARRAY_BUFFER, buffers.path[currentPath], 0, new Float32Array(sensorPath));
        updateSubBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.path_index[currentPath], 0, new Uint16Array(indexes.sensor_path_index));
        updateSubBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.path_index2[currentPath], 0, new Uint16Array(indexes.sensor_path_index2));
        if (indexes.sensor_path_index.length >= 2 * maxPathNum) {
            currentPath++;
            buffers.path[currentPath] = createArrayBuffer(gl.ARRAY_BUFFER, 4 * maxPathNum, gl.DYNAMIC_DRAW);
            buffers.path_index[currentPath] = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, 4 * maxPathNum, gl.DYNAMIC_DRAW);
            buffers.path_index2[currentPath] = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, 2 * maxPathNum, gl.DYNAMIC_DRAW);
            resetCurrentPath(u, v, canvasArgs.vector_length);
        }
    }
    // 分批绘制路径
    for (var i = 0; i < currentPath; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.path[i]);
        gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
        if (canvasArgs.path_real_line) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.path_index[i]);
            gl.drawElements(gl.TRIANGLES, 2 * maxPathNum, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.path_index2[i]);
            gl.drawElements(gl.TRIANGLES, maxPathNum, gl.UNSIGNED_SHORT, 0);
        }
    }
    if (indexes.sensor_path_index.length > 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.path[currentPath]);
        gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
        if (canvasArgs.path_real_line) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.path_index[currentPath]);
            gl.drawElements(gl.TRIANGLES, indexes.sensor_path_index.length, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.path_index2[i]);
            gl.drawElements(gl.TRIANGLES, indexes.sensor_path_index2.length, gl.UNSIGNED_SHORT, 0);
        }
    }
    gl.uniform4fv(uniforms.color_unit, [0.0, 0.0, 0.0, 0.0]);
}

function updateBuffer(type, buffer, data, drawtype) {
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, data, drawtype);
}

function updateSubBuffer(type, buffer, offset, data) {
    gl.bindBuffer(type, buffer);
    gl.bufferSubData(type, offset, data);
}

/**
 * 重置路径变量
 */
function resetCurrentPath(u, v, length) {
    lastSensorPoint = [u, v, length];
    sensorPath = [];
    indexes.sensor_path_index = [];
    indexes.sensor_path_index2 = [];
}

function resetAllPath(u, v, length) {
    for (var i = 0; i < currentPath; i++) {
        gl.deleteBuffer(buffers.path[i]);
        gl.deleteBuffer(buffers.path_index[i]);
    }

    currentPath = 0;
    buffers.path[currentPath] = createArrayBuffer(gl.ARRAY_BUFFER, 4 * maxPathNum, gl.DYNAMIC_DRAW);
    buffers.path_index[currentPath] = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, 4 * maxPathNum, gl.DYNAMIC_DRAW);
    buffers.path_index2[currentPath] = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, 2 * maxPathNum, gl.DYNAMIC_DRAW);
    resetCurrentPath(u, v, length);
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
    return [u, v];
}

/**
 * 根据 theta beta 角度移动点
 */
function movePointByAngle(pos, angles, movement) {
    //    var dis = Math.sqrt(pos[0]*pos[0] + pos[1]*pos[1] + pos[2]*pos[2]);
    var vector = calcVertex(angles[0], angles[1], movement);
    // 从 z 轴到相应角度对应点的向量
    //    vector = movePointByVector(vector, [0, 0, -dis]);
//    return movePointByVector(pos, vector);
    return [pos[0] + vector[0], pos[1] + vector[1], pos[2] + vector[2]];
}


function getSensorPathPoint(angles, offset, pointSize, n) {
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
 * 根据 u，v 计算需要绘制的平面的点的位置
 * 不论绘制什么平面，其中心点在原点，但所在平面有可能不在 XOY 平面上
 * 获取点位置用的方法是：在 XOY 平面上绘制出相应图形，根据 u, v 进行旋转，
 * @param {array} angles   angles[0] = u, angles[1] = v, angles[2] = f  f对应横滚角
 * @param {double} pointSize  中心点到顶点的距离
 * @param {int}    n          边数，至少为 4
 * @returns 二级数组
 */
function drawSurfaceAndMove(angles, pointSize, n) {
    var u = angles[0];
    var v = angles[1];
    var f = angles[2];
    var points = []; // 二级数组，每个元素是一个三维数组，包含顶点的 xyz 坐标
    var point = [];
    /* 处理旋转,从 xoy 平面上的 (r, 0) 开始，计算每个顶点的位置，然后将其反转，旋转得到相应角度的平面 */
    for (var i = 0; i < n; i++) {
        point = [pointSize * Math.cos(Math.PI * 2 * i / n), pointSize * Math.sin(Math.PI * 2 * i / n), 0];
        // 变量 f 影响面的旋转
        var tp0 = point[0];
        var tp1 = point[1];
        point[0] = tp0 * Math.cos(Math.PI * 2 * f) - tp1 * Math.sin(Math.PI * 2 * f);
        point[1] = tp1 * Math.cos(Math.PI * 2 * f) + tp0 * Math.sin(Math.PI * 2 * f);
        // 处理 u 带来的变化
        tp0 = point[0]
        point[0] = tp0 * Math.cos(-Math.PI * u);
        point[2] = tp0 * Math.sin(-Math.PI * u);
        // 处理 v 带来的变化
        tp0 = point[0] * Math.cos(-Math.PI * 2 * v) + point[1] * Math.sin(-Math.PI * 2 * v);
        tp1 = point[1] * Math.cos(-Math.PI * 2 * v) - point[0] * Math.sin(-Math.PI * 2 * v);
        point[0] = tp0;
        point[1] = tp1;
        points.push(point);
    }
    return points;
}

/**
 * 线性插值，得到一系列补充的 sensorPoint
 * @param {Array} p     p[0] = u    p[1] = v    p[2] = radius
 * @param {Array} lp    lp[0] = lu  lp[1] = lv  lp[2] = lradius
 * @param {*} u         与 theta 角对应，l 前缀表示上一个点
 * @param {*} v         与 beta  角对应
 * @param {*} radius    与原点的距离
 */
function getLinearSensorPoint(p, lp) {
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

    //    linearSensorPoint.push.apply(linearSensorPoint, getSensorPathPoint([u, v, -0.375], offset, canvasArgs.path_size, 4));
    //    linearSensorPoint.push.apply(linearSensorPoint, getSensorPathPoint([lu, lv, -0.375], loffset, canvasArgs.path_size, 4));
    return linearSensorPoint;
}

/**
 * 计算两个顶点之间的距离
 * @param {Array} p     p[0] = u    p[1] = v    p[2] = radius
 * @param {Array} lp    lp[0] = lu  lp[1] = lv  lp[2] = lradius
 */
function calcVertexDistance(p, lp) {
    var p1 = calcVertex(p[0], p[1], p[2]);
    var p2 = calcVertex(lp[0], lp[1], lp[2]);
    var dis2 = (p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1]) + (p1[2] - p2[2]) * (p1[2] - p2[2]);
    var dis = Math.sqrt(dis2);
    /** 如果在同一球面上时，可以通过角度算出距离 **/
    // var dis = 2 - 2 * (Math.sin(Math.PI * p[0])*Math.sin(Math.PI * lp[0])*Math.cos(Math.PI*2*(p[1]-lp[1])) + Math.cos(Math.PI*p[0])*Math.cos(Math.PI * lu));
    // dis = Math.sqrt(dis) * radius;
    return dis;
}

/**
 * 计算得到球面的所有顶点位置
 *  n   循环次数，绘制球形时的精度
 *  r   球体的半径
 * 先绘制经线，后绘制纬线
 *
 */
function getBallVertex(n, r, offset, mode) {
    calcIndexMode = mode;
    var vertex = []; // 顶点坐标数组
    var vertexIndex = []; // surfaceDrawMode  绘制时所用的索引
    var vertexColor = [];

    var lineIndex = []; // lineDrawMode     绘制时所用的索引
    var lessLineIndex = []; // lessLineDrawMode 绘制时所用的索引
    var lineColor = [];
    //    var vn = [];        // 顶点法向量数组，当球心在原点时，与顶点坐标相同
    var i, j, k;

    /**
     * Z 轴上的两端点相当于球体的两个极点，
     * i 负责绘制经线（不经过极点）， j 负责绘制纬线（每条都经过极点）
     * 横向连线 (0, 0) - (0, 1)  or  (1, 0) - (1, 1)  纵向连线 (0, 0) - (1, 0)  or  (1, 1) - (0, 1)
     * modeWJ 时:  i 等分 u,  j 等分 v
     */
    for (j = 0; j < n; j++) {
        for (i = 0; i < n; i++) {
            // 计算顶点位置
            k = [].concat(calcVertex(i / n, j / n, r),                  // (0, 0)
                          calcVertex((i + 1) / n, j / n, r),            // (1, 0)
                          calcVertex((i + 1) / n, (j + 1) / n, r),      // (1, 1)
                          calcVertex(i / n, (j + 1) / n, r));           // (0, 1)      // i 为 0 或 n-1 时，(0, 1) 点与 (0, 0) 点实际都为极点
            vertex.push.apply(vertex, k);
            /** 用线条或矩形绘制整个球面时，不用在意 mode **/
            // 黎曼矩形绘制球面
            vertexIndex.push(calcBallIndex(i, j, offset), calcBallIndex(i, j, offset + 1), calcBallIndex(i, j, offset + 2),
                calcBallIndex(i, j, offset), calcBallIndex(i, j, offset + 2), calcBallIndex(i, j, offset + 3));
            // 线条绘制空心球体
            lineIndex.push(calcBallIndex(i, j, offset), calcBallIndex(i, j, offset + 1), // modeJW = 经线,
                calcBallIndex(i, j, offset + 1), calcBallIndex(i, j, offset + 2) // modeJW = 纬线
            );

            lineColor.push(0.992, 0.126, 0.102,
                0.992, 0.126, 0.102,
                0.992, 0.126, 0.102,
                0.992, 0.126, 0.102
            );

            if (i === n / 2 - 1) {
                lessLineIndex.push(calcBallIndex(i, j, offset + 1), calcBallIndex(i, j, offset + 2));
            }
        }

        // 线条简单绘制, 绘出 4 条经线
        lessLineIndex.push(calcBallIndex(j, 0, offset), calcBallIndex(j, 0, offset + 1));
        lessLineIndex.push(calcBallIndex(j, 1 / 4 * n, offset), calcBallIndex(j, 1 / 4 * n, offset + 1));
        lessLineIndex.push(calcBallIndex(j, 1 / 2 * n, offset), calcBallIndex(j, 1 / 2 * n, offset + 1));
        lessLineIndex.push(calcBallIndex(j, 3 / 4 * n, offset), calcBallIndex(j, 3 / 4 * n, offset + 1));
    }

    // 赤道所在平面
    for (j = 0; j < n; j++) {
        lessLineIndex.push(0, calcBallIndex(n / 2 - 1, j, offset + 1), calcBallIndex(n / 2 - 1, j, offset + 2));
        lessLineIndex.push(0, calcBallIndex(n / 2 - 1, j, offset + 2), calcBallIndex(n / 2 - 1, j, offset + 1));
    }
    //    console.log("vertex: " + vertex.length/3 + " index: " + vertexIndex.length + " color: " + color.length);
    //    console.log(" ==》\n " +  "\n" + vertexIndex);

    // n 次循环，产生 n*n 个四边形，每个四边形有 6 个顶点
    return {
        // 黎曼矩形/线条 绘制球面都是 n*n*6
        //        "count": vertexIndex.length,
        "vertex": vertex,
        "vertexIndex": vertexIndex,
        "vertexNormal": vertex,
        "vertexColor": vertexColor,
        "lineColor": lineColor,
        "lineIndex": lineIndex,
        "lessLineIndex": lessLineIndex
    };
}


/**
 * 计算索引 index 的值
 * @param  i       第 i 个圆圈
 * @param  j       第 i 个圆圈中的第 j 个部分
 */
function calcBallIndex(i, j, offset) {
    return i * 4 + j * accuracy * 4 + offset; // modeJW
}

/**
 * 假设球心即为原点
 * @param   u   球心到顶点的连线与 Z 轴正方向的夹角为 theta, u = theta / pi,   0<= u <= 1
 * @param   v   球心到顶点的连线在 xoy 平面上的投影与 X 轴正方向的夹角为 beta, v = beta / (2*pi), 0<= v <= 1
 * @param   r   球半径
 * @return      顶点的坐标，用三维数组表示
 */
function calcVertex(u, v, r, precesion) {
    var st = Math.sin(Math.PI * u);
    var ct = Math.cos(Math.PI * u);
    var sb = Math.sin(Math.PI * 2 * v);
    var cb = Math.cos(Math.PI * 2 * v);
    var x = r * st * cb;
    var y = r * st * sb;
    var z = r * ct;
    if (precesion)
        return [parseFloat(x.toFixed(precesion)), parseFloat(y.toFixed(precesion)), parseFloat(z.toFixed(precesion))];
    else
        return [x, y, z];
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

/*
 * 将角度转化为弧度
 * deg      角度
 * @return  弧度
 */
function degToRad(deg) {
    return deg * Math.PI / 180
}

function resizeGL(canvas) {
    var pixelRatio = canvas.devicePixelRatio;
    canvas.pixelSize = Qt.size(canvas.width * pixelRatio, canvas.height * pixelRatio);
}

// ================ HUD PANEL ================== //
function startHud(hudPanel) {
    var ctx = hudPanel.getContext("2d");
    ctx.clearRect(0, 0, hudPanel.width, hudPanel.height);

    ctx.fillStyle="red";
    ctx.strokeStyle="black";
    ctx.font="40px Arial";
    ctx.fillText("X", 300, 800);
//    ctx.fillRect(200, 200, 500, 300);
//    console.log("test")
}
