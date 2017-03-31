Qt.include("gl-matrix.js")

/* 保存画布上下文 */
var gl;
/* 顶点矩阵 */
var pMatrix  = mat4.create();
var mvMatrix = mat4.create();
var nMatrix  = mat4.create();
/* 格式化的顶点矩阵 */
var pMatrixUniform;
var mvMatrixUniform;
var nUniform;

var vertexPositionAttribute;

var cubeTexture;
var squareVerticesBuffer;
var vertexColorAttribute;

var width = 0;
var height = 0;

function initializeGL(canvas) {
    gl = canvas.getContext("canvas3d", {depth: true, antilias: true});

    // 设置 OpenGL 状态
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.clearColor(0.98, 0.98, 0.98, 1.0);
    gl.clearDepth(1.0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    // set viewport
    gl.viewport(0, 0, canvas.width, canvas.height);

    // 初始化渲染器
    initShaders()
    // 初始化缓冲
    initBuffers()

    // load Textures
    var qtLogoImage = TextureImageFactory.newTexImage()
    qtLogoImage.imageLoaded.connect(function() {
        // 成功加载图片
        console.log("Texture loaded, " + qtLogoImage.src);
        // create canvas3DTexture object
        cubeTexture = gl.createTexture();
        // 绑定 2D 纹理
        gl.bindTexture(gl.TEXTURE_2D, cubeTexture);

        // 将图片绘制到 2D 纹理上
        gl.texImage2D(gl.TEXTURE_2D,   // target
                       0,               // level
                       gl.RGBA,         // internalformat
                       gl.RGBA,         // format
                       gl.UNSIGNED_BYTE,// type
                       qtLogoImage )     //

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST)

        // 生成 2D 纹理
        gl.generateMipmap(gl.TEXTURE_2D)
    })

    qtLogoImage.imageLoadingFailed.connect(function() {
        console.log("Texture load failed, " + qtLogoImage.src)
    })

    qtLogoImage.src = "qrc:/img/compass.ico"
}

function paintGL(canvas) {
    var pixelRatio = canvas.devicePixelRatio;
    var currentWidth = canvas.width * pixelRatio;
    var currentHeight = canvas.height * pixelRatio;
    if (currentWidth !== width || currentHeight !== height ) {
        width = currentWidth;
        height = currentHeight;
        /* 设定渲染区域 */
        gl.viewport(0, 0, width, height);

        /* 通过给定的边界生成透视投影矩阵 */
        mat4.perspective(pMatrix, degToRad(45), width / height, 0.1, 500.0);

        /* 将给定的 4x4 矩阵赋给 uniform 变量 */
        gl.uniformMatrix4fv(pMatrixUniform, false, pMatrix);
    }

    /* 清除给定的标志位 */
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* 平移变换 */
    mat4.fromTranslation(mvMatrix, vec3.fromValues(canvas.xPos, canvas.yPos, canvas.zPos-10.0) );
    /* 进行旋转 */
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.xRotAnim), [1, 0, 0]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.yRotAnim), [0, 1, 0]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.zRotAnim), [0, 0, 1]);
//    mat4.fromRotation(mvMatrix, degToRad(canvas.xRotAnim), [1, 0, 0]);
//    mat4.fromRotation(mvMatrix, degToRad(canvas.yRotAnim), [0, 1, 0]);
//    mat4.fromRotation(mvMatrix, degToRad(canvas.zRotAnim), [0, 0, 1]);

    // 矩阵赋值给 uniform
    gl.uniformMatrix4fv(mvMatrixUniform, false, mvMatrix);

    mat4.invert(nMatrix, mvMatrix);
    mat4.transpose(nMatrix, nMatrix);
    // 矩阵赋值给 uniform
    gl.uniformMatrix4fv(nUniform, false, nMatrix);

//    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
//    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    /* 按照 mode 给定的模式 绘制给定数量的几何元素 */
//    gl.drawElements(gl.LINES, 1, gl.UNSIGNED_SHORT, 0);
}


