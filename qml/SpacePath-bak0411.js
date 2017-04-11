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
var mvMatrix = mat4.create();
var nMatrix  = mat4.create();

// 纹理
var xTexture;
var yTexture;

// 顶点索引
var ball_vertex_count = [];

// 绘制球面时的精度, 至少为 4 的倍数
var accuracy = 48;
var calcIndexMode = "line";

// 传感器路径
var lastSensorPoint = [-1, -1, 1];
var sensorPath = [];
var sensorPathIndex = [];
var pointVertexSides = 12;

// 相关绘图变量
var canvasArgs;

function initializeGL(canvas) {
    gl = canvas.getContext("canvas3d", {depth: true, antilias: true});
    gl2d = canvas.getContext("2d");
    // 设置 OpenGL 状态
    gl.enable(gl.DEPTH_TEST);   // 深度测试
    gl.depthFunc(gl.LESS);
    gl.enable(gl.CULL_FACE);  // 设置遮挡剔除有效
    gl.cullFace(gl.BACK);
    gl.clearColor(0.98, 0.98, 0.98, 1.0);
    gl.clearDepth(1.0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.lineWidth(canvas.line_width);

    initArguments(canvas);
    initShaders();
    initBuffers();
    loadTextureImage("qrc:/img/compass.png", 0, gl.TEXTURE0);
    loadTextureImage("qrc:/img/test.png", 1, gl.TEXTURE1);
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
                    'uniform highp mat4 uMVMatrix;'+    // 模型视图矩阵
                    'uniform highp mat4 uNormalMatrix;' +   // 模型法线矩阵
                    'uniform vec3 uLightDirection;'+        // 直射光的方向

                    'varying vec3 vLight;'   +
                    'varying vec2 vXTexture;'+

                    'void main(void) {'      +
                        'gl_Position = uPMatrix * uMVMatrix * uCMatrix * vec4(aVertexPosition, 1.0); '+
                        'highp vec3 ambientLight = vec3(0.42, 0.42, 0.42);' +  // 环境光
                        'highp vec3 directionalLightColor = vec3(0.82, 0.82, 0.82);' +  // 直射光，与物体的颜色矩阵相乘
                        // 'highp vec3 directionalVector = vec3(0.75, 0.75, 0.75);' +      // 直射光的方向
                        'highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);' +
                        'highp float directional = max(dot(transformedNormal.xyz, uLightDirection), 0.0);' +
                        'vLight = aColor * (ambientLight + (directionalLightColor * directional)) ;' +
//                        'vLight = aColor;' +
                        'vXTexture = aXTexture;' +
                    '}';
    var vertShader = getShader(gl, vertCode, gl.VERTEX_SHADER);

    var fragCode =  'precision highp float;'+
                    'varying vec3 vLight;' +
                    'varying vec2 vXTexture;' +
                    'uniform sampler2D uXSampler;' +
                    'uniform sampler2D uYSmapler;' +
                    'uniform int uEnableTexture;' +
                    'void main(void) {' +
                        'mediump vec3 xtextureColor = texture2D(uXSampler, vec2(vXTexture.s, vXTexture.t)).rgb;' +
                        'mediump vec3 ytextureColor = texture2D(uYSmapler, vec2(vXTexture.s, vXTexture.t)).rgb;' +
                        'if( uEnableTexture == 0 ) {gl_FragColor = vec4(vLight, 0.5);}' +
                        'else if(uEnableTexture == 1 ) {gl_FragColor = vec4(vLight * xtextureColor, 0.5);}'+
                        'else if(uEnableTexture == 2) {gl_FragColor = vec4(vLight * ytextureColor, 0.5);}' +
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

    uniforms.model_view_matrix  = gl.getUniformLocation(shaderProgram, "uMVMatrix");    // 模型视图
    uniforms.camera_matrix      = gl.getUniformLocation(shaderProgram, "uCMatrix");     // 摄像机
    uniforms.perspective_matrix = gl.getUniformLocation(shaderProgram, "uPMatrix");     // 透视
    uniforms.normal_matrix      = gl.getUniformLocation(shaderProgram, "uNormalMatrix");    // 法线
    uniforms.light_direction    = gl.getUniformLocation(shaderProgram, "uLightDirection");  // 光照

    uniforms.xSamplerUniform = gl.getUniformLocation(shaderProgram, "uXSampler");
//    gl.bindTexture(gl.TEXTURE_2D, xTexture);
//    gl.activeTexture(gl.TEXTURE0);
//    gl.uniform1i(uniforms.xSamplerUniform, 0);  // 使用第一个纹理单元

    uniforms.ySamplerUniform = gl.getUniformLocation(shaderProgram, "uYSampler");
//    gl.bindTexture(gl.TEXTURE_2D, yTexture);
//    gl.activeTexture(gl.TEXTURE1);
//    gl.uniform1i(uniforms.ySamplerUniform, 1);

    uniforms.enable_texture = gl.getUniformLocation(shaderProgram, "uEnableTexture");   // 启用纹理贴图
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
//    lineIndex = [];
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
    // vertexNormalData.concat()

    ball_vertex_count[0] = ball.vertexIndex.length;
    ball_vertex_count[1] = lineIndex.length;
    ball_vertex_count[2] = lessLineIndex.length;

//    console.log("==========");
//    console.log(coord);
//    console.log(coordIndex.length-6);
//    console.log(coordIndex);
//    console.log("==========");

    // 顶点信息
    buffers.coord_buffer = createArrayBuffer(gl.ARRAY_BUFFER, new Float32Array(coord), gl.DYNAMIC_DRAW);

    buffers.coord_index_buffer = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(coordIndex), gl.STATIC_DRAW);
    buffers.line_index_buffer = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineIndex), gl.STATIC_DRAW);
    buffers.less_line_index_buffer = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lessLineIndex), gl.STATIC_DRAW);
    // 传递顶点数据
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 0, 0);

    /**************/

    // 法线
    buffers.vertex_normal_buffer = createArrayBuffer(gl.ARRAY_BUFFER, new Float32Array(coord), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attributes.vertex_normal, 3, gl.FLOAT, false, 0, 0);

    // 色彩信息
    buffers.color_buffer = createArrayBuffer(gl.ARRAY_BUFFER, new Float32Array(lineColorData), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attributes.color, 3, gl.FLOAT, false, 0, 0);

    // heading & pitch
    /** 将 sensor point 显示为圆形  **/
    // 初始化顶点，以便在缓冲区分配空间
    var vertexPoint = getSensorPoint(0.5, 0, 1, canvasArgs.point_size, pointVertexSides, [0.0, 0.0, 0.0]);
    vertexPoint = vertexPoint.concat([0, 0, 0], [0.0, 0.0, 0.0])   // 手动将原点添加进去
    var vertexIndex = [];
    var i = 0;
    for(i = 1; i < pointVertexSides; i++) {
        vertexIndex.push(0, i, i+1, 0, i+1, i, pointVertexSides+1, i, i+1, pointVertexSides+1, i+1, i)
    }
    vertexIndex.push(0, 1, pointVertexSides, 0, pointVertexSides, 1, pointVertexSides+1, 1, pointVertexSides, pointVertexSides+1, pointVertexSides, 1);
