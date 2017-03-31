Qt.include("gl-matrix.js")

/* 保存画布上下文 */
var gl;

var width = 0;
var height = 0;

var vertexPostionAttrib;
var vertexNormalAttrib;
var colorAttrib;
//var vertexIndex;
var translationUniform;

var mvMatrixUniform;    // 模型视图
var pMatrixUniform;     // 透视
var nUniform;           // 法线

var pMatrix  = mat4.create();
var mvMatrix = mat4.create();
var nMatrix  = mat4.create();

var coordBuffer;
var coordIndexBuffer;
var ball_vertex_count;

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
    gl.lineWidth(1.0);

    initShaders();
    initBuffers();
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
    // mat4.fromTranslation(mvMatrix, vec3.fromValues(canvas.xPos, canvas.yPos, canvas.zPos - 20) );
//    mat4.identity(mvMatrix);
   mat4.lookAt(mvMatrix, [12, 12, 12], [0, 0, 0], [0, 0, 1]);
   mat4.translate(mvMatrix, mvMatrix, [canvas.xPos, canvas.yPos, canvas.zPos]);
    /* 进行旋转，fromRotation() 函数创造一个新的矩阵，所以之后调用该函数会覆盖掉前面的操作 */
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.xRotAnim), [1, 0, 0]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.yRotAnim), [0, 1, 0]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.zRotAnim), [0, 0, 1]);
    gl.uniformMatrix4fv(mvMatrixUniform, false, mvMatrix);

    mat4.invert(nMatrix, mvMatrix);
    mat4.transpose(nMatrix, nMatrix);

    gl.uniformMatrix4fv(nUniform, false, nMatrix);

    // 绘制坐标轴
    gl.drawElements(gl.LINES, 6, gl.UNSIGNED_SHORT, 0);
    // 绘制球形
    gl.drawElements(gl.LINES, ball_vertex_count, gl.UNSIGNED_SHORT, 6 * 2);
//    gl.drawElements(gl.TRIANGLES, ball_vertex_count, gl.UNSIGNED_SHORT, 0);
}

function initShaders() {
    var vertCode =  'attribute vec3 aVertexPosition;' +
                    'attribute vec3 aVertexNormal;' +  // 法线
                    'attribute vec3 aColor;' +

                    'uniform highp mat4 uPMatrix;' +    // 透视矩阵
                    'uniform highp mat4 uMVMatrix;'+    // 模型视图矩阵
                    // 'uniform highp mat4 uCMatrix;' +

                    'uniform highp mat4 uNormalMatrix;' +   // 模型法线矩阵
                    'uniform vec3 uLightDirection;'+
                    'varying vec3 vLight;'   +
                    'void main(void) {'      +
                        'gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);' +
                        // 'highp vec4 transformNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);' +
                        // 'vec3 invLight = normalize(uNormalMatrix * vec4(aVertexNormal, 0.0)).xyz;' +
                        // 'highp vec3 directionalVector = vec3(0.85, 0.8, 0.75);' +
                        // 'float diffuse = clamp(dot(invLight, directionalVector), 0.0, 1.0);' +
                        // 'highp vec3 ambientLight =  vec3(0.5, 0.5, 0.5);' +
                        // 'highp vec3 directionalLightColor = vec3(0.75, 0.75, 0.75);' +
                        'vLight = aColor;' +
//                        'gl_TutorialsSize = 10.0;' +
                    '}';
    var vertShader = getShader(gl, vertCode, gl.VERTEX_SHADER);

    var fragCode =  'precision mediump float;'+
                    'varying vec3 vLight;' +
                    'void main(void) {' +
                        'gl_FragColor = vec4(vLight, 0.58);' +
                    '}';
    var fragShader = getShader(gl, fragCode, gl.FRAGMENT_SHADER);

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    vertexPostionAttrib = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPostionAttrib);

    vertexNormalAttrib  = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    // gl.enableVertexAttribArray(vertexNormalAttrib);

    colorAttrib = gl.getAttribLocation(shaderProgram, "aColor");
    gl.enableVertexAttribArray(colorAttrib);
    
    // translationUniform = gl.getUniformLocation(shaderProgram, "translation");
    mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    pMatrixUniform  = gl.getUniformLocation(shaderProgram, "uPMatrix");
    nUniform = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
}

/**
 * 初始化缓冲数据
 */