var vertexShaderSource = "attribute highp vec3 aVertexNormal;    \
                         attribute highp vec3 aVertexPosition;  \
                         attribute highp vec2 aTextureCoord;    \
                                                                \
                         uniform highp mat4 uNormalMatrix;      \
                         uniform mat4 uMVMatrix;                \
                         uniform mat4 uPMatrix;                  \
                                                                \
                         varying mediump vec4 vColor;            \
                         varying highp vec2 vTextureCoord;       \
                         varying highp vec3 vLighting;           \
                                                                \
                         void main(void) {                       \
                             gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0); \
                             vTextureCoord = aTextureCoord;                                   \
                             highp vec3 ambientLight = vec3(0.5, 0.5, 0.5);                   \
                             highp vec3 directionalLightColor = vec3(0.75, 0.75, 0.75);       \
                             highp vec3 directionalVector = vec3(0.85, 0.8, 0.75);            \
                             highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0); \
                             highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0); \
                             vLighting = ambientLight + (directionalLightColor * directional); \
                         }";


var fragmentShaderSource = "varying highp vec2 vTextureCoord;  \
                            varying highp vec3 vLighting;      \
                                                               \
                            uniform sampler2D uSampler;        \
                                                               \
                            void main(void) {                  \
                                mediump vec3 texelColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t)).rgb; \
                                gl_FragColor = vec4(texelColor * vLighting, 1.0);                                      \
                            }";

vertexShaderSource = "  attribute vec3 aVertexPosition;   \
                        attribute vec4 aVertexColor;    \
                        uniform mat4 uMVMatrix;         \
                        uniform mat4 uPMatrix;          \
                                                        \
                        varying lowp vec4 vColor;       \
                        void main(void) {               \
                            gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);    \
                            vColor = aVertexColor;                                              \
                        }";
fragmentShaderSource = "varying lowp vec4 vColor; \
                        void main(void) {  \
                            gl_FragColor = vColor; \
                        }";

function initShaders() {
    var vertexShader   = getShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    var fragmentShader = getShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
    // 创建着色器
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if( !gl.getProgramParameter(shaderProgram, gl.LINK_STATUS) ) {
        console.log("Unable to initialize the shader program!");
        console.log(gl.getProgramInfoLog(shaderProgram));
    }

    gl.useProgram(shaderProgram);

    vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);

    // 获取统一定位符
    pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

    vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(vertexColorAttribute);
}

function initBuffers() {
//    var lineVerticesBuffer = gl.createBuffer();
//    gl.bindBuffer(gl.ARRAY_BUFFER, lineVerticesBuffer);
//    var lineVertices = [
//                3.0, 0.0, 0.0,
//                0.0, 0.0, 0.0,
//                0.0, 3.0, 0.0,
//                0.0, 0.0, 0.0,
//                0.0, 0.0, 3.0,
//                0.0, 0.0, 0.0,
//            ];
//    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.STATIC_DRAW);
//    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    squareVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);

    var vertices = [
                1.0, 1.0, 0.0,
                -1.0, 1.0, 0.0,
                1.0, -1.0, 0.0,
                -1.0, -1.0, 0.0,
//                -1.0, -1.0, 0.0,
//                1.0, -1.0, 0.0,
//                -1.0, 1.0, 0.0,
//                1.0, 1.0, 0.0
            ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    var colors = [
        1.0,  1.0,  1.0,  1.0,    // 白色
        1.0,  0.0,  0.0,  1.0,    // 红色
        0.0,  1.0,  0.0,  1.0,    // 绿色
        0.0,  0.0,  1.0,  1.0,     // 蓝色
        1.0,  1.0,  1.0,  1.0,    // 白色
        1.0,  0.0,  0.0,  1.0,    // 红色
        0.0,  1.0,  0.0,  1.0,    // 绿色
        0.0,  0.0,  1.0,  1.0     // 蓝色
      ];

    var squareVerticesColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
}

/*
 * 根据渲染类型返回渲染器
 * gl       gl 对象
 * str      渲染程序代码，具体渲染方式
 * type     渲染类型
 * @return  渲染器
*/
function getShader(gl, str, type) {
    // 创建渲染器
    var shader = gl.createShader(type);

    gl.shaderSource(shader, str);
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