//    console.log(vertexPoint);
//    console.log(vertexIndex);
    buffers.point_buffer = createArrayBuffer(gl.ARRAY_BUFFER, new Float32Array(vertexPoint), gl.DYNAMIC_DRAW);
    // 绘制正反两面，索引不需要改变
    buffers.point_index_buffer = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndex), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 6*4, 0);

    // path Buffer initialization
    buffers.path_buffer = gl.createBuffer();
    buffers.path_index_buffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, buffers.path_buffer);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.DYNAMIC_DRAW);
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([]), gl.DYNAMIC_DRAW);

    // sensor simulator and line
    // 长方体共需 6*4 个顶点, 每个顶点 9 个数据，初始化数据以便分配空间
    vertexPoint = [];
    for(i = 0; i < 24; i++) {
        vertexPoint.push(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    }
//    console.log(vertexPoint);

    buffers.sensor_simulator_buffer = createArrayBuffer(gl.ARRAY_BUFFER, new Float32Array(vertexPoint), gl.DYNAMIC_DRAW);

    vertexIndex = [];
    for(i = 0; i < 6; i++) {
        vertexIndex.push(i*4, i*4+1, i*4+2, i*4, i*4+2, i*4+3);
    }
//    console.log(vertexIndex);

    // 索引不需要改变
    buffers.sensor_simulator_index_buffer = createArrayBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndex), gl.STATIC_DRAW);
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

