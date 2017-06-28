/******************************
  filename: SpacePath.js
  feature:  绘制 3D 动态图形
  author:   brifuture
  date:     2017.04.10
*******************************/

Qt.include("gl-matrix.js")

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

// matrixs
var pMatrix  = mat4.create();
var cMatrix  = mat4.create();
var mMatrix = mat4.create();
var nMatrix  = mat4.create();

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
var maxPathNum = 4800;  // 每条路径上的最多点的个数,由于每个 sensorPoint 面有 8*3 个数据，该数值最好为 24 的整数倍
var currentPath = 0;    // 当前路径的序号
var sensorPathIndex = [];
var sensorPathIndex2 = [];
var pointVertexSides = 12;

// 相关绘图变量
var canvasArgs;

function initializeGL(canvas) {
    gl = canvas.getContext("canvas3d", {depth: true, antilias: true});
    gl2d = canvas.getContext("2d");
    /* 设置 OpenGL 状态 */
    gl.enable(gl.DEPTH_TEST);   // 深度测试
    gl.depthFunc(gl.LESS);
    gl.enable(gl.CULL_FACE);  // 设置遮挡剔除有效
    gl.cullFace(gl.BACK);
    gl.clearColor(0.98, 0.98, 0.98, 1.0);
    gl.clearDepth(1.0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.enable(gl.BLEND);        // 开启混合，启用透明层
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
}

function initShaders() {
    var vertCode =  'attribute vec3 aVertexPosition;' +
                    'attribute vec3 aVertexNormal;' +  // 法线
                    'attribute vec3 aColor;' +
                    'attribute vec2 aXTexture;' +

                    'uniform highp mat4 uPMatrix;' +    // 透视矩阵
                    'uniform highp mat4 uCMatrix;' +    // 摄像机
                    'uniform highp mat4 umMatrix;'+    // 模型视图矩阵
                    'uniform highp mat4 uNormalMatrix;' +   // 模型法线矩阵
                    'uniform vec3 uLightDirection;'+        // 直射光的方向
                    'uniform vec4 uColor;'+

                    'varying vec3 vLight;'   +
                    'varying vec2 vXTexture;'+

                    'void main(void) {'      +
                        'gl_Position = uPMatrix * uCMatrix * umMatrix * vec4(aVertexPosition, 1.0); '+
                        'highp vec3 ambientLight = vec3(0.42, 0.42, 0.42);' +  // 环境光
                        'highp vec3 directionalLightColor = vec3(0.79, 0.79, 0.79);' +  // 直射光，与物体的颜色矩阵相乘
                        // 'highp vec3 directionalVector = vec3(0.75, 0.75, 0.75);' +      // 直射光的方向
                        'highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);' +
                        'highp float directional = max(dot(transformedNormal.xyz, uLightDirection), 0.0);' +
                        'if( uColor[3] > 0.0 ) {vLight = vec3(uColor) * (ambientLight + (directionalLightColor * directional));}' +
                        'else {vLight = aColor * (ambientLight + (directionalLightColor * directional));}' +
                        'vXTexture = aXTexture;' +
                    '}';
    var vertShader = getShader(gl, vertCode, gl.VERTEX_SHADER);

    var fragCode =  'precision highp float;'+
                    'varying vec3 vLight;' +
                    'varying vec2 vXTexture;' +
                    'uniform sampler2D uXSampler;' +
                    'uniform sampler2D uYSampler;' +
                    'uniform sampler2D uZSampler;' +
                    'uniform int uEnableTexture;' +
                    'void main(void) {' +
                        'mediump vec4 xtextureColor = texture2D(uXSampler, vec2(vXTexture.s, vXTexture.t));' +
                        'mediump vec4 ytextureColor = texture2D(uYSampler, vec2(vXTexture.s, vXTexture.t));' +
                        'mediump vec4 ztextureColor = texture2D(uZSampler, vec2(vXTexture.s, vXTexture.t));' +
                        'if( uEnableTexture == 0 ) {gl_FragColor = vec4(vLight, 0.55);}' +
                        'else if( uEnableTexture == 1 ) {gl_FragColor = vec4(vLight, 1.0) * xtextureColor;}'+
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

    uniforms.model_view_matrix  = gl.getUniformLocation(shaderProgram, "umMatrix");    // 模型视图
    uniforms.camera_matrix      = gl.getUniformLocation(shaderProgram, "uCMatrix");     // 摄像机
    uniforms.perspective_matrix = gl.getUniformLocation(shaderProgram, "uPMatrix");     // 透视
    uniforms.normal_matrix      = gl.getUniformLocation(shaderProgram, "uNormalMatrix");    // 法线
    uniforms.light_direction    = gl.getUniformLocation(shaderProgram, "uLightDirection");  // 光照

    uniforms.xSamplerUniform = gl.getUniformLocation(shaderProgram, "uXSampler");
    uniforms.ySamplerUniform = gl.getUniformLocation(shaderProgram, "uYSampler");
    uniforms.zSamplerUniform = gl.getUniformLocation(shaderProgram, "uZSampler");

    uniforms.enable_texture = gl.getUniformLocation(shaderProgram, "uEnableTexture");   // 启用纹理贴图

    uniforms.color_unit = gl.getUniformLocation(shaderProgram, "uColor");
}

/**
 * 初始化缓冲数据
 */
function initBuffers() {
    var coord = [// x coord
                 0.0, 0.0, 0.0,
                 10.0, 0.0, 0.0,
                 // y coord
                 0.0, 0.0, 0.0,
                 0.0, 10.0, 0.0,
                 // z coord
                 0.0, 0.0, 0.0,
                 0.0, 0.0, 10.0
            ];
    var coordIndex = [0, 1,
                      2, 3,
                      4, 5];
    var lineIndex = [0, 1,
                     2, 3,
                     4, 5];
    var lessLineIndex = [0, 1,
                         2, 3,
                         4, 5];
    // 坐标轴的颜色
    var lineColorData = [
                // x 
                0.1,0.1,0,
                0.1,0.1,0,
                // y 
                0,0.1,0,
                0,0.1,0,
                // z blue
                0,0,0.1,
                0,0,0.1,
            ];

    // 球体表面各处顶点坐标及索引
    var ball = getBallVertex(accuracy, canvasArgs.radius, coordIndex.length, "JW");
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

//    console.log("==========");
//    console.log(coord);
//    console.log(coordIndex.length-6);
//    console.log(coordIndex);
//    console.log("==========");

    // 顶点信息
    buffers.coord_buffer           = createArrayBuffer(gl.ARRAY_BUFFER, new Float32Array(coord), gl.DYNAMIC_DRAW);
    buffers.coord_index_buffer     = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(coordIndex), gl.STATIC_DRAW);
    buffers.line_index_buffer      = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineIndex), gl.STATIC_DRAW);
    buffers.less_line_index_buffer = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lessLineIndex), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);   // 传递顶点数据

    // 法线
    buffers.vertex_normal_buffer = createArrayBuffer(gl.ARRAY_BUFFER, new Float32Array(coord), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attributes.vertex_normal, 3, gl.FLOAT, false, 0, 0);

    // 色彩信息
    buffers.color_buffer = createArrayBuffer(gl.ARRAY_BUFFER, new Float32Array(lineColorData), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attributes.color, 3, gl.FLOAT, false, 0, 0);

    /** 将 sensor point 显示为圆形  **/
    // 初始化顶点，以便在缓冲区分配空间
    var vertexPoint = getSensorPoint([0.5, 0.0, 0.0], 1, canvasArgs.point_size, pointVertexSides, [0.0, 0.0, 0.0]);
    vertexPoint = vertexPoint.concat([0, 0, 0], [0.0, 0.0, 0.0])   // 手动将原点添加进去
    buffers.point_buffer = createArrayBuffer(gl.ARRAY_BUFFER, new Float32Array(vertexPoint), gl.DYNAMIC_DRAW);
    // 绘制正反两面，索引不需要改变
    var vertexIndex = [];
    var i = 0;
    for(i = 1; i < pointVertexSides; i++) {
        vertexIndex.push(0, i, i+1, 0, i+1, i, pointVertexSides+1, i, i+1, pointVertexSides+1, i+1, i)
    }
    vertexIndex.push(0, 1, pointVertexSides, 0, pointVertexSides, 1, pointVertexSides+1, 1, pointVertexSides, pointVertexSides+1, pointVertexSides, 1);
    buffers.point_index_buffer = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndex), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 6*4, 0);

    // path Buffer initialization
    buffers.path_buffer = [];
    buffers.path_index_buffer  = [];
    buffers.path_index2_buffer = [];
    buffers.path_buffer[currentPath]       = createArrayBuffer(gl.ARRAY_BUFFER, 4*maxPathNum, gl.DYNAMIC_DRAW);
    buffers.path_index_buffer[currentPath] = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, 4*maxPathNum, gl.DYNAMIC_DRAW);
    buffers.path_index2_buffer[currentPath]= createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, 2*maxPathNum, gl.DYNAMIC_DRAW);

    // sensor simulator and line 长方体共需 6*4 个顶点, 每个顶点 9 个数据，数据类型为 Float32，4字节
    buffers.sensor_simulator_buffer = createArrayBuffer(gl.ARRAY_BUFFER, 4*24*9, gl.DYNAMIC_DRAW);
    vertexIndex = [];
    for(i = 0; i < 6; i++) {
        vertexIndex.push(i*4, i*4+1, i*4+2, i*4, i*4+2, i*4+3);
    }
    buffers.sensor_simulator_index_buffer = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndex), gl.STATIC_DRAW);  // 索引不需改变

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
    buffers.texture_coord_buffer = createArrayBuffer(gl.ARRAY_BUFFER, new Float32Array(textureCoord), gl.STATIC_DRAW);
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

    if( unbind ) {
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
        var texture = gl.createTexture();   // 绑定 2D 纹理
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
        gl.texImage2D(gl.TEXTURE_2D,   // target
                       0,               // level
                       gl.RGBA,         // internalformat
                       gl.RGBA,         // format
                       gl.UNSIGNED_BYTE,// type
                       image );     //

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
        gl.uniformMatrix4fv(uniforms.perspective_matrix, false, pMatrix);
    }

    /* 清除给定的标志位 */
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    /* 平移变换 */
//    mat4.fromTranslation(mMatrix, vec3.fromValues(canvas.xPos, canvas.yPos, canvas.zPos) );
    mat4.identity(mMatrix);
