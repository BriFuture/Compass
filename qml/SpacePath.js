Qt.include("gl-matrix.js")

/* 保存画布上下文 */
var gl;

var width = 0;
var height = 0;

// attribute variables from shader
var vertexPositionAttrib;
var pointPositionAttrib;
var vertexNormalAttrib;
var colorAttrib;
var xTextureAttrib;

// uniform variables from shader
var mvMatrixUniform;    // 模型视图
var cMatrixUniform;
var pMatrixUniform;     // 透视
var nUniform;           // 法线
var lightDirectionUniform;

// matrixs
var pMatrix  = mat4.create();
var cMatrix  = mat4.create();
var mvMatrix = mat4.create();
var nMatrix  = mat4.create();

// 绘制缓冲区
var coordBuffer;
var pointBuffer;
var pathBuffer;
var ssBuffer;      // sensor simulator

// 纹理
var xTexture;

var coordIndexBuffer;
var lineIndexBuffer;
var lessLineIndexBuffer;
var ssIndexBuffer;
// 传感器指向
var pointIndexBuffer;
var pathIndexBuffer;

var vertexColorBuffer;
var lineColorBuffer;
// 顶点索引个数
var ball_vertex_count = [];
// 绘制球面时的精度, 至少为 4 的倍数
var accuracy = 48;
var referenceRadius = 4;
var vector_length = 4;
var calcIndexMode = "line";
// 传感器路径
var lastSensorPoint = [-1, -1];
var sensorPath = [];
var sensorPathIndex = [];
var pointVertexSides = 12;

// 相关绘图变量
var enablePath = true;
var sensorPointSize = 0.0;
var sensorPathSize = 0.0;
var enableCube = true;
var heading = 0.0;
var pitch = 0.0;

function initializeGL(canvas) {
    gl = canvas.getContext("canvas3d", {depth: true, antilias: true});

    // 设置 OpenGL 状态
    gl.enable(gl.DEPTH_TEST);   // 深度测试
    gl.depthFunc(gl.LESS);
    gl.enable(gl.CULL_FACE);  // 设置遮挡剔除有效
    gl.cullFace(gl.BACK);
    gl.clearColor(0.98, 0.98, 0.98, 1.0);
    gl.clearDepth(1.0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
//    gl.lineWidth(3.0);

    initArguments(canvas);
    initShaders();
    initBuffers();

//    var qtLogoImage = TextureImageFactory.newTexImage()
//    qtLogoImage.src = "qrc:/img/compass.ico"
//    qtLogoImage.imageLoaded.connect(function() {
//        // 成功加载图片
//        xTexture = gl.createTexture();
//        // 绑定 2D 纹理
//        gl.bindTexture(gl.TEXTURE_2D, xTexture);

//        // 将图片绘制到 2D 纹理上
//        gl.texImage2D(gl.TEXTURE_2D,   // target
//                       0,               // level
//                       gl.RGBA,         // internalformat
//                       gl.RGBA,         // format
//                       gl.UNSIGNED_BYTE,// type
//                       qtLogoImage )     //

//        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
//        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST)

//        // 生成 2D 纹理
//        gl.generateMipmap(gl.TEXTURE_2D)
//    })
}

function initArguments(canvas) {
    heading = canvas.heading;
    pitch = canvas.pitch;
    referenceRadius = canvas.radius;
    lastSensorPoint = calcAngle(pitch, heading);
    vector_length   = canvas.vector_length;
    sensorPointSize = canvas.point_size;
    sensorPathSize  = canvas.path_size;
    enablePath = canvas.enable_path;
    enableCube = canvas.enable_cube;
    gl.lineWidth(canvas.line_width);
}

function initShaders() {
    var vertCode =  'attribute vec3 aVertexPosition;' +
                    'attribute vec3 aVertexNormal;' +  // 法线
                    'attribute vec3 aColor;' +
                    'attribute vec2 aXTexture;' +

                    'uniform highp mat4 uPMatrix;' +    // 透视矩阵
                    'uniform highp mat4 uCMatrix;' +
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
                        'vLight = aColor * (ambientLight + (directionalLightColor * directional));' +
                        'vXTexture = aXTexture;' +
                    '}';
    var vertShader = getShader(gl, vertCode, gl.VERTEX_SHADER);

    var fragCode =  'precision highp float;'+
                    'varying vec3 vLight;' +
                    'varying vec2 vXTexture;' +
                    'uniform sampler2D uSampler;' +
                    'void main(void) {' +
                        'gl_FragColor = vec4(vLight, 0.5);' +
//                        'mediump vec3 texelColor = texture2D(uSampler, vec2(vXTexture.s, vXTexture.t)).rgb;' +
//                        'gl_FragColor = vec4(texelColor * vLight, 1.0);' +
                    '}';
    var fragShader = getShader(gl, fragCode, gl.FRAGMENT_SHADER);

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    vertexPositionAttrib = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttrib);

    vertexNormalAttrib  = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(vertexNormalAttrib);

    colorAttrib = gl.getAttribLocation(shaderProgram, "aColor");
    gl.enableVertexAttribArray(colorAttrib);

    xTextureAttrib = gl.getAttribLocation(shaderProgram, "aXTexture");

    mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    cMatrixUniform  = gl.getUniformLocation(shaderProgram, "uCMatrix");
    pMatrixUniform  = gl.getUniformLocation(shaderProgram, "uPMatrix");
    nUniform = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
    lightDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightDirection");

    var sampleUniform = gl.getUniformLocation(shaderProgram, "uSampler");

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
    var ball = getBallVertex(accuracy, referenceRadius, coordIndex.length, "JW");
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
    coordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, coordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coord), gl.DYNAMIC_DRAW);
    coordIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, coordIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(coordIndex), gl.STATIC_DRAW);
