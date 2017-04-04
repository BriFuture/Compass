/**
 * Modified By BriFuture
 * Origin file （or example）is on http://doc.qt.io/qt-5/qtcanvas3d-textureandlight-qml-textureandlight-textureandlight-js.html
 * I have modified this file for my studing of how to use QtCanvas3D
 * I added some annotations to make it clear that why the function should be called there, how the function works
 *
*/

Qt.include("gl-matrix.js")

var gl
var cubeTexture
var vertexPositionAttribute
var textureCoordAttribute
var vertexNormalAttribute
var mvMatrix = mat4.create()
var pMatrix  = mat4.create()
var nMatrix  = mat4.create()
var pMatrixUniform
var mvMatrixUniform
var nUniform
var width = 0
var height = 0


function initializeGL(canvas) {
    // 获得 OpenGL 的上下文对象，就能调用相应的 api
    gl = canvas.getContext("canvas3d", {depth: true, antilias: true})

    // 设置 OpenGL 状态
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LESS)
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)
    gl.clearColor(0.98, 0.98, 0.98, 1.0)
    gl.clearDepth(1.0)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)

    /*
         * QtCanvas3D function
         * viewport(int x, int y, int width, int height)
         * 设定渲染尺寸
         * x        左边界
         * y        底边界
         * width    宽度
         * height   高度
        */
    gl.viewport(0, 0, canvas.width, canvas.height)

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
        
        gl.viewport(0, 0, width, height);

        /*
         * glmatrix api
         * perspective(out, fovy, aspect, near, far) → {mat4}
         * 通过给定的边界生成透视投影矩阵
        */
        mat4.perspective(pMatrix, degToRad(45), width / height, 0.1, 500.0);

        /*
         * QtCanvas3D function
         * void uniformMatrix4fv(Canvas3DUniformLocation location3D, bool transpose, Value array)
         * 将给定的 4x4 矩阵赋给 uniform 变量
         * location3D       矩阵格式
         * transpose        若为true，将矩阵转置
         * array            给定数组
        */
        gl.uniformMatrix4fv(pMatrixUniform, false, pMatrix);
    }

    /* 清除给定的标志位 */
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* 将 mvMatrix 变为单位矩阵 */
//    mat4.identity(mvMatrix);
//    mat4.translate(mvMatrix,
//                   mvMatrix,
//                   [(canvas.xRotAnim -60.0) / 60.0 ,
//                    (canvas.yRotAnim -60.0) / 60.0 ,
//                    -10.0]
//                   );
    /*
     * mat4.fromTranslation(out, vec3) 函数等价于 mat4.identity(dest) mat4.translate(dest, dest, vec)
     * 该方法对立方体进行平移操作，设置 vec3.fromValues(x, y, z) 参数的三个属性，可以达到平移的效果
     * 由于观测点在 (0, 0, 0)，所有 vec3 的 z 属性应该为负值，才能看到立方体
    */
    mat4.fromTranslation(mvMatrix, vec3.fromValues(0,
                                                   (canvas.yRotAnim ) / 120.0 ,
                                                   -30.0)
                        );
    /*
     * 按照 canvas 的各个属性进行旋转
     * 注意：
     *   原文件是根据 xRotAnim 将立方体绕 Y 轴旋转，而根据 yRotAnim 将立方体绕 X 轴旋转
     *   我觉得很不习惯，在进行旋转测试的时候，一直搞不清楚 QtCanvas3D 的坐标系（其实和 OpenGL 的是一样的）
     *   现在把 xRotAnim 属性改成绕 X 轴旋转，yRotAnim 属性绕 Y 轴旋转
    */
//    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.xRotAnim), [0, 1, 0]);
//    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.yRotAnim), [1, 0, 0]);
//    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.zRotAnim), [0, 0, 1]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.xRotAnim), [1, 0, 0]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.yRotAnim), [0, 1, 0]);
    mat4.rotate(mvMatrix, mvMatrix, degToRad(canvas.zRotAnim), [0, 0, 1]);
    /*************************************************************************/

    // 矩阵赋值给 uniform
    gl.uniformMatrix4fv(mvMatrixUniform, false, mvMatrix);

    mat4.invert(nMatrix, mvMatrix);
    mat4.transpose(nMatrix, nMatrix);
    // 矩阵赋值给 uniform
    gl.uniformMatrix4fv(nUniform, false, nMatrix);

    /*
     * QtCanvas3D function
     * void drawElements(glEnums mode, int count, glEnums type, long offset)
     * 按照 mode 给定的模式 绘制给定数量的几何元素
     * mode         绘制模式（仅支持点、线、三角形）
     * count        绘制数量
     * type         元素类型
     * offset       指定 location3D 存储的位置
     * 
     * 立方体每个面都由2个三角形组成，每个面6个顶点，6个面就有36个顶点了 
    */
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}

