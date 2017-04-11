Qt.include("gl-matrix.js")

/* 保存画布上下文 */
var gl;

var width = 0;
var height = 0;

var vertexPostionAttrib;
var colorAttrib;
var textureAttrib;
var vertexIndex;


var mvMatrixUniform;    // 模型视图
var pMatrixUniform;     // 透视
var nUniform;           // 法线
var cMatrixUniform;
var uniforms = {};
//var textureUniform;

var pMatrix  = mat4.create();
var mvMatrix = mat4.create();
var nMatrix  = mat4.create();

var xTexture;
var yTexture;
var vertex_buffer;

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

    initShaders();
    initBuffers();

    loadTextureImage("qrc:/img/compass.png", 0, gl.TEXTURE0);
    loadTextureImage("qrc:/img/test.png", 1, gl.TEXTURE1);
//    var image = TextureImageFactory.newTexImage();
//    image.src = "qrc:/img/compass.png";
//    image.imageLoaded.connect(function() {
//        console.log("image loaded")
//        // 成功加载图片
//        xTexture = gl.createTexture();
//        // 绑定 2D 纹理
//        gl.activeTexture(gl.TEXTURE0);
//        gl.bindTexture(gl.TEXTURE_2D, xTexture);
//        gl.uniform1i(uniforms.texture, 0)

//        // 将图片绘制到 2D 纹理上
//        gl.texImage2D(gl.TEXTURE_2D,   // target
//                       0,               // level
//                       gl.RGBA,         // internalformat
//                       gl.RGBA,         // format
//                       gl.UNSIGNED_BYTE,// type
//                       image );     //

//        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
//        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

//        // 生成 2D 纹理
//        gl.generateMipmap(gl.TEXTURE_2D);
//    });
//    var image1 = TextureImageFactory.newTexImage();
//    image1.src = "qrc:/img/test.png";
//    image1.imageLoaded.connect(function() {
//        console.log("y image loaded")
//        // 成功加载图片
//        yTexture = gl.createTexture();
//        // 绑定 2D 纹理
//        gl.activeTexture(gl.TEXTURE1);
//        gl.bindTexture(gl.TEXTURE_2D, yTexture);
//        gl.uniform1i(uniforms.sampler, 0);

//        // 将图片绘制到 2D 纹理上
//        gl.texImage2D(gl.TEXTURE_2D,   // target
//                       0,               // level
//                       gl.RGBA,         // internalformat
//                       gl.RGBA,         // format
//                       gl.UNSIGNED_BYTE,// type
//                       image1 );     //

//        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
//        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

//        // 生成 2D 纹理
//        gl.generateMipmap(gl.TEXTURE_2D);
//    });
    
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
//    mat4.lookAt(mvMatrix, [0, 0, 0], [0, 0, 0], [0, 1, 0]);
//    mat4.translate(mvMatrix, mvMatrix, [canvas.xPos, canvas.yPos, canvas.zPos - 10]);
    /* 进行旋转，fromRotation() 函数创造一个新的矩阵，所以之后调用该函数会覆盖掉前面的操作 */
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.xRotAnim), [1, 0, 0]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.yRotAnim), [0, 1, 0]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.zRotAnim), [0, 0, 1]);
    gl.uniformMatrix4fv(mvMatrixUniform, false, mvMatrix);

    var cMatrix  = mat4.create();
    mat4.lookAt(cMatrix, [canvas.cx, canvas.cy, canvas.cz], [0, 0, 0], [0, 0, 1]);
    gl.uniformMatrix4fv(cMatrixUniform, false, cMatrix);
//    gl.drawArrays(gl.POINTS, 0, 6);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.vertexAttribPointer(vertexPostionAttrib, 3, gl.FLOAT, false, 0, 0);
//    gl.drawElements(gl.LINES, 3, gl.UNSIGNED_SHORT, 0);
//    gl.drawElements(gl.TRIANGLES, vertexIndex.length, gl.UNSIGNED_SHORT, 0);
    if( xTexture )
        gl.bindTexture(gl.TEXTURE_2D, xTexture);
    gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 0);
    if( yTexture )
        gl.bindTexture(gl.TEXTURE_2D, yTexture);
    gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 12*2);
    if( xTexture )
        gl.bindTexture(gl.TEXTURE_2D, xTexture);
    gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 24*2);
}

function initShaders() {
    var vertCode =  'attribute vec3 aVertexPosition;' +
                    'attribute vec3 aVertexNormal;' +  // 法线
                    'attribute highp vec2 aTextureCoord;' +
                    'attribute vec3 aColor;' +
                    'uniform highp mat4 uPMatrix;' +
                    'uniform highp mat4 uMVMatrix;'+
                    'uniform highp mat4 uCMatrix;' +
                    'uniform highp mat4 uNormalMatrix;' +

                    'varying vec3 vColor;'   +
                    'varying vec2 vTextureCoord;' +
                    'void main(void) {'      +
                        'gl_Position = uPMatrix * uMVMatrix * uCMatrix * vec4(aVertexPosition, 1.0);' +
                        'vColor = vec3(0.6, 0.6, 0.6);' +
                        'highp vec4 transformNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);' +
                        'vTextureCoord = aTextureCoord;'+
                    '}';
    var vertShader = getShader(gl, vertCode, gl.VERTEX_SHADER);

    var fragCode =  'precision mediump float;'+
                    'uniform sampler2D texture;' +
                    'uniform sampler2D uSampler1;' +
                    'uniform int t;' +
                    'varying vec3 vColor;' +
                    'varying vec2 vTextureCoord;' +
                    'void main(void) {' +
                        'vec3 sampler = texture2D(texture, vTextureCoord).rgb;' +
                        'vec3 sampler1 = texture2D(uSampler1, vTextureCoord).rgb;' +
                        'if( t == 0) {sampler = vec3(1.0, 1.0, 1.0);sampler1 = vec3(1.0, 1.0, 1.0);}' +
                        'gl_FragColor = vec4(vColor * sampler1 * sampler, 0.8) ;' +
                    '}';
    var fragShader = getShader(gl, fragCode, gl.FRAGMENT_SHADER);

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    vertexPostionAttrib = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPostionAttrib);

    colorAttrib = gl.getAttribLocation(shaderProgram, "aColor");
    gl.enableVertexAttribArray(colorAttrib);
    console.log("after colorAttrib")
    textureAttrib = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(textureAttrib);
    console.log("after use attrib")
    mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    pMatrixUniform  = gl.getUniformLocation(shaderProgram, "uPMatrix");
    cMatrixUniform  = gl.getUniformLocation(shaderProgram, "uCMatrix");


    uniforms.texture  = gl.getUniformLocation(shaderProgram, "texture");