//    mat4.translate(mMatrix, mMatrix, [canvas.xPos, canvas.yPos, canvas.zPos]);
    /* 进行旋转，fromRotation() 函数创造一个新的矩阵，所以之后调用该函数会覆盖掉前面的操作 */
//    mat4.rotate(mMatrix, mMatrix, degToRad(canvas.xRotAnim), [1, 0, 0]);
//    mat4.rotate(mMatrix, mMatrix, degToRad(canvas.yRotAnim), [0, 1, 0]);
//    mat4.rotate(mMatrix, mMatrix, degToRad(canvas.zRotAnim), [0, 0, 1]);
    gl.uniformMatrix4fv(uniforms.model_view_matrix, false, mMatrix);

    /** 设置观察点。由于使用 mMatrix 对球体进行观察时，直射光源的位置也会随之变化，因此单独使用一个 cMatrixUniform 变量控制摄像机的方位 **/
    mat4.lookAt(cMatrix, [canvas.cx, canvas.cy, canvas.cz], [0, 0, 0], [0, 0, 1]);
    gl.uniformMatrix4fv(uniforms.camera_matrix, false, cMatrix);

    mat4.invert(nMatrix, mMatrix);
    mat4.transpose(nMatrix, nMatrix);

    gl.uniformMatrix4fv(uniforms.normal_matrix, false, nMatrix);
    // 设置光照方向
    gl.uniform3fv(uniforms.light_direction, canvasArgs.light_direction);

    /** 读取相应参数 **/
    setArguments(canvas);
    // 开始绘制
    startPaint(canvas);
}

