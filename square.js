Qt.include("gl-matrix.js")

/* 保存画布上下文 */
var gl;

var width = 0;
var height = 0;

var vertexPostionAttrib;
var vertexIndex;
var translationUniform;

var mvMatrixUniform;    // 模型视图
var pMatrixUniform;     // 透视
var nUniform;           // 法线

var pMatrix  = mat4.create();
var mvMatrix = mat4.create();
var nMatrix  = mat4.create();

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

//    initShaders();
    var vertCode =  'attribute vec3 aVertexPosition;' +
                    'attribute vec3 aVertexNormal;' +  // 法线
                    'uniform highp mat4 uPMatrix;' +
                    'uniform highp mat4 uMVMatrix;'+
                    'uniform highp mat4 uCMatrix;' +
                    'uniform highp mat4 uNormalMatrix;' +
                    'attribute vec3 aColor;' +
                    'varying vec3 vColor;'   +
                    'void main(void) {'      +
                        'gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);' +
                        'vColor = aColor;' +
                        'highp vec4 transformNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);' +
//                        'gl_TutorialsSize = 10.0;' +
                    '}';
    var vertShader = getShader(gl, vertCode, gl.VERTEX_SHADER);

    var fragCode =  'precision mediump float;'+
                    'varying vec3 vColor;' +
                    'void main(void) {' +
                        'gl_FragColor = vec4(vColor, 0.8);' +
                    '}';
    var fragShader = getShader(gl, fragCode, gl.FRAGMENT_SHADER);

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    vertexPostionAttrib = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    var colorAttrib = gl.getAttribLocation(shaderProgram, "aColor");
    translationUniform = gl.getUniformLocation(shaderProgram, "translation");

    mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    pMatrixUniform  = gl.getUniformLocation(shaderProgram, "uPMatrix");

//  ================================================================  //
//    initBuffers();
    var vertexPosition = [   // Front face
                              -1.0, -1.0,  1.0,
                              1.0, -1.0,  1.0,
                              1.0,  1.0,  1.0,
                              -1.0,  1.0,  1.0,

                              // Back face
                              -1.0, -1.0, -1.0,
                              -1.0,  1.0, -1.0,
                              1.0,  1.0, -1.0,
                              1.0, -1.0, -1.0,

                              // Top face
                              -1.0,  1.0, -1.0,
                              -1.0,  1.0,  1.0,
                              1.0,  1.0,  1.0,
                              1.0,  1.0, -1.0,

                              // Bottom face
                              -1.0, -1.0, -1.0,
                              1.0, -1.0, -1.0,
                              1.0, -1.0,  1.0,
                              -1.0, -1.0,  1.0,

                              // Right face
                              1.0, -1.0, -1.0,
                              1.0,  1.0, -1.0,
                              1.0,  1.0,  1.0,
                              1.0, -1.0,  1.0,

                              // Left face
                              -1.0, -1.0, -1.0,
                              -1.0, -1.0,  1.0,
                              -1.0,  1.0,  1.0,
                              -1.0,  1.0, -1.0
                             ];

//    for(var i = 0; i < vertexPosition.length; i++) {
//        vertexPosition[i]/=2;
//    }

    vertexIndex = [
                    0,  1,  2,      0,  2,  3,    // front
                    4,  5,  6,      4,  6,  7,    // back
                    8,  9,  10,     8,  10, 11,   // top
                    12, 13, 14,     12, 14, 15,   // bottom
                    16, 17, 18,     16, 18, 19,   // right
                    20, 21, 22,     20, 22, 23    // left
                ];

//    vertexPosition = [0.00000,0.00000,4.00000,
//             3.46410,0.00000,2.00000,
//             -1.73205,3.00000,2.00000,];
//    vertexIndex = [0,1,2];

    var colors = [
                0,0,1,
                0,0,1,
                0,0,1,
                0,0,1,
                //
                0,0.5,0,
                0,0.5,0,
                0,0.5,0,
                0,0.5,0,
                //
                0,0,0,
                1,0,0,
                0,0,0,
                1,0,1,
                //
                0,0,1,
                1,0,0,
                0,1,0,
                1,0,1,
                //
                0,0,1,
                1,0,0,
                0,1,0,
                1,0,1,
                //
                0,0,1,
                1,0,0,
                0,1,0,
                1,0,1
            ];

    var vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPosition), gl.STATIC_DRAW);
    // var vertex_buffer = createArrayBuffer(new Float32Array(vertices));

    var Index_Buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index_Buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndex), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vertexPostionAttrib, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPostionAttrib);

//    console.log("indices: " + indices.length);
    var color_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    gl.vertexAttribPointer(colorAttrib, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorAttrib);


//  ==========================================================   //
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
    mat4.fromTranslation(mvMatrix, vec3.fromValues(canvas.xPos / 60, canvas.yPos / 60, canvas.zPos - 10) );
//    mat4.identity(mvMatrix);
//    mat4.lookAt(mvMatrix, [0, 0, 0], [0, 0, 0], [0, 1, 0]);
//    mat4.translate(mvMatrix, mvMatrix, [canvas.xPos, canvas.yPos, canvas.zPos - 10]);
    /* 进行旋转，fromRotation() 函数创造一个新的矩阵，所以之后调用该函数会覆盖掉前面的操作 */
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.xRotAnim), [1, 0, 0]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.yRotAnim), [0, 1, 0]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.zRotAnim), [0, 0, 1]);
    gl.uniformMatrix4fv(mvMatrixUniform, false, mvMatrix);

//    gl.drawArrays(gl.POINTS, 0, 6);
    gl.drawElements(gl.TRIANGLES, vertexIndex.length, gl.UNSIGNED_SHORT, 0);
//    gl.drawElements(gl.LINES, 3, gl.UNSIGNED_SHORT, 0);
}

function initShaders() {

}

/**
 * 初始化缓冲数据
 */
function initBuffers() {

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
 * gl       gl 对象
 * codestr  渲染程序代码，具体渲染方式
 * type     渲染类型
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
