Qt.include("gl-matrix.js")

/* 保存画布上下文 */
var gl;

var width = 0;
var height = 0;

var vertexPositionAttrib;
var pointPositionAttrib;
var vertexNormalAttrib;
var colorAttrib;
//var vertexIndex;
var translationUniform;

var mvMatrixUniform;    // 模型视图
var pMatrixUniform;     // 透视
var nUniform;           // 法线
var lightDirectionUniform;

var pMatrix  = mat4.create();
var mvMatrix = mat4.create();
var nMatrix  = mat4.create();

// 绘制缓冲区
var coordBuffer;
var pointBuffer;
var pathBuffer;

var coordIndexBuffer;
var lineIndexBuffer;
var lessLineIndexBuffer;
// 传感器指向
var pointIndexBuffer;
var pathIndexBuffer;

var vertexColorBuffer;
var lineColorBuffer;
// 顶点索引个数
var ball_vertex_count = [];
// 绘制球面时的精度, 至少为 4 的倍数
var accuracy = 48;
var ball_radius = 4;
var calcIndexMode;
// 传感器路径
var lastSensorPoint = [-1, -1];
var sensorPath = [];
var sensorPathIndex = [];
var enablePath = true;

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
    gl.lineWidth(5.0);

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
    // 设置观察点
    mat4.lookAt(mvMatrix, [canvas.cx, canvas.cy, canvas.cz], [0, 0, 0], [0, 0, 1]);
    mat4.translate(mvMatrix, mvMatrix, [canvas.xPos, canvas.yPos, canvas.zPos]);
    /* 进行旋转，fromRotation() 函数创造一个新的矩阵，所以之后调用该函数会覆盖掉前面的操作 */
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.xRotAnim), [1, 0, 0]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.yRotAnim), [0, 1, 0]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.zRotAnim), [0, 0, 1]);
    gl.uniformMatrix4fv(mvMatrixUniform, false, mvMatrix);

    mat4.invert(nMatrix, mvMatrix);
    mat4.transpose(nMatrix, nMatrix);

    gl.uniformMatrix4fv(nUniform, false, nMatrix);
    // 设置光照方向
    gl.uniform3fv(lightDirectionUniform, [0.55, 0.55, 0.55]);

    var heading = canvas.heading;
    var pitch = canvas.pitch;

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

function initShaders() {
    var vertCode =  'attribute vec3 aVertexPosition;' +
                    'attribute vec3 aVertexNormal;' +  // 法线
                    'attribute vec3 aColor;' +

                    'uniform highp mat4 uPMatrix;' +    // 透视矩阵
                    'uniform highp mat4 uMVMatrix;'+    // 模型视图矩阵
                    'uniform highp mat4 uNormalMatrix;' +   // 模型法线矩阵
                    'uniform vec3 uLightDirection;'+        // 直射光的方向

                    'varying vec3 vLight;'   +
                    'void main(void) {'      +
                        'gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0); '+
                        'highp vec3 ambientLight = vec3(0.42, 0.42, 0.42);' +  // 环境光
                        'highp vec3 directionalLightColor = vec3(0.81, 0.81, 0.81);' +  // 直射光
                        // 'highp vec3 directionalVector = vec3(0.75, 0.75, 0.75);' +      // 直射光的方向
                        'highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);' +
                        'highp float directional = max(dot(transformedNormal.xyz, uLightDirection), 0.0);' +
                        'vLight = aColor * (ambientLight + (directionalLightColor * directional));' +
                    '}';
    var vertShader = getShader(gl, vertCode, gl.VERTEX_SHADER);

    var fragCode =  'precision highp float;'+
                    'varying vec3 vLight;' +
                    'void main(void) {' +
                        'gl_FragColor = vec4(vLight, 0.5);' +
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

    mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    pMatrixUniform  = gl.getUniformLocation(shaderProgram, "uPMatrix");
    nUniform = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
    lightDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightDirection");
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
    var ball = getBallVertex(accuracy, ball_radius, coordIndex.length, "JW");
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
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coord), gl.STATIC_DRAW);
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
    var vertexPoint = [
                0, 0, 0, 0.0, 0.3, 0.8, 
                0, 1, 0, 0.0, 0.3, 0.8,
                0, 1, 1, 0.0, 0.3, 0.8,
                0, 0, 1, 0.0, 0.3, 0.8
                // 0,0,0,
                // 0,0,1,
                // 0,1,1,
                // 0,1,0
            ];
    pointBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPoint), gl.DYNAMIC_DRAW);
    pointIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pointIndexBuffer);
    // 绘制正反两面
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
                                                    0, 1, 2, 0, 2, 3, 
                                                    0, 2, 1, 0, 3, 2
                                                    ]), 
                    gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 6*4, 0);

    pathBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, pathBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.DYNAMIC_DRAW);
    pathIndexBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([]), gl.DYNAMIC_DRAW);
}