/** 开始执行实际的绘图操作，由于开启了 ALPHA BLEND 功能，先绘制球内物体*/
function startPaint(canvas) {
    var angle = calcAngle(canvasArgs.pitch, canvasArgs.heading);
    var u = angle[0], v = angle[1];
    /********* 绘制路径 *********/
    if( canvasArgs.enable_path ) {
        drawPath(gl, u, v);
    } else {
        resetAllPath(u, v, canvasArgs.vector_length);
    }
    // 绘制传感器指向的方向
    drawPoint(gl, u, v);
    /******** 绘制长方体表示的传感器 **********/
    if( canvasArgs.enable_cube ) {
        drawCube(gl, u, v);
    }

    // 在绘制球面的时候不使用纹理
    gl.uniform1i(uniforms.enable_texture, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color_buffer);
    gl.vertexAttribPointer(attributes.color, 3, gl.FLOAT, false, 0, 0);
    // 顶点数据和法线数据
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.coord_buffer);
    gl.vertexAttribPointer(attributes.vertex_normal, 3, gl.FLOAT, false, 0, 0);
    if(canvas.drawMode === "surface") {
        // 绘制坐标轴
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.coord_index_buffer);
        gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
        gl.drawElements(gl.LINES, 6, gl.UNSIGNED_SHORT, 0);
        // 绘制球形
        gl.drawElements(gl.TRIANGLES, ball_vertex_count[0], gl.UNSIGNED_SHORT, 6*2);
    } else if( canvas.drawMode === "line"){
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.line_index_buffer);
        gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
        gl.drawElements(gl.LINES, ball_vertex_count[1], gl.UNSIGNED_SHORT, 0);
//        gl.drawElements(gl.LINES, 6, gl.UNSIGNED_SHORT, 0);
    } else if (canvas.drawMode === "lessLine") {
//        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, coordIndexBuffer);
//        gl.drawElements(gl.TRIANGLES, ball_vertex_count[0] - accuracy * accuracy*1.5, gl.UNSIGNED_SHORT, (6 + accuracy * accuracy*1.5)*2);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.less_line_index_buffer);
        gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
        gl.drawElements(gl.LINES, ball_vertex_count[2] - accuracy*3*2, gl.UNSIGNED_SHORT, 0);
        // 绘制赤道所在的圆面
        gl.drawElements(gl.TRIANGLES, accuracy*3*2*0.25, gl.UNSIGNED_SHORT, (ball_vertex_count[2] - accuracy*3*2*0.5) * 2);
    }

}

function setArguments(canvas) {
    gl.lineWidth(canvas.line_width);

    // 如果现有的 referenceRadius 与画布的实际参数不同，则进行修改
    if( canvasArgs.radius !== canvas.radius) {
        canvasArgs.radius = canvas.radius;
//        initBuffers();
        var coord = [// x coord
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
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.coord_buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(coord));
    }

    canvasArgs = canvas.args;
    /** 如果 heading 有偏移，应把偏移算上 **/
    canvasArgs.heading = canvas.heading - canvas.headingOffset;
}