function createArrayBuffer(type, data, drawtype, unbind) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, data, drawtype);

    if( unbind ) {
        gl.bindBuffer(type, null);
    }
    return buffer;
}

function loadTextureImage(imgsrc, index, textureUnit) {
    var testImage = TextureImageFactory.newTexImage();
    testImage.src = imgsrc;
    testImage.imageLoaded.connect(function() {
        // 成功加载图片
        var texture = gl.createTexture();
        // 绑定 2D 纹理
        gl.activeTexture(textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // 将图片绘制到 2D 纹理上
        gl.texImage2D(gl.TEXTURE_2D,   // target
                       0,               // level
                       gl.RGBA,         // internalformat
                       gl.RGBA,         // format
                       gl.UNSIGNED_BYTE,// type
                       testImage );     //

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

        // 生成 2D 纹理
        gl.generateMipmap(gl.TEXTURE_2D);
        switch (index) {
        case 0:
            xTexture = texture;
            gl.uniform1i(uniforms.xSamplerUniform, 0);
            break;
        case 1:
            yTexture = texture;
            gl.uniform1i(uniforms.ySamplerUniform, 1);
            break;
        }
        gl.bindTexture(gl.TEXTURE_2D, 0);
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
     mat4.fromTranslation(mvMatrix, vec3.fromValues(canvas.xPos, canvas.yPos, canvas.zPos) );
//    mat4.identity(mvMatrix);
    // 设置观察点
//    mat4.lookAt(mvMatrix, [canvas.cx, canvas.cy, canvas.cz], [0, 0, 0], [0, 0, 1]);
//    mat4.translate(mvMatrix, mvMatrix, [canvas.xPos, canvas.yPos, canvas.zPos]);
    /* 进行旋转，fromRotation() 函数创造一个新的矩阵，所以之后调用该函数会覆盖掉前面的操作 */
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.xRotAnim), [1, 0, 0]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.yRotAnim), [0, 1, 0]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.zRotAnim), [0, 0, 1]);
    gl.uniformMatrix4fv(uniforms.model_view_matrix, false, mvMatrix);

    /** 由于使用 mvMatrix 对球体进行观察时，直射光源的位置也会随之变化，因此单独使用一个 cMatrixUniform 变量控制摄像机的方位 **/
    mat4.lookAt(cMatrix, [canvas.cx, canvas.cy, canvas.cz], [0, 0, 0], [0, 0, 1]);
    gl.uniformMatrix4fv(uniforms.camera_matrix, false, cMatrix);

    mat4.invert(nMatrix, mvMatrix);
    mat4.transpose(nMatrix, nMatrix);

    gl.uniformMatrix4fv(uniforms.normal_matrix, false, nMatrix);
    // 设置光照方向
    gl.uniform3fv(uniforms.light_direction, canvasArgs.light_direction);

    /** 读取相应参数 **/
    setArguments(canvas);

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

    var angle = calcAngle(canvasArgs.pitch, canvasArgs.heading);
    var u = angle[0], v = angle[1];
    /********* 绘制路径 *********/
    if( canvasArgs.enable_path ) {
//        console.log("enable path: " + u + "  === "+ v);
        drawPath(gl, u, v);
    } else {
        resetPath(u, v, canvasArgs.vector_length);
    }
    drawPoint(gl, u, v);
    // 绘制传感器指向的方向
    /******** 绘制长方体表示的传感器 **********/
    if( canvasArgs.enable_cube ) {
        drawCube(gl, u, v);
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
    /******** 在球面上绘制斑点，连接原点到球面斑点的线段 **********/
    var sensorPoint = getSensorPoint(u, v, canvasArgs.vector_length + 0.008, canvasArgs.point_size, pointVertexSides, [0.0, 0.8, 0.6]);
//     console.log(sensorPoint.length/2);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.point_buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(sensorPoint));
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 6*4, 0);
    gl.vertexAttribPointer(attributes.vertex_normal,   3, gl.FLOAT, false, 6*4, 0);            // 认为顶点方向就是法线方向
    gl.vertexAttribPointer(attributes.color,           3, gl.FLOAT, false, 6*4, 3*4);          // 偏移量为 3 个数据 * sizeof(float)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.point_index_buffer);
    // 由于需要绘制射线，因此索引数目需要加倍
    gl.drawElements(gl.TRIANGLES, pointVertexSides*6*2, gl.UNSIGNED_SHORT, 0);
}