/**
 * 绘制传感器指向的方向，如果需要记录路径的话，从当前位置开始记录路径
 * @param {*} gl 
 * @param {*} pitch     俯仰角的角度，范围是[-90, 90]
 * @param {*} heading   航向角的角度，增大的方向为从 Z 轴正无穷远处向原点看时顺时针方向，范围是[0, 360)
 */
function drawPoint(gl, pitch, heading) {
    // 将俯仰角转换成绘图时的 theta 角
    var u = (90-pitch)/180;
    // 绘图时的 beta 角
    var v = heading / 360;
 
    var sensorPoint = getSensorPoint(u, v, 0.005, 0.0, 1, 0.6);
//     console.log(sensorPoint);
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(sensorPoint));
    gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 6*4, 0);
    gl.vertexAttribPointer(colorAttrib, 3, gl.FLOAT, false, 6*4, 3*4);          // 偏移量为 3 个数据 * sizeof(float)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pointIndexBuffer);
    // 绘制斑点
    gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 0);

    if( enablePath ) {
        sensorPoint = getSensorPoint(u, v, 0.002, 0.0, 0.0, 0.6);
        // 路径相关
        if( lastSensorPoint[0] !== u || lastSensorPoint[1] !== v) {
            lastSensorPoint[0] = u;
            lastSensorPoint[1] = v;
            // 向路径中添加新的位置
            sensorPath.push.apply(sensorPath, sensorPoint);  // 每 24 个数据意味着包含一个 SensorPoint
            var n = sensorPath.length/24-1;
            sensorPathIndex.push(n*4+0, n*4+1, n*4+2, n*4+0, n*4+2, n*4+3, n*4+0, n*4+2, n*4+1, n*4+0, n*4+3, n*4+2);
            // console.log(sensorPath)
            // console.log(sensorPathIndex)
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, pathBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sensorPath), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(vertexPositionAttrib, 3, gl.FLOAT, false, 6*4, 0);
        gl.vertexAttribPointer(colorAttrib, 3, gl.FLOAT, false, 6*4, 3*4);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pathIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sensorPathIndex), gl.DYNAMIC_DRAW);
        gl.drawElements(gl.TRIANGLES, sensorPathIndex.length, gl.UNSIGNED_SHORT, 0);
    } else {
        // 重置变量
        lastSensorPoint = [-1, -1];
        sensorPath = [];
        sensorPathIndex = [];
    }
}
/**
 * 
 * @param {double} u 
 * @param {double} v 
 * @param {*} r 
 * @param {*} g 
 * @param {*} b 
 */
function getSensorPoint(u, v, offset, r, g, b) {
       // 控制斑点大小
    var uoff = 1.5/180;
    var voffp = 1.5/360/Math.sin(Math.PI*(u+uoff));
    var voffs = 1.5/360/Math.sin(Math.PI*(u-uoff));
    var sensorPoint = [];
    if( u+uoff < 1/accuracy+0.01) {
        // 进入北极领域（上极点）
        // console.log("north poly: " + pitch);
        var pos = calcVertex(u, v, ball_radius+offset);
        var halflength = Math.PI * 1.6 / accuracy;
        sensorPoint.push(
            pos[0]-halflength, pos[1]-halflength, pos[2], r, g, b,
            pos[0]+halflength, pos[1]-halflength, pos[2], r, g, b,
            pos[0]+halflength, pos[1]+halflength, pos[2], r, g, b,
            pos[0]-halflength, pos[1]+halflength, pos[2], r, g, b
        )
    } else if( u-uoff > 1-1/accuracy-0.01 ) {
        // 进入南极领域（下极点）
        // console.log("south poly: " + pitch);
        var pos = calcVertex(u, v, ball_radius+offset);
        var halflength = Math.PI * 1.6 / accuracy;
        sensorPoint.push(
            pos[0]+halflength, pos[1]-halflength, pos[2], r, g, b,
            pos[0]+halflength, pos[1]+halflength, pos[2], r, g, b,
            pos[0]-halflength, pos[1]+halflength, pos[2], r, g, b,
            pos[0]-halflength, pos[1]-halflength, pos[2], r, g, b
        )
    } else {
        // 不在两个极点附近
        // console.log("not poly: " + pitch);
        sensorPoint = [].concat(
                    calcVertex(u-uoff, v-voffs, ball_radius+offset, 6), r, g, b,
                    calcVertex(u+uoff, v-voffp, ball_radius+offset, 6), r, g, b,
                    calcVertex(u+uoff, v+voffp, ball_radius+offset, 6), r, g, b,
                    calcVertex(u-uoff, v+voffs, ball_radius+offset, 6), r, g, b
                    );
    }
    return sensorPoint;
}