/**
 * 绘制传感器指向的方向，如果需要记录路径的话，从当前位置开始记录路径
 * @param {*} gl 
 * @param {*} pitch     俯仰角的角度，范围是[-180, 180]
 * @param {*} heading   航向角的角度，增大的方向为从 Z 轴正无穷远处向原点看时顺时针方向，范围是[0, 360)
 */
function drawPoint(gl, u, v) {
    gl.uniform4fv(uniforms.color_unit, [0.0, 0.8, 0.6, 1.0]);
    /******** 在球面上绘制斑点，连接原点到球面斑点的线段 **********/
    var sensorPoint = getSensorPoint([u, v, 0], canvasArgs.vector_length + 0.008, canvasArgs.point_size, pointVertexSides);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.point_buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(sensorPoint));
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(attributes.vertex_normal,   3, gl.FLOAT, false, 0, 0);            // 认为顶点方向就是法线方向
//    gl.vertexAttribPointer(attributes.color,           3, gl.FLOAT, false, 6*4, 3*4);          // 偏移量为 3 个数据 * sizeof(float)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.point_index_buffer);
    // 由于需要绘制射线，因此索引数目需要加倍
    gl.drawElements(gl.TRIANGLES, pointVertexSides*6*2, gl.UNSIGNED_SHORT, 0);
    gl.uniform4fv(uniforms.color_unit, [0.0, 0.0, 0.0, 0.0]);
}

/**
 * 根据 u，v 计算传感器当前位置四周的点的位置
 * 获取点位置用的方法是：先在 XOY 平面上绘制出相应图形，根据 u, v 进行旋转，
 * 然后根据 u, v, offset 确定的向量进行平移
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
    var points = [ [0, 0, 0] ];        // 二维数组，每个元素是一个三维数组，包含顶点的 xyz 坐标
    // 优化数组连接，concat 在这里的时间复杂度为 O(n2)
//    points = points.concat(getSpinnedSurfaceVertex([u, v, 0], pointSize, n));
    points.push.apply(points, getSpinnedSurfaceVertex([u, v, f], pointSize, n));

    // 将顶点添加到 sensorPoint 数组中，并将得到的平面进行平移
    points.forEach(function(element){
        sensorPoint.push.apply(sensorPoint, movePointByAngle(element, [u, v], offset));
//        sensorPoint.push.apply(sensorPoint, rgb);
    });
    return sensorPoint;
}

/**
  * 绘制长方体
**/
function drawCube(gl, u, v) {
    /**
     * 在颜色信息数组中添加法线信息，之后对数据的处理需要做相应的改变
     * 由于需要在长方体上添加纹理，实际上需要 24 个顶点，首先计算出 8 个顶点的位置
     * 然后根据各自的方位按逆时针（前后左右上下，正对面时的左上角顶点开始）放置顶点
    **/
    var rgblight  = [0.6, 0.1, 0.1].concat(canvasArgs.light_direction);
    var right_rgb = [0.1, 0.6, 0.1].concat(canvasArgs.light_direction);
    var down_rgb  = [0.1, 0.1, 0.6].concat(canvasArgs.light_direction);
//    var sback  = getCubePoint(1-u, v+0.5, 0.125, canvasArgs.radius*0.375*0.3);
//    var sfront = getCubePoint(u, v, 0.125, canvasArgs.radius*0.375*0.6);
    var sback  = getCubePoint(1, 0.5, 0.125, canvasArgs.radius*0.375*0.3);
    var sfront = getCubePoint(0, 0, 0.125, canvasArgs.radius*0.375*0.6);
    var i;
    for(i = 0; i < 4; i++) {
        sfront.push(sback[i]);
    }
    var surface = [];
    // direction is based on vector (10, 0, 0) to (0, 0, 0)
    var surfaceIndex = [
                2, 3, 0, 1,     // front
                6, 7, 4, 5,     // back
                2, 5, 4, 3,     // left
                0, 7, 6, 1,     // right
                5, 2, 1, 6,     // up
                3, 4, 7, 0,     // down
//                6, 7, 5, 4,     // back2
//                0, 7, 1, 6,     // right2
//                3, 4, 0, 7     // down2
            ];
    for(i = 0; i < 8; i++) {
        surface.push.apply(surface, sfront[surfaceIndex[i]]);
        surface.push.apply(surface, rgblight);
    }
    for(i = 8; i < 16; i++) {
        surface.push.apply(surface, sfront[surfaceIndex[i]]);
        surface.push.apply(surface, right_rgb);
    }
    for(i = 16; i < surfaceIndex.length; i++) {
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
    /* 用矩阵进行旋转操作，就不用对顶点进行操作 */
    var localmMatrix = mat4.create();
    var cinvMatrix = mat4.create();
    mat4.invert(cinvMatrix, cMatrix);
//    mat4.fromRotation(localmMatrix, degToRad(u*180), [0, 1, 0]);
    mat4.identity(localmMatrix);
    mat4.rotate(mMatrix, mMatrix, degToRad(u*180), [0, 1, 0]);    // 沿Y轴旋转u对应的角度
//    mat4.rotate(mMatrix, mMatrix, degToRad(v*360), [0, 0, 1]);    // 沿Z轴旋转v对应的角度
    mat4.multiply(localmMatrix, localmMatrix, cinvMatrix);
//    gl.uniformMatrix4fv(uniforms.model_view_matrix, false, localmMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sensor_simulator_buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(surface));
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 9*4, 0);       // 顶点间隔变为 9
    gl.vertexAttribPointer(attributes.color,           3, gl.FLOAT, false, 9*4, 3*4);
    // 设置法线，确保模拟器的亮度始终是最亮的
    gl.vertexAttribPointer(attributes.vertex_normal, 3, gl.FLOAT, false, 9*4, 6*4);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.sensor_simulator_index_buffer);