function drawCube(gl, u, v) {
    /**
     * 在颜色信息数组中添加法线信息，之后对数据的处理需要做相应的改变
     * 由于需要在长方体上添加纹理，实际上需要 24 个顶点，首先计算出 8 个顶点的位置
     * 然后根据各自的方位按逆时针（前后左右上下，正对面时的左上角顶点开始）放置顶点
    **/
    var rgblight = [0.3, 0.3, 0.3].concat(canvasArgs.light_direction);
    var sback = getCubePoint(1-u, v+0.5, 0.125, canvasArgs.radius*0.375*0.3);
    var sfront = getCubePoint(u, v, 0.125, canvasArgs.radius*0.375*0.6);
    var i;
    for(i = 0; i < 4; i++) {
        sfront.push(sback[i]);
    }
//    console.log(sfront + "  " + sfront.length)

    var surface = [];
    var surfaceIndex = [
                2, 3, 0, 1,
                6, 7, 4, 5,
                5, 4, 3, 2,
                1, 0, 7, 6,
                5, 2, 1, 6,
                3, 4, 7, 0
            ];
    surfaceIndex.forEach(function(elements) {
        surface = surface.concat(sfront[elements], rgblight);
    });
//    console.log(surface);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sensor_simulator_buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(surface));
    gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 9*4, 0);       // 顶点间隔变为 9
    gl.vertexAttribPointer(attributes.color, 3, gl.FLOAT, false, 9*4, 3*4);
    // 设置法线，确保模拟器的亮度始终是最亮的
    gl.vertexAttribPointer(attributes.vertex_normal, 3, gl.FLOAT, false, 9*4, 6*4);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.sensor_simulator_index_buffer);

    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

//    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texture_coord_buffer);   // 启用纹理顶点数据
//    gl.enableVertexAttribArray(attributes.xtexture);                // 使用纹理
    /** 每个面采用不同的贴图，需要分别进行绘制 **/
//    gl.bindTexture(gl.TEXTURE_2D, xTexture);
//    gl.uniform1i(uniforms.enable_texture, 1);
//    gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 0);
//    gl.bindTexture(gl.TEXTURE_2D, yTexture);
//    gl.uniform1i(uniforms.enable_texture, 2);
//    gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 12*2);
//    gl.bindTexture(gl.TEXTURE_2D, 0);
//    gl.uniform1i(uniforms.enable_texture, 0);
//    gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 24*2);
    /** 取消纹理，如果不取消使用纹理的话，会导致之后的图形无法正常显示 **/
//    gl.uniform1i(uniforms.enable_texture, 0);
//    gl.disableVertexAttribArray(attributes.xtexture);
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
    var points = drawSurfaceAndMove(u, v, f, canvasArgs.radius*0.375*0.2, 4);
    var i = 0;
    for(i = 0; i < 4; i++) {
//        cubePoint = cubePoint.concat(movePointByAngle(points[i], [u,v], offset));
        cubePoint.push(movePointByAngle(points[i], [u,v], offset));
    }
//    console.log(cubePoint + " == " + cubePoint.length);
    return cubePoint;
}