//    gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0);

    lineIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineIndex), gl.STATIC_DRAW);
//    gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0);

    lessLineIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lessLineIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lessLineIndex), gl.STATIC_DRAW);
    // 传递顶点数据
    gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0);
    /**************/

    var vertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coord), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexNormalAttrib, 3, gl.FLOAT, false, 0, 0);

    // 色彩信息
    lineColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineColorData), gl.STATIC_DRAW);
    gl.vertexAttribPointer(colorAttrib, 3, gl.FLOAT, false, 0, 0);

    // heading & pitch
    // 初始化顶点，以便在缓冲区分配空间
    /** 将 sensor point 显示为圆形  **/
    var vertexPoint = getSensorPoint(0.5, 0, 1, sensorPointSize, pointVertexSides, [0.0, 0.0, 0.0]);
    vertexPoint = vertexPoint.concat([0, 0, 0], [0.0, 0.0, 0.0])   // 手动将原点添加进去
//    console.log(vertexPoint);
    pointBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPoint), gl.DYNAMIC_DRAW);
    pointIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pointIndexBuffer);

    var vertexIndex = [];
    var i = 0;
    for(i = 1; i < pointVertexSides; i++) {
        vertexIndex.push(0, i, i+1, 0, i+1, i, pointVertexSides+1, i, i+1, pointVertexSides+1, i+1, i)
    }
    vertexIndex.push(0, 1, pointVertexSides, 0, pointVertexSides, 1, pointVertexSides+1, 1, pointVertexSides, pointVertexSides+1, pointVertexSides, 1);