function degToRad(deg) {
    return deg * Math.PI / 180
}

function initShaders() {
    // 渲染顶点
    var vertexShader = getShader(gl,
                                "attribute highp vec3 aVertexNormal;    \
                                 attribute highp vec3 aVertexPosition;  \
                                 attribute highp vec2 aTextureCoord;    \
                                                                        \
                                 uniform highp mat4 uNormalMatrix;      \
                                 uniform mat4 uMVMatrix;                \
                                 uniform mat4 uPMatrix;                 \
                                                                        \
                                 varying mediump vec4 vColor;            \
                                 varying highp vec2 vTextureCoord;       \
                                 varying highp vec3 vLighting;           \
                                                                        \
                                 void main(void) {                      \
                                     gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0); \
                                     vTextureCoord = aTextureCoord;                                   \
                                     highp vec3 ambientLight = vec3(0.5, 0.5, 0.5);                   \
                                     highp vec3 directionalLightColor = vec3(0.75, 0.75, 0.75);       \
                                     highp vec3 directionalVector = vec3(0.85, 0.8, 0.75);            \
                                     highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0); \
                                     highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0); \
                                     vLighting = ambientLight + (directionalLightColor * directional); \
                                 }",
                                 gl.VERTEX_SHADER);

    // 渲染线段
    var fragmentShader = getShader(gl,
                                   "varying highp vec2 vTextureCoord;  \
                                    varying highp vec3 vLighting;      \
                                                                       \
                                    uniform sampler2D uSampler;        \
                                                                       \
                                    void main(void) {                  \
                                        mediump vec3 texelColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t)).rgb; \
                                        gl_FragColor = vec4(texelColor * vLighting, 1.0);                                      \
                                    }",
                                   gl.FRAGMENT_SHADER);

    // 创建 Canvas3D Program
    var shaderProgram = gl.createProgram();

    // 将渲染源绑定到 shader program
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);

    // 链接器
    gl.linkProgram(shaderProgram);

    // 检查连接状态
    if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log("Could not initialise shaders");
        console.log(gl.getProgramInfoLog(shaderProgram));
    }

    // Take the shader program into use
    gl.useProgram(shaderProgram);

    // 顶点的坐标属性
    vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);
    // 纹理坐标信息
    textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(textureCoordAttribute);
    // 顶点
    vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(vertexNormalAttribute);

    // 获取统一定位符
    pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    nUniform = gl.getUniformLocation(shaderProgram, "uNormalMatrix");

    // 获取贴图资源
    var textureSamplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");

    gl.activeTexture(gl.TEXTURE0);
    /*
     * QtCanvas3D  function
     * void uniform1i(Canvas3DUniformLocation location3D, int x)
     * 将整数 x 转换成给定的 location3D 格式
    */
    gl.uniform1i(textureSamplerUniform, 0);
    /*
     * QtCanvas3D function
     * void bindTexture(glEnums target, Canvas3DTexture texture3D)
     * 将 texture3D 纹理绑定到指定的 target
     * target       实际的纹理单元目标（只能是 Context3D.TEXTURE_2D 或 Context3D.TEXTURE_CUBE_MAP）
     * texture3D    要绑定的 Canvas3DTexture 对象
    */
    gl.bindTexture(gl.TEXTURE_2D, 0);  // 取消绑定
}

/** 
 * 缩放
**/
function resizeGL(canvas) {
    var pixelRatio = canvas.devicePixelRatio;
    canvas.pixelSize = Qt.size(canvas.width * pixelRatio,
                               canvas.height * pixelRatio);
}