//var count = 0;
function drawPath(gl, u, v) {
    // 路径相关
    if( (lastSensorPoint[0] !== u || lastSensorPoint[1] !== v || lastSensorPoint[2] !== canvasArgs.vector_length) ) {
        var n;
        var offset = 0.006;
        lastSensorPoint[2] += offset;
        /** 全部改成用直线相连 **/
        /** 通过线性插值后，不用记录每个顶点，如果前后两点之间的距离过大，用线性插值加入路径中 **/
//        console.log(calcVertexDistance([u, v, canvasArgs.vector_length], lastSensorPoint))
        if(calcVertexDistance([u, v, canvasArgs.vector_length+offset], lastSensorPoint) > canvasArgs.vector_length/60) {
            var sensorPoint = getLinearSensorPoint([u, v, canvasArgs.vector_length+offset], lastSensorPoint, [0.0, 0.0, 0.6]);

            lastSensorPoint = [u, v, canvasArgs.vector_length];
            // 向路径中添加新的位置
            n = sensorPath.length/24;
            sensorPath.push.apply(sensorPath, sensorPoint);  // 每 24 个数据意味着包含一个 SensorPoint
            for(var i = n; i < sensorPath.length/24; i++) {
                sensorPathIndex.push(i*4+0, i*4+1, i*4+2, i*4+0, i*4+2, i*4+3, i*4+0, i*4+2, i*4+1, i*4+0, i*4+3, i*4+2);
            }
//            console.log( [u, v, canvasArgs.vector_length+offset] + "   ==== "  + lastSensorPoint )
//            console.log(sensorPath.length)
        } else {
            // 还原 lastSensorPoint
            lastSensorPoint[2] -= offset;
        }
//        console.log(sensorPathIndex)
//        console.log(count++)
        /**
         * 没有点时就绘制图形导致出错，由于没有点，因此计算颜色数据时，偏移量导致内存错误
         * 只要路径偏移了，就不会出现没有点却偏移内存的错误
         * 另外如果数据没有更新，就不用重新给 buffer 传值
        **/
        updateBuffer(buffers.path_buffer, gl.ARRAY_BUFFER, new Float32Array(sensorPath), gl.DYNAMIC_DRAW);
        updateBuffer(buffers.path_index_buffer, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sensorPathIndex), gl.DYNAMIC_DRAW);
    }
//    console.log("a: " + sensorPathIndex.length);
    if( sensorPathIndex.length > 0 ) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.path_buffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.path_index_buffer);
        gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 6*4, 0);
        gl.vertexAttribPointer(attributes.color, 3, gl.FLOAT, false, 6*4, 3*4);
        gl.drawElements(gl.TRIANGLES, sensorPathIndex.length, gl.UNSIGNED_SHORT, 0);
    }
}

function updateBuffer(buffer, type, data, drawtype) {
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, data, drawtype);
}