//    console.log(vertexIndex);
    // 绘制正反两面，索引不需要改变
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndex), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 6*4, 0);

    // path Buffer initialization
    pathBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, pathBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.DYNAMIC_DRAW);
    pathIndexBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([]), gl.DYNAMIC_DRAW);

    // sensor simulator and line
    // 长方体共需 8 个顶点
    vertexPoint = [
                0, 0, 0, 0.0, 0.3, 0.8,     // 0
                0, 0, 0, 0.0, 0.3, 0.8,     // 1
                0, 0, 0, 0.0, 0.3, 0.8,     // 2
                0, 0, 0, 0.0, 0.3, 0.8,     // 3
                0, 0, 0, 0.0, 0.3, 0.8,     // 4
                0, 0, 0, 0.0, 0.3, 0.8,     // 5
                0, 0, 0, 0.0, 0.3, 0.8,     // 6
                0, 0, 0, 0.0, 0.3, 0.8      // 7
            ];
    ssBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ssBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPoint), gl.DYNAMIC_DRAW);
    ssIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ssIndexBuffer);
    // 索引不需要改变
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
                                                               0, 1, 2, 0, 2, 3,    // front
                                                               4, 5, 6, 4, 6, 7,    // back
                                                               0, 7, 1, 1, 7, 6,    // up
                                                               1, 6, 2, 2, 6, 5,    // down
                                                               2, 5, 3, 3, 5, 4,    // left
                                                               3, 4, 0, 0, 4, 7
                                                           ]),
                  gl.STATIC_DRAW);

//    xTexture = gl.createTexture();
//    gl.bindTexture(gl.TEXTURE_2D, xTexture);
//    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);


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
        gl.uniformMatrix4fv(pMatrixUniform, false, pMatrix);
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
    gl.uniformMatrix4fv(mvMatrixUniform, false, mvMatrix);

    /** 由于使用 mvMatrix 对球体进行观察时，直射光源的位置也会随之变化，因此单独使用一个 cMatrixUniform 变量控制摄像机的方位 **/
    mat4.lookAt(cMatrix, [canvas.cx, canvas.cy, canvas.cz], [0, 0, 0], [0, 0, 1]);
    gl.uniformMatrix4fv(cMatrixUniform, false, cMatrix);

    mat4.invert(nMatrix, mvMatrix);
    mat4.transpose(nMatrix, nMatrix);

    gl.uniformMatrix4fv(nUniform, false, nMatrix);
    // 设置光照方向
    gl.uniform3fv(lightDirectionUniform, [0.72, 0.72, 0.72]);

    /** 读取相应参数 **/
    setArguments(canvas);

    gl.bindBuffer(gl.ARRAY_BUFFER, lineColorBuffer);
    gl.vertexAttribPointer(colorAttrib, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, coordBuffer);
    if(canvas.drawMode === "surface") {
        // 绘制坐标轴
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, coordIndexBuffer);
        gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0);
        gl.drawElements(gl.LINES, 6, gl.UNSIGNED_SHORT, 0);
        // 绘制球形
        gl.drawElements(gl.TRIANGLES, ball_vertex_count[0], gl.UNSIGNED_SHORT, 6*2);
    } else if( canvas.drawMode === "line"){
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndexBuffer);
        gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0);
        gl.drawElements(gl.LINES, ball_vertex_count[1], gl.UNSIGNED_SHORT, 0);
//        gl.drawElements(gl.LINES, 6, gl.UNSIGNED_SHORT, 0);
    } else if (canvas.drawMode === "lessLine") {
//        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, coordIndexBuffer);
//        gl.drawElements(gl.TRIANGLES, ball_vertex_count[0] - accuracy * accuracy*1.5, gl.UNSIGNED_SHORT, (6 + accuracy * accuracy*1.5)*2);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lessLineIndexBuffer);
        gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 0, 0);
        gl.drawElements(gl.LINES, ball_vertex_count[2] - accuracy*3*2, gl.UNSIGNED_SHORT, 0);
        // 绘制赤道所在的圆面
        gl.drawElements(gl.TRIANGLES, accuracy*3*2*0.25, gl.UNSIGNED_SHORT, (ball_vertex_count[2] - accuracy*3*2*0.5) * 2);
    }

    // 绘制传感器指向的方向
    drawPoint(gl, pitch, heading);
}