/**
 * 根据渲染类型返回渲染器
 * gl       gl 对象
 * str      渲染程序代码，具体渲染方式
 * type     渲染类型
*/
function getShader(gl, str, type) {
    /*
     * QtCanvas3D function
     * Canvas3DShader createShader(glEnums type)
     * 创建渲染器
    */
    var shader = gl.createShader(type);

    /*
     * QtCanvas3D function
     * void shaderSource(Canvas3DShader shader, string shaderSource)
    */
    gl.shaderSource(shader, str);
    // 编译渲染器
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log("JS:Shader compile failed");
        console.log(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

/**
 * 初始化数据
*/
function initBuffers() {
    // 立方体的顶点位置
    var cubeVertexPositionBuffer = gl.createBuffer();
    cubeVertexPositionBuffer.name = "cubeVertexPositionBuffer";

    // 绑定缓冲区，类型为 ARRAY_BUFFER
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    /*
     * 缓冲区数据，三个数据为 1 组，每组中的数据分别表示 x y z 坐标
    */
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
    /*
     * 将数组中的所有数值 + 1 
    */
    for(var i = 0; i < vertexPosition.length; i++) {
        vertexPosition[i]++;
    }

    /* 
     * void bufferData(glEnums target, value data, glEnums usage)
     * 将数组中的数据写入 ARRAY_BUFFER 中，即写入 cubeVertexPositionBuffer
     * gl.STATIC_DRAW  数据将指定一次，多次使用
    */
    gl.bufferData(gl.ARRAY_BUFFER,
                  new Float32Array(vertexPosition),
                  gl.STATIC_DRAW);
    /*
     * QtCanvas3D function
     * vertexAttribPointer(int indx, int size, glEnums type, bool normalized, int stride, long offset)
     * 将当前绑定的数组转化成 indx 指定的顶点属性
     * intdx        将当前 buffer 中的数据写入 indx(即 vertexPositionAttribute) 中
     * size         表示每个属性需要 size 个数据（即 size 个点为 1 组）
     * type         数组元素的数据类型
     * normalized   如果需要标准化整型数据，则设为 true
     * stride       表示相邻顶点的数据在数组中的间隔（0 表示连续）
     * offset       指定第一个顶点在数组中的偏移量
    */
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    /*
     * 三个数据一组，数字分别表示上述顶点的序号，比如 0 表示顶点序列中的第一个顶点
     * 因此三个点构成一个三角形，每个面用两个三角形即可绘出正方体的一个面
    */
    var cubeVertexIndexBuffer = gl.createBuffer();
    // 注意这里绑定的类型是 gl.ELEMENT_ARRAY_BUFFER
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    var vertexIndex = [
                0,  1,  2,      0,  2,  3,    // front
                4,  5,  6,      4,  6,  7,    // back
                8,  9,  10,     8,  10, 11,   // top
                12, 13, 14,     12, 14, 15,   // bottom
                16, 17, 18,     16, 18, 19,   // right
                20, 21, 22,     20, 22, 23    // left
            ];
    // 将数组中的数据写入 ARRAY_BUFFER 中，即写入 cubeVertexIndexBuffer
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                 new Uint16Array(vertexIndex),
                 gl.STATIC_DRAW);

    // 创建 buffer
    var cubeVerticesTextureCoordBuffer = gl.createBuffer();
    cubeVerticesTextureCoordBuffer.name = "cubeVerticesTextureCoordBuffer";
    // 指定 Buffer 的数据类型
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
    /*
     * 纹理坐标
    */
    var textureCoordinates = [
               // Front
               1.0,  0.0,
               0.0,  0.0,
               0.0,  1.0,
               1.0,  1.0,
               // Back
               1.0,  0.0,
               0.0,  0.0,
               0.0,  1.0,
               1.0,  1.0,
               // Top
               1.0,  0.0,
               0.0,  0.0,
               0.0,  1.0,
               1.0,  1.0,
               // Bottom
               1.0,  0.0,
               0.0,  0.0,
               0.0,  1.0,
               1.0,  1.0,
               // Right
               1.0,  0.0,
               0.0,  0.0,
               0.0,  1.0,
               1.0,  1.0,
               // Left
               1.0,  0.0,
               0.0,  0.0,
               0.0,  1.0,
               1.0,  1.0
           ];
    // 将数组中的数据写入 ARRAY_BUFFER 中，即写入 cubeVerticesTextureCoordBuffer
    gl.bufferData(gl.ARRAY_BUFFER,
                  new Float32Array(textureCoordinates),
                  gl.STATIC_DRAW);
    gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    /*
     * 顶点所在的面的法线，（顶点顺序与第一个浮点数数组中表示的顶点顺序相同）
     * example:  0, 0, 1 表示所在的平面为 z = 1
    */
    var cubeVerticesNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                                                             // Front
                                                             0.0,  0.0,  1.0,
                                                             0.0,  0.0,  1.0,
                                                             0.0,  0.0,  1.0,
                                                             0.0,  0.0,  1.0,

                                                             // Back
                                                             0.0,  0.0, -1.0,
                                                             0.0,  0.0, -1.0,
                                                             0.0,  0.0, -1.0,
                                                             0.0,  0.0, -1.0,

                                                             // Top
                                                             0.0,  1.0,  0.0,
                                                             0.0,  1.0,  0.0,
                                                             0.0,  1.0,  0.0,
                                                             0.0,  1.0,  0.0,

                                                             // Bottom
                                                             0.0, -1.0,  0.0,
                                                             0.0, -1.0,  0.0,
                                                             0.0, -1.0,  0.0,
                                                             0.0, -1.0,  0.0,

                                                             // Right
                                                             1.0,  0.0,  0.0,
                                                             1.0,  0.0,  0.0,
                                                             1.0,  0.0,  0.0,
                                                             1.0,  0.0,  0.0,

                                                             // Left
                                                             -1.0,  0.0,  0.0,
                                                             -1.0,  0.0,  0.0,
                                                             -1.0,  0.0,  0.0,
                                                             -1.0,  0.0,  0.0
                                                         ]),
                  gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
}