/**
 * 重置变量
*/
function resetPath(u ,v, length) {
    lastSensorPoint = [u, v, length];
    sensorPath = [];
    sensorPathIndex = [];
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

/**
 * 根据 u，v 计算传感器当前位置四周的点的位置
 * 获取点位置用的方法是：先在 XOY 平面上绘制出相应图形，根据 u, v 进行旋转，
 * 然后根据 u, v, offset 确定的向量进行平移
 * @param {double} u 
 * @param {double} v 
 * @param {double} offset 与原点的距离
 * @param {double} pointSize  中心点到顶点的距离
 * @param {int}    n          边数，至少为 4
 * @param {*} rgb  三维数组
 * @returns 坐标和颜色的数组
 */
function getSensorPoint(u, v, offset, pointSize, n, rgb) {
    var sensorPoint = [];
    var points = [ [0, 0, 0] ];        // 二维数组，每个元素是一个三维数组，包含顶点的 xyz 坐标
    points = points.concat(drawSurfaceAndMove(u, v, 0, pointSize, n));

    // 将顶点添加到 sensorPoint 数组中，并处理平移
    var i = 0;
    for(i = 0; i < n+1; i++) {
//        sensorPoint = sensorPoint.concat(points[i], rgb);
        // 将得到的平面进行平移
        sensorPoint = sensorPoint.concat(movePointByAngle(points[i], [u, v], offset), rgb);
    }
//    console.log(sensorPoint);
    return sensorPoint;
}

/**
 * 根据 u，v 计算需要绘制的平面的点的位置
 * 不论绘制什么平面，其中心点在原点，但所在平面有可能不在 XOY 平面上
 * 获取点位置用的方法是：在 XOY 平面上绘制出相应图形，根据 u, v 进行旋转，
 * @param {double} u
 * @param {double} v
 * @param {double} f        对应横滚角
 * @param {double} offset   与原点的距离
 * @param {double} pointSize  中心点到顶点的距离
 * @param {int}    n          边数，至少为 4
 * @returns 二级数组
 */
function drawSurfaceAndMove(u, v, f, pointSize, n) {
    var i;
    var points = [];        // 二级数组，每个元素是一个三维数组，包含顶点的 xyz 坐标
    var point = [];
    /* 处理旋转,从 xoy 平面上的 (r, 0) 开始，计算每个顶点的位置，然后将其反转，旋转得到相应角度的平面 */
    for(i = 0; i < n; i++) {
        point = [pointSize*Math.cos(Math.PI*2*i/n), pointSize*Math.sin(Math.PI*2*i/n), 0];
        // 变量 f 影响面的旋转
        var tp0 = point[0];
        var tp1 = point[1];
        point[0] = tp0 * Math.cos(Math.PI*2*f) - tp1 * Math.sin(Math.PI*2*f);
        point[1] = tp1 * Math.cos(Math.PI*2*f) + tp0 * Math.sin(Math.PI*2*f);
        // 处理 u 带来的变化
        tp0 = point[0]
        point[0] = tp0 * Math.cos(-Math.PI*u);
        point[2] = tp0 * Math.sin(-Math.PI*u);
        // 处理 v 带来的变化
        tp0 = point[0] * Math.cos(-Math.PI*2*v) + point[1] * Math.sin(-Math.PI*2*v);
        tp1 = point[1] * Math.cos(-Math.PI*2*v) - point[0] * Math.sin(-Math.PI*2*v);
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
 * @param {*} rgb       颜色信息
 */
function getLinearSensorPoint(p, lp, rgb) {
    var u = p[0], v = p[1], offset = p[2];
    var lu = lp[0], lv = lp[1], loffset = lp[2];
    var linearSensorPoint = [];
    var uoff = canvasArgs.path_size/180;
    var voffp = canvasArgs.path_size/360/Math.sin(Math.PI*(u+uoff));
    var voffs = canvasArgs.path_size/360/Math.sin(Math.PI*(u-uoff));
    var voffp2 = canvasArgs.path_size/360/Math.sin(Math.PI*(lu+uoff));
    var voffs2 = canvasArgs.path_size/360/Math.sin(Math.PI*(lu-uoff));

    /** 直接将两点直连 **/
    // 0 - 1 - 1' - 0' 面
    linearSensorPoint = linearSensorPoint.concat(
                calcVertex(u-uoff, v-voffs, offset), rgb,    // 0
                calcVertex(u+uoff, v-voffp, offset), rgb,    // 1
                calcVertex(lu+uoff, lv-voffp2, loffset), rgb, // 1'
                calcVertex(lu-uoff, lv-voffs2, loffset), rgb  // 0'
                );
    // 1 - 2 - 1' - 2' 面
    linearSensorPoint = linearSensorPoint.concat(
                calcVertex(u+uoff, v-voffp, offset), rgb,    // 1
                calcVertex(u+uoff, v+voffp, offset), rgb,    // 2
                calcVertex(lu+uoff, lv-voffp2, loffset), rgb, // 1'
                calcVertex(lu+uoff, lv+voffp2, loffset), rgb  // 2'
                );
    // 2 - 3 - 2' - 3' 面
    linearSensorPoint = linearSensorPoint.concat(
                calcVertex(u+uoff, v+voffp, offset), rgb,        // 2
                calcVertex(u-uoff, v+voffs, offset), rgb,        // 3
                calcVertex(lu+uoff, lv+voffp2, loffset), rgb,     // 2'
                calcVertex(lu-uoff, lv+voffs2, loffset), rgb      // 3'
                );
    // 3 - 0 - 3' - 0' 面
    linearSensorPoint = linearSensorPoint.concat(
                calcVertex(u-uoff, v+voffs, offset), rgb,        // 3
                calcVertex(u-uoff, v-voffs, offset), rgb,        // 0
                calcVertex(lu-uoff, lv+voffs2, loffset), rgb,     // 3'
                calcVertex(lu-uoff, lv-voffs2, loffset), rgb      // 0'
                );
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