function setArguments(canvas) {
    heading = canvas.heading - canvas.headingOffset;
    pitch = canvas.pitch;
    enablePath = canvas.enable_path;
    enableCube = canvas.enable_cube;
    vector_length = canvas.vector_length;
    sensorPointSize = canvas.point_size;
    sensorPathSize  = canvas.path_size;
    gl.lineWidth(canvas.line_width);

    // 如果现有的 referenceRadius 与画布的实际参数不同，则进行修改
    if( referenceRadius !== canvas.radius) {
        referenceRadius = canvas.radius;
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
        var ball = getBallVertex(accuracy, referenceRadius, 6, "JW");
        coord.push.apply(coord, ball.vertex);
        gl.bindBuffer(gl.ARRAY_BUFFER, coordBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(coord));
    }
}


/**
 * 绘制传感器指向的方向，如果需要记录路径的话，从当前位置开始记录路径
 * @param {*} gl 
 * @param {*} pitch     俯仰角的角度，范围是[-180, 180]
 * @param {*} heading   航向角的角度，增大的方向为从 Z 轴正无穷远处向原点看时顺时针方向，范围是[0, 360)
 */
function drawPoint(gl, pitch, heading) {
    var angle = calcAngle(pitch, heading);
    var u = angle[0], v = angle[1];

    /******** 在球面上绘制斑点，连接原点到球面斑点的线段 **********/
    var sensorPoint = getSensorPoint(u, v, vector_length + 0.008, sensorPointSize, pointVertexSides, [0.0, 0.8, 0.6]);
//     console.log(sensorPoint);
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(sensorPoint));
    gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 6*4, 0);
    gl.vertexAttribPointer(colorAttrib, 3, gl.FLOAT, false, 6*4, 3*4);          // 偏移量为 3 个数据 * sizeof(float)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pointIndexBuffer);
    // 由于需要绘制射线，因此索引数目需要加倍
    gl.drawElements(gl.TRIANGLES, pointVertexSides*6*2, gl.UNSIGNED_SHORT, 0);

    /******** 是否绘制长方体表示的传感器 **********/
    if( enableCube ) {
        var surface = getCubePoint(1-u, v+0.5, 0.125, referenceRadius*0.375*0.3, [0.1, 0.0, 0.2]);
        surface = surface.concat(getCubePoint(u, v, 0.125, referenceRadius*0.375*0.6, [0.3, 0.1, 0.5]));
//        console.log(surface);

        gl.bindBuffer(gl.ARRAY_BUFFER, ssBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(surface));
        gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 6*4, 0);
        gl.vertexAttribPointer(colorAttrib, 3, gl.FLOAT, false, 6*4, 3*4);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ssIndexBuffer);
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    }

    /********* 是否绘制路径 *********/
    if( enablePath ) {
        // 路径相关
        if( (lastSensorPoint[0] !== u || lastSensorPoint[1] !== v) ) {
            var n;
            var offset = 0.006;
            /** 全部改成用直线相连 **/
            /** 通过线性插值后，不用记录每个顶点 **/
            // 如果前后两点之间的距离过大，用线性插值加入路径中
//            if( calcVertexDistance(u, v, lastSensorPoint[0], lastSensorPoint[1], vector_length+offset) > Math.PI*vector_length/90 ) {
            if(calcVertexDistance(u, v, lastSensorPoint[0], lastSensorPoint[1], vector_length+offset) > vector_length/180) {
                sensorPoint = getLinearSensorPoint(u, v, lastSensorPoint[0], lastSensorPoint[1], vector_length+offset, [0.0, 0.0, 0.6]);

                lastSensorPoint[0] = u;
                lastSensorPoint[1] = v;
                // 向路径中添加新的位置
                n = sensorPath.length/24;
                sensorPath.push.apply(sensorPath, sensorPoint);  // 每 24 个数据意味着包含一个 SensorPoint
                for(var i = n; i < sensorPath.length/24; i++) {
                    sensorPathIndex.push(i*4+0, i*4+1, i*4+2, i*4+0, i*4+2, i*4+3, i*4+0, i*4+2, i*4+1, i*4+0, i*4+3, i*4+2);
                }
//                console.log("TOO FAR!");
            }
            // console.log(sensorPath)
            // console.log(sensorPathIndex)
        }
        /** 防止没有点时就绘制图形导致出错，由于没有点，因此计算颜色数据时，偏移量导致内存错误 **/
        if( sensorPath.length > 0) {
            gl.bindBuffer(gl.ARRAY_BUFFER, pathBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sensorPath), gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 6*4, 0);
            gl.vertexAttribPointer(colorAttrib, 3, gl.FLOAT, false, 6*4, 3*4);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pathIndexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sensorPathIndex), gl.DYNAMIC_DRAW);
            gl.drawElements(gl.TRIANGLES, sensorPathIndex.length, gl.UNSIGNED_SHORT, 0);
        }
    } else {
        resetPath(u, v);
    }
}