function initBuffers() {
    var coord = [// x coord
                 10.0, 0.0, 0.0,
                 0.0, 0.0, 0.0,
                 // y coord
                 0.0, 10.0, 0.0,
                 0.0, 0.0, 0.0,
                 // z coord
                 0.0, 0.0, 10.0,
                 0.0, 0.0, 0.0
            ];
    var coordIndex = [0, 1,
                      2, 3,
                      4, 5];
    // 坐标轴的颜色
    var colorsData = [
                // x red
                1,0,0,
                1,0,0,
                // y green
                0,1,0,
                0,1,0,
                // z blue
                0,0,1,
                0,0,1,
            ];

    // 球体半径
    var radius = 4;
    var ball = getBallVertex(40, radius, coordIndex.length);
    ball_vertex_count = ball.count;
    coord.push.apply(coord, ball.vertex);
    coordIndex.push.apply(coordIndex, ball.vertexIndex);
    colorsData.push.apply(colorsData, ball.color);
    var vertexNormalData = ball.vertexNormal;

//    console.log("==========");
//    console.log(coord);
//    console.log(coordIndex.length-6);
//    console.log(coordIndex);
//    console.log("==========");

    // 顶点信息
    coordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, coordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coord), gl.STATIC_DRAW);
    coordIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, coordIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(coordIndex), gl.STATIC_DRAW);
    // 传递顶点数据
    gl.vertexAttribPointer(vertexPostionAttrib, 3, gl.FLOAT, false, 0, 0);
   

    var vertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormalData), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vertexNormalAttrib, 3, gl.FLOAT, false, 0, 0);


    // 色彩信息
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorsData), gl.STATIC_DRAW);

    gl.vertexAttribPointer(colorAttrib, 3, gl.FLOAT, false, 0, 0);
    
}


/**
 *  n   循环次数，绘制球形时的精度
 *  r   球体的半径
 */
function getBallVertex(n, r, offset) {
    var vertex = [];    // 顶点坐标数组
    var vertexIndex = [];
//    var vn = [];        // 顶点法向量数组，当球心在原点时，与顶点坐标相同
//    var mp = [];        //  贴图坐标
    var color = [];
    var i, j, k;
    /**
      * i 即相当于 u
      * j 即相当于 v
      */
    for(i = 0; i < n; i++) {
        for(j = 0; j < n; j++) {
            k = [].concat(calcVertex(i/n, j/n, r),              // 0 0
                          calcVertex((i+1)/n, j/n, r),          // 1 0
                          calcVertex((i+1)/n, (j+1)/n, r),      // 1 1
                          calcVertex(i/n, (j+1)/n, r));         // 0 1
            vertex.push.apply(vertex, k);
//            console.log(k)
            // 黎曼矩形绘制球面
            // vertexIndex.push(calcIndex(i, j, n, offset), calcIndex(i, j, n, offset+1), calcIndex(i, j, n, offset+2),
                            //  calcIndex(i, j, n, offset), calcIndex(i, j, n, offset+2), calcIndex(i, j, n, offset+3));
            // 线条绘制
            vertexIndex.push(calcIndex(i, j, n, offset), calcIndex(i, j, n, offset+1), 
                             calcIndex(i, j, n, offset+1), calcIndex(i, j, n, offset+2),
                             calcIndex(i, j, n, offset+1), calcIndex(i, j, n, offset+2) 
                             );
//            vn.push.apply(vn, k);
            color.push(i/n, i/n, i/n,
                       i/n, i/n, i/n,
                       i/n, i/n, i/n,
                       i/n, i/n, i/n
                       );
        }
    }
//    console.log("length: " + vertex.length + "  " + vertexIndex.length)
//    console.log(vertexIndex + " ==》 " + vertexIndex.length)

    // n 次循环，产生 n*n 个四边形，每个四边形有 6 个顶点
    return {
        // 黎曼矩形/线条 绘制球面都是 n*n*6
        "count": vertexIndex.length,
        "vertex": vertex,
        "vertexIndex": vertexIndex,
        "vertexNormal" : vertex,
        "color" : color
    };
}

/**
  * 计算索引 index 的值
  */
function calcIndex(i, j, n, offset) {
    return i*n*4 + j*4 + offset;
}

/**
 * 假设球心即为原点
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
    return [x.toFixed(8), y.toFixed(8), z.toFixed(8)];
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