//    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

     gl.enableVertexAttribArray(attributes.xtexture);                // 使用纹理
    /** 每个面采用不同的贴图，需要分别进行绘制 **/
    gl.bindTexture(gl.TEXTURE_2D, xTexture);
    gl.uniform1i(uniforms.enable_texture, 1);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    gl.bindTexture(gl.TEXTURE_2D, yTexture);
    gl.uniform1i(uniforms.enable_texture, 2);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 18*2);
    gl.bindTexture(gl.TEXTURE_2D, zTexture);
    gl.uniform1i(uniforms.enable_texture, 3);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 24*2);
    gl.uniform1i(uniforms.enable_texture, 0);
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    /** 取消纹理，如果不取消使用纹理的话，会导致之后的图形无法正常显示 **/
    gl.disableVertexAttribArray(attributes.xtexture);

//    mat4.copy(mMatrix, localmMatrix);
//    console.log(localmMatrix + " ===>  " + mMatrix);
//    console.log("==================================");
    gl.uniformMatrix4fv(uniforms.model_view_matrix, false, mMatrix);
//    gl.uniformMatrix4fv(uniforms.camera_matrix, false, cMatrix);
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
    var points = getSpinnedSurfaceVertex([u, v, f], canvasArgs.radius*0.375*0.2, 4);
    var i = 0;
    for(i = 0; i < 4; i++) {
        cubePoint.push(movePointByAngle(points[i], [u,v], offset));
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
    gl.uniform4fv(uniforms.color_unit, [0.0, 0.0, 0.6, 1.0]);    // 传入颜色 uniform，就不再需要颜色顶点数据
//    /*
//     * 使用全局数组绘制路径，使用内存和绘制耗时较多，但没有显示错误
//     * 取消了颜色和顶点数据的绑定，不需要对内存进行偏移
    if( calcVertexDistance([u, v, canvasArgs.vector_length], lastSensorPoint) > canvasArgs.point_size*0.2 ) {
        var sensorPoint = getLinearSensorPoint([u, v, canvasArgs.vector_length], lastSensorPoint);
        lastSensorPoint = [u, v, canvasArgs.vector_length];
        var n = sensorPath.length/24;       // 第 n 个 sensorPoint

        // 向路径中添加新的位置
//      ** 当 sensorPath.length 超过 20000 时，数组过大，不再显示顶点
        sensorPath.push.apply(sensorPath, sensorPoint);  // 每 24 个数据意味着包含一个 SensorPoint, 每 6 个数据代表一个点
        sensorPathIndex.push(
            n*8+0, n*8+4, n*8+1, n*8+1, n*8+4, n*8+5,     // 0 - 1 - 0' - 1'
            n*8+1, n*8+5, n*8+2, n*8+2, n*8+6, n*8+5,     // 1 - 2 - 1' - 2'
            n*8+2, n*8+6, n*8+3, n*8+3, n*8+7, n*8+6,     // 2 - 3 - 2' - 3'
            n*8+3, n*8+7, n*8+0, n*8+0, n*8+4, n*8+7,     // 3 - 0 - 3' - 0'
            n*8+0, n*8+1, n*8+4, n*8+1, n*8+5, n*8+4,     // 0 - 1 - 1' - 0'
            n*8+1, n*8+2, n*8+5, n*8+2, n*8+5, n*8+6,     // 1 - 2 - 2' - 1'
            n*8+2, n*8+3, n*8+6, n*8+3, n*8+6, n*8+7,     // 2 - 3 - 3' - 2'
            n*8+3, n*8+0, n*8+7, n*8+0, n*8+7, n*8+4      // 3 - 0 - 0' - 3'
        );
        sensorPathIndex2.push(
            n*8+0, n*8+1, n*8+4, n*8+0, n*8+1, n*8+5,     // 0 - 1 - 0' - 1'
            n*8+1, n*8+2, n*8+5, n*8+1, n*8+2, n*8+6,     // 1 - 2 - 1' - 2'
            n*8+2, n*8+3, n*8+6, n*8+2, n*8+3, n*8+7,     // 2 - 3 - 2' - 3'
            n*8+3, n*8+0, n*8+7, n*8+3, n*8+0, n*8+4      // 3 - 0 - 3' - 0'
        );
//        console.log(count + " === " + sensorPath.length + " === " + sensorPathIndex.length )
        count++
        updateSubBuffer(gl.ARRAY_BUFFER, buffers.path_buffer[currentPath], 0, new Float32Array(sensorPath));
        updateSubBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.path_index_buffer[currentPath], 0, new Uint16Array(sensorPathIndex));
        updateSubBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.path_index2_buffer[currentPath], 0, new Uint16Array(sensorPathIndex2));
        if( sensorPathIndex.length >= 2*maxPathNum ) {
            currentPath++;
            buffers.path_buffer[currentPath]       = createArrayBuffer(gl.ARRAY_BUFFER, 4*maxPathNum, gl.DYNAMIC_DRAW);
            buffers.path_index_buffer[currentPath] = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, 4*maxPathNum, gl.DYNAMIC_DRAW);
            buffers.path_index2_buffer[currentPath]= createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, 2*maxPathNum, gl.DYNAMIC_DRAW);
            resetCurrentPath(u, v, canvasArgs.vector_length);
        }
    }
    for(var i = 0; i < currentPath;i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.path_buffer[i]);
        gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
        if( canvasArgs.path_real_line ) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.path_index_buffer[i]);
            gl.drawElements(gl.TRIANGLES, 2*maxPathNum, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.path_index2_buffer[i]);
            gl.drawElements(gl.TRIANGLES, maxPathNum, gl.UNSIGNED_SHORT, 0);
        }
    }
    if( sensorPathIndex.length > 0 ) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.path_buffer[currentPath]);
        gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);
        if( canvasArgs.path_real_line) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.path_index_buffer[currentPath]);
            gl.drawElements(gl.TRIANGLES, sensorPathIndex.length, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.path_index2_buffer[i]);
            gl.drawElements(gl.TRIANGLES, sensorPathIndex2.length, gl.UNSIGNED_SHORT, 0);
        }
    }