/**
 * 重置变量
*/
function resetPath(u ,v) {
    lastSensorPoint = [u, v];
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
 * 根据 u，v 计算传感器模拟长方体当前的位置
 * @param {double} u
 * @param {double} v
 * @param {double} offset 与原点的距离
 * @param {*} rgb  三维数组
 * @returns 坐标和颜色的数组
 */
function getCubePoint(u, v, f, offset, rgb) {
    var cubePoint = [];
    var points = drawSurfaceAndMove(u, v, f, referenceRadius*0.375*0.2, 4);
    var i = 0;
    var point = [];
    for(i = 0; i < 4; i++) {
        point = points[i];

        cubePoint = cubePoint.concat(movePointByAngle(point, [u,v], offset), rgb);
    }

//    console.log(cubePoint);
    return cubePoint;

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
    // 控制斑点大小
    /*
    var uoff  = pointSize/180;
    //  如果 u+uoff 或者 u-uoff 是 0 或 1 的话，进行微调 
    if( u+uoff === 0 || u-uoff === 0 ) {
        u += 0.001;
    } else if( u+uoff === 1 || u-uoff === 1 ) {
        u -= 0.001;
    }
    var voff = pointSize/360/Math.sin(Math.PI*(u));
    */
    /*
    var voffp = pointSize/360/Math.sin(Math.PI*(u+uoff));  // 上边（相对）的长度偏移
    var voffs = pointSize/360/Math.sin(Math.PI*(u-uoff));  // 下边（相对）的长度偏移
    if( u+uoff < 1/accuracy+0.01) {
        // 进入北极邻域（上极点）
        // console.log("north poly: " + pitch);
        var pos = calcVertex(u, v, vector_length+offset);
        var halflength = Math.PI * 0.8 / accuracy;
        sensorPoint.push(
            pos[0]-halflength, pos[1]-halflength, pos[2], rgb[0], rgb[1], rgb[2],
            pos[0]+halflength, pos[1]-halflength, pos[2], rgb[0], rgb[1], rgb[2],
            pos[0]+halflength, pos[1]+halflength, pos[2], rgb[0], rgb[1], rgb[2],
            pos[0]-halflength, pos[1]+halflength, pos[2], rgb[0], rgb[1], rgb[2]
        )
    } else if( u-uoff > 1-1/accuracy-0.01 ) {
        // 进入南极邻域（下极点）
        // console.log("south poly: " + pitch);
        var pos = calcVertex(u, v, vector_length+offset);
        var halflength = Math.PI * 0.8 / accuracy;
        sensorPoint.push(
            pos[0]+halflength, pos[1]-halflength, pos[2], rgb[0], rgb[1], rgb[2],
            pos[0]+halflength, pos[1]+halflength, pos[2], rgb[0], rgb[1], rgb[2],
            pos[0]-halflength, pos[1]+halflength, pos[2], rgb[0], rgb[1], rgb[2],
            pos[0]-halflength, pos[1]-halflength, pos[2], rgb[0], rgb[1], rgb[2]
        )
    } else {
        // 不在两个极点附近
        sensorPoint = [].concat(
                    calcVertex(u-uoff, v-voffs, vector_length+offset, 6), rgb,
                    calcVertex(u+uoff, v-voffp, vector_length+offset, 6), rgb,
                    calcVertex(u+uoff, v+voffp, vector_length+offset, 6), rgb,
                    calcVertex(u-uoff, v+voffs, vector_length+offset, 6), rgb
                    );
    }
    */
//    不考虑两极点位置导致的 sensorPoint 的变化
    /*
    sensorPoint = [].concat(
                calcVertex(u-uoff, v, offset), rgb,   // 计算相对角度
                calcVertex(u, v-voff, offset), rgb,
                calcVertex(u+uoff, v, offset), rgb,
                calcVertex(u, v+voff, offset), rgb
                );
    */
    /*
    if( u-uoff < 0 ) {
        sensorPoint = sensorPoint.concat(calcVertex(uoff-u, v+0.5, offset), rgb);
    } else {
        sensorPoint = sensorPoint.concat(calcVertex(u-uoff, v, offset), rgb);
    }
    if( u === 0 || u === 1 ) {
        sensorPoint = sensorPoint.concat(calcVertex(u-uoff, v+0.25, offset), rgb);
    } else {
        sensorPoint = sensorPoint.concat(calcVertex(u, v-voff, offset), rgb);
    }

    if( u+uoff > 1 ) {
        sensorPoint = sensorPoint.concat(calcVertex(2-uoff-u, v+0.5, offset), rgb);
    } else {
        sensorPoint = sensorPoint.concat(calcVertex(u+uoff, v, offset), rgb);
    }
    if( u === 0 || u === 1 ) {
        sensorPoint = sensorPoint.concat(calcVertex(u+uoff, v+0.25, offset), rgb);
    } else {
        sensorPoint = sensorPoint.concat(calcVertex(u, v+voff, offset), rgb);
    }

    var pos = calcVertex(u, v, offset);
    var pos0 = movePointByAngle(pos, [u, v]);
    var pos0 = movePointByVector(pos, [-pointSize, -pointSize, 0]);
    var pos1 = movePointByVector(pos, [pointSize, -pointSize, 0]);
    var pos2 = movePointByVector(pos, [pointSize, pointSize, 0]);
    var pos3 = movePointByVector(pos, [-pointSize, pointSize, 0]);
    sensorPoint = [].concat(
                movePointByAngle(pos0, [u, v]), rgb,
                movePointByAngle(pos1, [u, v]), rgb,
                movePointByAngle(pos2, [u, v]), rgb,
                movePointByAngle(pos3, [u, v]), rgb
                )
    */

    var points = [ [0, 0, 0] ];        // 二维数组，每个元素是一个三维数组，包含顶点的 xyz 坐标
    points = points.concat(drawSurfaceAndMove(u, v, 0, pointSize, n));
//    console.log(points)

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
    // 处理旋转
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
 * @param {*} u 
 * @param {*} v 
 * @param {*} lu 
 * @param {*} lv 
 * @param {*} offset  与原点的距离
 * @param {*} rgb
 */
function getLinearSensorPoint(u, v, lu, lv, offset, rgb) {
//    var p1 = calcVertex(u, v, offset);
//    var p2 = calcVertex(lu, lv, offset);
//    var distance = calcVertexDistance(u, v, lu, lv, offset);
//    var p3 = [];

    var linearSensorPoint = [];
    var uoff = sensorPathSize/180;
    var voffp = sensorPathSize/360/Math.sin(Math.PI*(u+uoff));
    var voffs = sensorPathSize/360/Math.sin(Math.PI*(u-uoff));
    var voffp2 = sensorPathSize/360/Math.sin(Math.PI*(lu+uoff));
    var voffs2 = sensorPathSize/360/Math.sin(Math.PI*(lu-uoff));
//    var xy = [offset*Math.sin(Math.PI*u)*Math.cos(Math.PI*2*v), offset*Math.sin(Math.PI*u)*Math.sin(Math.PI*2*v)];
//    for(var i = 0; i < distance; i+=0.03 ) {
//        p3[0] = p1[0] + (p2[0] - p1[0]) * i;
//        p3[1] = p1[1] + (p2[1] - p1[1]) * i;
//        p3[2] = p1[2] + (p2[2] - p1[2]) * i;
//        linearSensorPoint = linearSensorPoint.concat(
//                    p3, rgb,
//                    p3, rgb,
//                    p3, rgb,
//                    p3, rgb
//                    );
//    }
    /** 直接将两点直连 **/
    // 0 - 1 - 1' - 0' 面
    linearSensorPoint = linearSensorPoint.concat(
                calcVertex(u-uoff, v-voffs, offset, 6), rgb,    // 0
                calcVertex(u+uoff, v-voffp, offset, 6), rgb,    // 1
                calcVertex(lu+uoff, lv-voffp2, offset, 6), rgb, // 1'
                calcVertex(lu-uoff, lv-voffs2, offset, 6), rgb  // 0'
                );
    // 1 - 2 - 1' - 2' 面
    linearSensorPoint = linearSensorPoint.concat(
                calcVertex(u+uoff, v-voffp, offset, 6), rgb,    // 1
                calcVertex(u+uoff, v+voffp, offset, 6), rgb,    // 2
                calcVertex(lu+uoff, lv-voffp2, offset, 6), rgb, // 1'
                calcVertex(lu+uoff, lv+voffp2, offset, 6), rgb  // 2'
                );
    // 2 - 3 - 2' - 3' 面
    linearSensorPoint = linearSensorPoint.concat(
                calcVertex(u+uoff, v+voffp, offset, 6), rgb,        // 2
                calcVertex(u-uoff, v+voffs, offset, 6), rgb,        // 3
                calcVertex(lu+uoff, lv+voffp2, offset, 6), rgb,     // 2'
                calcVertex(lu-uoff, lv+voffs2, offset, 6), rgb      // 3'
                );
    // 3 - 0 - 3' - 0' 面
    linearSensorPoint = linearSensorPoint.concat(
                calcVertex(u-uoff, v+voffs, offset, 6), rgb,        // 3
                calcVertex(u-uoff, v-voffs, offset, 6), rgb,        // 0
                calcVertex(lu-uoff, lv+voffs2, offset, 6), rgb,     // 3'
                calcVertex(lu-uoff, lv-voffs2, offset, 6), rgb      // 0'
                );
    return linearSensorPoint;
}

/**
 * 计算两个顶点之间的距离
 * @param {*} u 
 * @param {*} v 
 * @param {*} lu 
 * @param {*} lv 
 * @param {*} distance 
 */
function calcVertexDistance(u, v, lu, lv, radius) {
    // var p1 = calcVertex(u, v, radius);
    // var p2 = calcVertex(lu, lv, radius);
    // var dis2 = (p1[0]-p2[0]) * (p1[0]-p2[0]) + (p1[1]-p2[1]) * (p1[1]-p2[1]) + (p1[2]-p2[2]) * (p1[2]-p2[2]);
    var dis = 2 - 2 * (Math.sin(Math.PI * u)*Math.sin(Math.PI * lu)*Math.cos(Math.PI*2*(v-lv)) + Math.cos(Math.PI*u)*Math.cos(Math.PI * lu));
    dis = Math.sqrt(dis) * radius;
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

function createArrayBuffer(data) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return buffer;
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