/**
 *  n   循环次数，绘制球形时的精度
 *  r   球体的半径
 * modeWJ 先绘制纬线，后绘制经线
 * modeJW 先绘制经线，后绘制纬线
 */
function getBallVertex(n, r, offset, mode) {
    calcIndexMode = mode;
    var vertex      = [];    // 顶点坐标数组
    var vertexIndex = [];       // surfaceDrawMode  绘制时所用的索引
    var vertexColor = [];

    var lineIndex       = [];         // lineDrawMode     绘制时所用的索引
    var lessLineIndex   = [];     // lessLineDrawMode 绘制时所用的索引
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
            k = [].concat(calcVertex(i/n, j/n, r),              // (0, 0)
                          calcVertex((i+1)/n, j/n, r),          // (1, 0)
                          calcVertex((i+1)/n, (j+1)/n, r),      // (1, 1)
                          calcVertex(i/n, (j+1)/n, r));         // (0, 1)      // i 为 0 或 n-1 时，(0, 1) 点与 (0, 0) 点实际都为极点
            vertex.push.apply(vertex, k);
//            console.log(k)
            /** 用线条或矩形绘制整个球面时，不用在意 mode **/
            // 黎曼矩形绘制球面
            vertexIndex.push(calcIndex(i, j, offset), calcIndex(i, j, offset+1), calcIndex(i, j, offset+2),
                              calcIndex(i, j, offset), calcIndex(i, j, offset+2), calcIndex(i, j, offset+3));
            // 线条绘制空心球体
            lineIndex.push(calcIndex(i, j, offset), calcIndex(i, j, offset+1),        // modeJW = 经线,
                             calcIndex(i, j, offset+1), calcIndex(i, j, offset+2)     // modeJW = 纬线
//                             calcIndex(i, j, offset+2), calcIndex(i, j, offset+3)
                             );

               lineColor.push(0.982, 0.086, 0.102,
                          0.982, 0.086, 0.102,
                          0.982, 0.086, 0.102,
                          0.982, 0.086, 0.102
                          );
//            }

            if( i === n/2-1 ) {
                 lessLineIndex.push(calcIndex(i, j, offset+1), calcIndex(i, j, offset+2));
            }
        }

        // 线条简单绘制
        // 绘制经线
    //  for(var m = 0; m < 12; m++) {
    //      lessLineIndex.push(calcIndex(i, m/12*n, offset), calcIndex(i, m/12*n, offset+1));
    //  }
        // 绘出三条经线
        lessLineIndex.push(calcIndex(j, 0, offset), calcIndex(j, 0, offset+1));
        lessLineIndex.push(calcIndex(j, 3/4*n, offset), calcIndex(j, 3/4*n, offset+1));
        lessLineIndex.push(calcIndex(j, 1/4*n, offset), calcIndex(j, 1/4*n, offset+1));
    }

    // 赤道所在平面
    for(j = 0; j < n; j++) {
        lessLineIndex.push(0, calcIndex(n/2 - 1, j, offset+1), calcIndex(n/2 - 1, j, offset+2));
        lessLineIndex.push(0, calcIndex(n/2 - 1, j, offset+2), calcIndex(n/2 - 1, j, offset+1));
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
function calcIndex(i, j, offset) {
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
        return [x.toFixed(precesion), y.toFixed(precesion), z.toFixed(precesion)];
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