//    */
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
function resetCurrentPath(u ,v, length) {
    lastSensorPoint = [u, v, length];
    sensorPath = [];
    sensorPathIndex = [];
    sensorPathIndex2 = [];
}

function resetAllPath(u, v, length) {
    for(var i = 0; i < currentPath; i++) {
        gl.deleteBuffer(buffers.path_buffer[i]);
        gl.deleteBuffer(buffers.path_index_buffer[i]);
    }

    currentPath = 0;
    buffers.path_buffer[currentPath]       = createArrayBuffer(gl.ARRAY_BUFFER, 4*maxPathNum, gl.DYNAMIC_DRAW);
    buffers.path_index_buffer[currentPath] = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, 4*maxPathNum, gl.DYNAMIC_DRAW);
    buffers.path_index2_buffer[currentPath]= createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, 2*maxPathNum, gl.DYNAMIC_DRAW);
    resetCurrentPath(u, v, length);
}

function calcAngle(pitch, heading) {
    var u, v;
    if( Math.abs(pitch) <= 90 ) {
        // 将俯仰角转换成绘图时的 theta 角
        u = (90-pitch)/180;
        // 绘图时的 beta 角
        v = heading / 360;
    } else {
        // pitch 绝对值超过 90
        if( pitch > 0) {
            u = (pitch - 90) /180;
        }
        else {
            u = (270 + pitch) / 180;
        }
        v = (heading+180) % 360 / 360;
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
    return movePointByVector(pos, vector);
}

function movePointByVector(pos, vector) {
    return [pos[0]+vector[0] , pos[1]+vector[1], pos[2]+vector[2]];
}

function getSensorPathPoint(angles, offset, pointSize, n) {
    var u = angles[0];
    var v = angles[1];
    var f = angles[2];
    var sensorPoint = [];
    var points = [];        // 二维数组，每个元素是一个三维数组，包含顶点的 xyz 坐标
    points.push.apply(points, getSpinnedSurfaceVertex([u, v, f], pointSize, n));

    // 将顶点添加到 sensorPoint 数组中，并将得到的平面进行平移
    points.forEach(function(element){
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
function getSpinnedSurfaceVertex(angles, pointSize, n) {
    var u = angles[0];
    var v = angles[1];
    var f = angles[2];
    var points = [];        // 二级数组，每个元素是一个三维数组，包含顶点的 xyz 坐标
    var point = [];
    /* 处理旋转,从 xoy 平面上的 (r, 0) 开始，计算每个顶点的位置，然后将其反转，旋转得到相应角度的平面 */
    for(var i = 0; i < n; i++) {
        point = [pointSize*Math.cos(Math.PI*2*i/n), pointSize*Math.sin(Math.PI*2*i/n), 0];
        // 变量 f 影响面的旋转
        var tp0 = point[0];
        var tp1 = point[1];
        point[0] = tp0 * Math.cos(Math.PI*2*f) - tp1 * Math.sin(Math.PI*2*f);
        point[1] = tp1 * Math.cos(Math.PI*2*f) + tp0 * Math.sin(Math.PI*2*f);
        /**************
            处理 u 带来的变化
            需要添加负号的原因在于，圆的法线在XOZ平面上绕Y轴旋转θ角，
            x坐标为正的点，其变换之后的z坐标应该为负，因此添加负号作为修正因子。
        *************/
        tp0 = point[0]
        point[0] = tp0 * Math.cos(Math.PI*u);
        point[2] = tp0 * Math.sin(-Math.PI*u);
        /********************
            处理 v 带来的变化
            经过旋转之后，X本是正的坐标将会移到负半轴上，Y同理，
        ********************/
        tp0 = point[0] * Math.cos(Math.PI*2*v) + point[1] * Math.sin(-Math.PI*2*v);
        tp1 = point[1] * Math.cos(Math.PI*2*v) - point[0] * Math.sin(-Math.PI*2*v);
        point[0] = tp0;
        point[1] = tp1;
        points.push(point);
    }
    return points;
}

/**
 * 连接前后两个斑点圆面的对应顶点，形成平面
 * @param {Array} p     p[0] = u    p[1] = v    p[2] = radius
 * @param {Array} lp    lp[0] = lu  lp[1] = lv  lp[2] = lradius
 * @param {*} u         与 theta 角对应，l 前缀表示上一个点
 * @param {*} v         与 beta  角对应
 * @param {*} radius    与原点的距离
 */
function getLinearSensorPoint(p, lp) {
    var u = p[0], v = p[1], offset = p[2];
    var lu = lp[0], lv = lp[1], loffset = lp[2];
    var linearSensorPoint = [];

//    /* 将对应面上的四个点用索引相连接，节省内存
    var uoff = canvasArgs.path_size/180;
    var voffp = canvasArgs.path_size/360/Math.sin(Math.PI*(u+uoff));
    var voffs = canvasArgs.path_size/360/Math.sin(Math.PI*(u-uoff));
    var voffp2 = canvasArgs.path_size/360/Math.sin(Math.PI*(lu+uoff));
    var voffs2 = canvasArgs.path_size/360/Math.sin(Math.PI*(lu-uoff));

    // 0 - 1 - 2 - 3  first
    linearSensorPoint.push.apply(linearSensorPoint, calcVertex(u-uoff, v-voffs, offset));   // 0
    linearSensorPoint.push.apply(linearSensorPoint, calcVertex(u+uoff, v-voffp, offset));   // 1
    linearSensorPoint.push.apply(linearSensorPoint, calcVertex(u+uoff, v+voffp, offset));   // 2
    linearSensorPoint.push.apply(linearSensorPoint, calcVertex(u-uoff, v+voffs, offset));   // 3
    // 0' - 1' - 2' - 3'  second
    linearSensorPoint.push.apply(linearSensorPoint, calcVertex(lu-uoff, lv-voffs2, loffset));   // 0'
    linearSensorPoint.push.apply(linearSensorPoint, calcVertex(lu+uoff, lv-voffp2, loffset));   // 1'
    linearSensorPoint.push.apply(linearSensorPoint, calcVertex(lu+uoff, lv+voffp2, loffset));   // 2'
    linearSensorPoint.push.apply(linearSensorPoint, calcVertex(lu-uoff, lv+voffs2, loffset));   // 3'
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
    var dis2 = (p1[0]-p2[0]) * (p1[0]-p2[0]) + (p1[1]-p2[1]) * (p1[1]-p2[1]) + (p1[2]-p2[2]) * (p1[2]-p2[2]);
    var dis = Math.sqrt(dis2);
    /** 如果在同一球面上时，可以通过角度算出距离 */
    // var dis = 2 - 2 * (Math.sin(Math.PI * p[0])*Math.sin(Math.PI * lp[0])*Math.cos(Math.PI*2*(p[1]-lp[1])) + Math.cos(Math.PI*p[0])*Math.cos(Math.PI * lu));
    // dis = Math.sqrt(dis) * radius;
    return dis;
}

/**
 * 计算得到球面的所有顶点位置
 *  n   循环次数，绘制球形时的精度
 *  r   球体的半径
 * modeWJ 先绘制纬线，后绘制经线
 * modeJW 先绘制经线，后绘制纬线
 */
function getBallVertex(n, r, offset, mode) {
    calcIndexMode = mode;
    var vertex      = [];       // 顶点坐标数组
    var vertexIndex = [];       // surfaceDrawMode  绘制时所用的索引
    var vertexColor = [];

    var lineIndex       = [];   // lineDrawMode     绘制时所用的索引
    var lessLineIndex   = [];   // lessLineDrawMode 绘制时所用的索引
    var lineColor       = [];
//    var vn = [];        // 顶点法向量数组，当球心在原点时，与顶点坐标相同
//    var mp = [];        //  贴图坐标
    var i, j, k;

    /**
      * Z 轴上的两端点相当于球体的两个极点，
      * j 负责绘制纬线（不经过极点）， i 负责绘制经线（每条都经过极点）
      * 横向连线 (0, 0) - (0, 1)  or  (1, 0) - (1, 1)
      * 纵向连线 (0, 0) - (1, 0)  or  (1, 1) - (0, 1)
      * modeWJ 时:  i 等分 u,  j 等分 v
      * modeJW 时:  i 等分 v,  j 等分 u
      */
    for(j = 0; j < n; j++) {
        for(i = 0; i < n; i++) {
            // 计算顶点位置
            k = [].concat(calcVertex(i/n, j/n, r),              // (0, 0)
                          calcVertex((i+1)/n, j/n, r),          // (1, 0)
                          calcVertex((i+1)/n, (j+1)/n, r),      // (1, 1)
                          calcVertex(i/n, (j+1)/n, r));         // (0, 1)      // i 为 0 或 n-1 时，(0, 1) 点与 (0, 0) 点实际都为极点
            vertex.push.apply(vertex, k);
//            console.log(k)
            /** 用线条或矩形绘制整个球面时，不用在意 mode **/
            // 黎曼矩形绘制球面
            vertexIndex.push(calcBallIndex(i, j, offset), calcBallIndex(i, j, offset+1), calcBallIndex(i, j, offset+2),
                              calcBallIndex(i, j, offset), calcBallIndex(i, j, offset+2), calcBallIndex(i, j, offset+3));
            // 线条绘制空心球体
            lineIndex.push(calcBallIndex(i, j, offset), calcBallIndex(i, j, offset+1),        // modeJW = 经线,
                             calcBallIndex(i, j, offset+1), calcBallIndex(i, j, offset+2)     // modeJW = 纬线
//                             calcBallIndex(i, j, offset+2), calcBallIndex(i, j, offset+3)
                             );

               lineColor.push(0.982, 0.086, 0.102,
                          0.982, 0.086, 0.102,
                          0.982, 0.086, 0.102,
                          0.982, 0.086, 0.102
                          );
//            }

            if( i === n/2-1 ) {
                 lessLineIndex.push(calcBallIndex(i, j, offset+1), calcBallIndex(i, j, offset+2));
            }
        }

        // 线条简单绘制
        // 绘制经线
    //  for(var m = 0; m < 12; m++) {
    //      lessLineIndex.push(calcBallIndex(i, m/12*n, offset), calcBallIndex(i, m/12*n, offset+1));
    //  }
        // 绘出 4 条经线
        lessLineIndex.push(calcBallIndex(j, 0, offset), calcBallIndex(j, 0, offset+1));
        lessLineIndex.push(calcBallIndex(j, 1/4*n, offset), calcBallIndex(j, 1/4*n, offset+1));
        lessLineIndex.push(calcBallIndex(j, 1/2*n, offset), calcBallIndex(j, 1/2*n, offset+1));
        lessLineIndex.push(calcBallIndex(j, 3/4*n, offset), calcBallIndex(j, 3/4*n, offset+1));
    }

    // 赤道所在平面
    for(j = 0; j < n; j++) {
        lessLineIndex.push(0, calcBallIndex(n/2 - 1, j, offset+1), calcBallIndex(n/2 - 1, j, offset+2));
        lessLineIndex.push(0, calcBallIndex(n/2 - 1, j, offset+2), calcBallIndex(n/2 - 1, j, offset+1));
    }

//    console.log("vertex: " + vertex.length/3 + " index: " + vertexIndex.length + " color: " + color.length);
//    console.log(" ==》\n " +  "\n" + vertexIndex);

    // n 次循环，产生 n*n 个四边形，每个四边形有 6 个顶点
    return {
        // 黎曼矩形/线条 绘制球面都是 n*n*6
//        "count": vertexIndex.length,
        "vertex": vertex,
        "vertexIndex": vertexIndex,
        "vertexNormal" : vertex,
        "vertexColor": vertexColor,
        "lineColor": lineColor,
        "lineIndex" : lineIndex,
        "lessLineIndex": lessLineIndex
    };
}


/**
  * 计算索引 index 的值
  * @param  i       第 i 个圆圈
  * @param  j       第 i 个圆圈中的第 j 个部分
  */
function calcBallIndex(i, j, offset) {
    /* 使用 modeJW 进行绘制 */
//    if(calcIndexMode === "WJ")
//        return i*accuracy*4 + j*4 + offset;  // modeWJ
//    else
    return i*4 + j*accuracy*4 + offset;    // modeJW
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
    if( precesion )
        return [parseFloat(x.toFixed(precesion)), parseFloat(y.toFixed(precesion)), parseFloat(z.toFixed(precesion))];
    else 
        return [x, y, z]
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

    if ( !gl.getShaderParameter(shader, gl.COMPILE_STATUS) ) {
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