//    gl.uniform1i(textureUniform, 0);
    uniforms.sampler = gl.getUniformLocation(shaderProgram, "uSampler1");
//    gl.uniform1i(sampler1Uniform, 1);
    var tUniform = gl.getUniformLocation(shaderProgram, "t");
    gl.uniform1i(tUniform, 1);

}

/**
 * 初始化缓冲数据
 */
function initBuffers() {
    var vertexPosition = [   // Front face
                              1.0, -1.0, 1.0,
                              1.0, -1.0, -1.0,
                              1.0,  1.0, -1.0,
                              1.0,  1.0, 1.0,

                              // Back face
                              -1.0, 1.0, 1.0,
                              -1.0, 1.0, -1.0,
                              -1.0, -1.0, -1.0,
                              -1.0, -1.0, 1.0,

                              // left face
                              -1.0, -1.0, 1.0,
                              -1.0, -1.0, -1.0,
                              1.0,  -1.0, -1.0,
                              1.0,  -1.0, 1.0,

                              // right face
                              1.0, 1.0, 1.0,
                              1.0, 1.0, -1.0,
                              -1.0, 1.0, -1.0,
                              -1.0, 1.0, 1.0,

                              // up face
                              -1.0, -1.0, 1.0,
                              1.0, -1.0, 1.0,
                              1.0,  1.0, 1.0,
                              -1.0,  1.0, 1.0,

                              // down face
                              1.0, -1.0, -1.0,
                              -1.0, -1.0, -1.0,
                              -1.0, 1.0,  -1.0,
                              1.0, 1.0,  -1.0
                             ];

//    for(var i = 0; i < vertexPosition.length; i++) {
//        vertexPosition[i]/=2;
//    }

    vertexIndex = [
//                    0,  1,  2,      0,  2,  3,    // front
//                    4,  5,  6,      4,  6,  7,    // back
//                    8,  9,  10,     8,  10, 11,   // top
//                    12, 13, 14,     12, 14, 15,   // bottom
//                    16, 17, 18,     16, 18, 19,   // right
//                    20, 21, 22,     20, 22, 23    // left
                ];
    var i;
    for(i = 0; i < 6; i++) {
        vertexIndex.push(i*4, i*4+1, i*4+2, i*4, i*4+2, i*4+3);
    }

    var colors = [
                0.1, 0.1, 1,
                0.1, 0.1, 1,
                0.1, 0.1, 1,
                0.1, 0.1, 1,
                //
                0.1, 0.5, 0.1,
                0.1, 0.5, 0.1,
                0.1, 0.5, 0.1,
                0.1, 0.5, 0.1,
                //
                0.1, 0.1, 0.1,
                1, 0.1, 0.1,
                0.1, 0.1, 0.1,
                1, 0.1, 1,
                //
                0.1, 0.1, 1,
                1, 0.1, 0.1,
                0.1, 1, 0.1,
                1, 0.1, 1,
                //
                1, 1, 1,
                1, 1, 1,
                1, 1, 1,
                1, 1, 1,
                //
                0.1, 0.1, 1,
                1, 0.1, 0.1,
                0.1, 1, 0.1,
                1, 0.1, 1
            ];



    vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPosition), gl.STATIC_DRAW);
    // var vertex_buffer = createArrayBuffer(new Float32Array(vertices));

    var Index_Buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index_Buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndex), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vertexPostionAttrib, 3, gl.FLOAT, false, 0, 0);


//    console.log("indices: " + indices.length);
    var color_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    gl.vertexAttribPointer(colorAttrib, 3, gl.FLOAT, false, 0, 0);

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
    var textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoord), gl.STATIC_DRAW);

    gl.vertexAttribPointer(textureAttrib, 2, gl.FLOAT, false, 0, 0);

}


function loadTextureImage(imgsrc, index, textureUnit) {
    var image = TextureImageFactory.newTexImage();
    image.src = imgsrc;
    image.imageLoaded.connect(function() {
        // 成功加载图片
        var texture = gl.createTexture();
        // 绑定 2D 纹理
        gl.activeTexture(textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        if( index === 0) {
            xTexture = texture;
            gl.uniform1i(uniforms.texture, 0);
        } else {
            yTexture = texture;
            gl.uniform1i(uniforms.sampler, 1);
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
    });
    image.imageLoadingFailed.connect(function() {
        console.log("Texture load failed, " + image.src)
    });
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
