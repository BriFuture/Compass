/******************************
  filename: SpacePath.js
  feature:  dynamic 3d animation
  author:   BriFuture
  date:     2017.04.10
  Last Update :  2018.01.20
  Desc: seperate each object into different reigon whose ratation
        and transparation is controlled by itself.
        By the use of gl-matrix and webgl-obj-loader, now the
        program can draw many more complex things than before
*******************************/

.pragma library
.import "gl-matrix-min.js" as MatrixHelper
.import "webgl-obj-loader.min.js" as ObjLoader

var mat4 = MatrixHelper.mat4;
var vec3 = MatrixHelper.vec3;
//Qt.include("gl-matrix-min.js");
//Qt.include("webgl-obj-loader.min.js");

if( String.prototype.startsWith === undefined ) {
    String.prototype.startsWith = function(pattern) {
        return this.slice(0, pattern.length) === pattern;
    }
}

/* 保存画布上下文 */
var gl;
var gl2d;  // this is used for HUD drawing


var attributes = {};  // attribute variables from shader
var uniforms = {};    // uniform variables from shader

// matrixs
var pvMatrix  = mat4.create();
var mvpMatrix = mat4.create();
//var nMatrix   = mat4.create();

var canvasArgs; // 相关绘图变量
var scene;
var camera;
var coordinate;
var craft;
var sensorPoint;
var sensorPath;
var refCircle;
var recordPoint;
var sphere;

function reset() {
    sensorPoint.reset();
    sensorPath.resetAllPath();
    camera.reset();
}

/**
* this function is copied from planets demo of qt version of threejs
* I modified some of it, now it works fine for me
**/
function readFile(url, onLoad, onProgress, onError) {
    var request = new XMLHttpRequest();

    request.onreadystatechange = function() {
        if (request.readyState === XMLHttpRequest.DONE) {
        // TODO: Re-visit https://bugreports.qt.io/browse/QTBUG-45581 is solved in Qt
            if (request.status == 200 || request.status == 0) {
//                var response;
// TODO: Remove once https://bugreports.qt.io/browse/QTBUG-45862 is fixed in Qt
//                response = request.responseText;

                console.time('Process file: "' + url + '"');
                onLoad( request.responseText );
                console.timeEnd('Process file: "' + url + '"');

            }
//              else if ( onError !== undefined ) {
//                onError();
//            }
        }
//        else if (request.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
//            if ( onProgress !== undefined ) {
//                onProgress();
//            }
//        }
    };

    request.open( 'GET', url, true );
    request.send( null );
}

function addRefCircle( props ) {
    if( refCircle === undefined ) {
        refCircle = new RefCircle( props );
        sensorPoint.addParamCallback( function( params ) {
            refCircle.onSphericalChanged( params );
        });
        sensorPoint.update();
        scene.add( refCircle, true );
    }
}

function addCraft( props ) {
    if( craft === undefined ) {
        craft = new Craft( props );
        sensorPoint.addParamCallback( function( params ) {
            craft.setRotation( params );
        });
        sensorPoint.update();
        scene.add( craft, true );
    }
}

var ready = false;
function initializeGL(canvas, args) {
    gl  = canvas.getContext("canvas3d",
                           { depth: true, antilias: true }
                           );
    gl2d = canvas.getContext("2d");

    scene       = new Scene();
    camera      = new Camera();
    coordinate  = new Coord();
    sensorPoint = new SensorPoint( { color: [1.0, 0.0, 0.0], size: 0.4 } );
    sensorPath  = new SensorPath();
    sensorPoint.addParamCallback( function( params ) {
        sensorPath.onSphericalChanged( params );
    });

    recordPoint = new RecordPoint();

    sensorPoint.addParamCallback( function( params ) {
        recordPoint.onSphericalChanged(params);
    });
    sphere      = new Ball({    color: [0.3, 0.3, 0.3],
                                vn: 48,
                                hn: 48
                            });

    sensorPoint.setParam( { dis: 4, pitch: 0, roll: 0, heading: 0 } );

    ready = true;
    /** 开始执行实际的绘图操作，由于开启了 ALPHA BLEND 功能，先绘制球内物体 **/
    scene.add( coordinate );
    scene.add( sensorPoint);
    scene.add( sensorPath );
    scene.add( recordPoint );
    scene.add( sphere );
    scene.add( camera );

}


function paintGL(canvas) {
    var pixelRatio = canvas.devicePixelRatio;
    var currentWidth = canvas.width * pixelRatio;
    var currentHeight = canvas.height * pixelRatio;

    if (currentWidth !== camera.width || currentHeight !== camera.height) {
        camera.setSize( currentWidth, currentHeight );
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);   // clear color buffer and depth buffer bit
    scene.render();
}

function resizeGL(canvas) {
    var pixelRatio = canvas.devicePixelRatio;
    canvas.pixelSize = Qt.size(canvas.width * pixelRatio, canvas.height * pixelRatio);
}


/**
 * @param {*} type  ELEMENT or ARRAY
 * @param {*} data  数组或 long 型整数
 * @param {*} drawtype  STATIC or DYNAMIC
 */
function createArrayBuffer(data, drawtype, type) {
    var buffer = gl.createBuffer();

    if( type === undefined ) {
        type = gl.ELEMENT_ARRAY_BUFFER;

        if( data instanceof Float32Array ) {
            type = gl.ARRAY_BUFFER;
        }
    }

    gl.bindBuffer( type, buffer );
    gl.bufferData( type, data, drawtype );
    gl.bindBuffer( type, null );
    return buffer;
}

function subBuffer(buffer, offset, data) {
    var type = gl.ELEMENT_ARRAY_BUFFER;
    if( data instanceof Float32Array ) {
        type = gl.ARRAY_BUFFER;
    }

    gl.bindBuffer( type, buffer );
    gl.bufferSubData( type, offset, data );
}


// some problem occurred when x or y equals to zero
// because you can't set up [0, 0, 1] and look at [0, 0, 0] the origin point.
function Camera() {
    this.type = "Camera";
    this.width = 800;
    this.height = 600;
    this.pos = [1, 1, 1];
    this.up  = [0, 0, 1];
    this.lookat = [0, 0, 0];
    this.pMatrix = mat4.create();
    this.vMatrix = mat4.create();
}

Camera.prototype = {
    constructor: Camera,

    paint : function() {
        mat4.lookAt( this.vMatrix, this.pos, this.lookat, this.up );
        mat4.multiply( pvMatrix, this.pMatrix, this.vMatrix );
    },

    rotate : function(a_theta, a_phi, r) {
        if( a_theta < 0.01 ) {
            a_theta = 0.01;
        } else if( a_theta > 179.99 ) {
            a_theta = 179.99
        }
        this.dis = r;

        this.pos = coordCarte( degToRad( a_theta ), degToRad( a_phi ), r );
    },

    setSize : function(width, height) {
        this.width  = width;
        this.height = height;
        gl.viewport( 0, 0, width, height );
        mat4.perspective( this.pMatrix, 45 / 180 * Math.PI, width / height, 0.5, 500.0 );
    },

    reset : function(  ) {
        this.rotate( 45, 180, this.dis );
    }
}

function Scene() {
    gl.enable(gl.DEPTH_TEST);  // depth test
    gl.depthFunc(gl.LESS);
    gl.enable(gl.CULL_FACE); // 设置遮挡剔除有效
    gl.cullFace(gl.BACK);
    gl.clearColor(0.97, 0.97, 0.97, 1.0);  // background color
    gl.clearDepth(1.0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.enable(gl.BLEND);   // enable blend for alpha
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.type = "Scene";
    this.objs = [];
    this.light_direct = [0.35, 0.35, 0.7];
    this.initShaders();
}

Scene.prototype = {
    constructor : Scene,

    add : function(obj, first) {
        if( obj === undefined ) {
            console.log("[Warn] Undefined on Scene adding.");
            return;
        }

        if( obj.type === "Camera" ) {
            this.objs.unshift( obj );
        }
        if( first ) {
            var c = this.objs.shift();
            this.objs.unshift( obj );
            this.objs.unshift( c );
        } else  {
            this.objs.push( obj );
        }
    },

    render : function() {
        gl.uniform3fv( uniforms.light_direction, this.light_direct );  // where light origins

        this.objs.forEach( function(obj) {
            obj.paint();
        });
    },

    /*
     * 根据渲染类型返回渲染器
     * @param  gl       gl 对象
     * @param  codestr  渲染程序代码，具体渲染方式
     * @param  type     渲染类型
     * @return  渲染器
     */
    getShader : function(gl, codestr, type) {
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
    },

    initShaders : function() {
        var shaderProgram = gl.createProgram();
        var vertexShader;
        var that = this;
        var ready = false;

        readFile( "qrc:/qml/SPVertexCode.vsh", function(vertexCode) {
            vertexShader = that.getShader(gl, vertexCode, gl.VERTEX_SHADER);
            gl.attachShader(shaderProgram, vertexShader);
            ready = ( fragShader !== undefined );
            if( ready ) {
                onShaderReady(shaderProgram);
            }
        } );

        var fragShader;

        readFile( "qrc:/qml/SPFragCode.fsh", function(fragCode) {
            fragShader = that.getShader(gl, fragCode, gl.FRAGMENT_SHADER);
            gl.attachShader(shaderProgram, fragShader);
            ready = ( vertexShader !== undefined );
            if( ready ) {
                that.onShaderReady( shaderProgram );
            }
        } );

    },

    onShaderReady : function(shaderProgram) {
        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);

        attributes.vertex_position = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(attributes.vertex_position);

        attributes.vertex_normal = gl.getAttribLocation(shaderProgram, "aVertexNormal");
        gl.enableVertexAttribArray(attributes.vertex_normal)

        attributes.color = gl.getAttribLocation(shaderProgram, "aColor");
        gl.enableVertexAttribArray(attributes.color);

        attributes.texture = gl.getAttribLocation( shaderProgram, "aTexture" );
        attributes.color   = gl.getAttribLocation(shaderProgram, "aColor");

        uniforms.pmv_matrix = gl.getUniformLocation(shaderProgram, "uPMVMatrix"); // 透视模型视图矩阵
        uniforms.m_matrix   = gl.getUniformLocation(shaderProgram, "uMMatrix")
        uniforms.n_matrix   = gl.getUniformLocation(shaderProgram, "uNMatrix"); // 法线
        uniforms.alpha      = gl.getUniformLocation(shaderProgram, "uAlpha");
        uniforms.frag_color = gl.getUniformLocation(shaderProgram, "uFragColor");
        uniforms.has_texture     = gl.getUniformLocation( shaderProgram, "uHasTexture" );
        uniforms.light_direction = gl.getUniformLocation(shaderProgram, "uLightDirection"); // 光照

        gl.uniformMatrix4fv( uniforms.n_matrix, false, mat4.create() );
    }

}



function degToRad(deg) {
    return deg * Math.PI /180;
}



/**
 * 假设球心即为原点，将球极坐标系转换成平面直角坐标系
 * @param   theta {Rad}     球心到顶点的连线与 Z 轴正方向的夹角为 theta
 * @param   phi  {Rad}     球心到顶点的连线在 xoy 平面上的投影与 X 轴正方向的夹角为 phi
 * @param   r     {Number}  球半径
 * @return      顶点的坐标，用三维数组表示
 */
function coordCarte(theta, phi, r) {
    var st = Math.sin( theta );
    var ct = Math.cos( theta );
    var sp = Math.sin( phi );
    var cp = Math.cos( phi );
    var x  = r * st * cp;
    var y  = r * st * sp;
    var z  = r * ct;
    return vec3.fromValues(x, y, z);
}


/**
*  @param {Array} vertex  the vertices to rotate around the origin point
*  @param {Number}   theta is in terms of RAD
*  @param {Number}   beta  is in terms of RAD
**/
function rotateVertex(vertex, theta, beta, dis) {
    var v = vec3.create();
    var d = ( dis === undefined ) ? 0 : dis;
    for(var i = 0; i < vertex.length; i+=3) {
        v = vec3.fromValues(vertex[i+0], vertex[i+1], d );
        vec3.rotateY(v, v, [0, 0, 0], theta);
        vec3.rotateZ(v, v, [0, 0, 0], beta);
        vertex[i+0] = v[0];
        vertex[i+1] = v[1];
        vertex[i+2] = v[2];
    }
//    return vertex;
}

/**
 * calculate circle on the plane xoy with given sides and distance between each vertex and origin point
 * Note that the origin point is the first element of the array and
 * the direction of the circle is anti-clock viewed from Z+ to Z-
 */
function circleShape(radius, segment, thetaStart, thetaEnd) {
    var vertex = [];
    var x = 0.0;
    var y = 0.0;
    var dtheta = (thetaEnd - thetaStart) / segment;
    vertex = vertex.concat( [x, y, 0.0] );
    for( var i = 0; i < segment; i++ ) {
        x = Math.cos( i * dtheta + thetaStart ) * radius;
        y = Math.sin( i * dtheta + thetaStart ) * radius;
        vertex = vertex.concat( [x, y, 0.0] );
    }
    return vertex;
}

// 用更紧凑的方式得到顶点信息的数组
function genVertices( vertex, color, normal ) {
    var vertices = [];
    var i;
    if( normal !== undefined ) {
        for( i = 0; i < vertex.length; i += 3 ) {
            vertices = vertices.concat( vertex[i], vertex[i+1], vertex[i+2] );
            vertices = vertices.concat( normal[i], normal[i+1], normal[i+2] );
            vertices = vertices.concat( color[i],  color[i+1],  color[i+2] );
        }
    } else {
        for( i = 0; i < vertex.length; i += 3 ) {
            vertices = vertices.concat( vertex[i], vertex[i+1], vertex[i+2] );
            vertices = vertices.concat( color[i],  color[i+1],  color[i+2] );
        }
    }

    return vertices;
}


var epsilon = 0.01;

function PaintObj(props) {
    if( props === undefined ) {
        props = {};
    }

    this.sides = props.sides || 24;
    this.alpha = props.alpha || 1.0;
    this.color = props.color || [0.8, 0.8, 0.8];
    this.size  = props.size  || 1.0;

    this.buffers = {};
    this.mMatrix = mat4.create();
    this.quat    = quat.create();
    this.vscale  = vec3.fromValues(1.0, 1.0, 1.0);   // vec3.create equals to fromValues(0.0, 0.0, 0.0)
    this.translation = vec3.create();
    this.visible = true;

//    this.x = 0;
//    this.y = 0;
//    this.z = 0;
//    this.rotateX = 0;
//    this.rotateY = 0;
//    this.rotateZ = 0;
}


// **************** SensorPoint Object **************** //
function SensorPoint(props) {
    PaintObj.call(this, props);

    this.type = "SensorPoint";
    // the reason why rotation and then translation is out of expections
    // but if rMatrix is introduced, the result seems good
    // now all vertices are calculated by function, no need for rMatrix
    // this.rMatrix  = mat4.create();
    this.inv_color  = [0.0, 1.0, 0.0];
    this.dis   = 4;
    this.pitch = 0;
    this.heading = 0;
    this.headingOffset = 0;
    this.roll    = 0;
    this.callbacks = [];

    this.init();
}

SensorPoint.prototype = {
    constructor: SensorPoint,

    init : function() {
        var vertex = []
        vertex.push.apply( vertex, circleShape( this.size, this.sides, 0, Math.PI * 2 ) );
        vertex.push.apply( vertex, circleShape( this.size, this.sides, 0, Math.PI * 2 ) );

        var i = 0;
        var color   = [];
        for(i = 0; i <= this.sides; i++) {
            color = color.concat(this.color);
        }
        for(i = 0; i <= this.sides; i++) {
            color = color.concat(this.inv_color);
        }

        var vertices = genVertices( vertex, color );

        var index = [];       // sensor point need both sides
        // the positive plane
        index.push(0);
        for (i = 1; i <= this.sides; i++) {
            index.push(i);
        }
        index.push(1);
        // negitive plane
        index.push(2*this.sides + 1);
        for (i = this.sides*2; i >= this.sides+1; i--) {
            index.push(i);
        }
        index.push(this.sides * 2);

        this.index_count = index.length;

        this.buffers.vertex = createArrayBuffer( new Float32Array( vertices ), gl.STATIC_DRAW );
        this.buffers.index  = createArrayBuffer( new Uint16Array( index ),     gl.STATIC_DRAW );

    },

    paint : function() {
        gl.bindBuffer( gl.ARRAY_BUFFER, this.buffers.vertex );
        gl.vertexAttribPointer( attributes.vertex_position, 3, gl.FLOAT, false, 6*4, 0   );
        gl.vertexAttribPointer( attributes.vertex_normal,   3, gl.FLOAT, false, 6*4, 0   );
        gl.vertexAttribPointer( attributes.color,           3, gl.FLOAT, false, 6*4, 3*4 );

        gl.uniform1f( uniforms.alpha, this.alpha );          //  set alpha value

        mat4.fromRotationTranslationScale(this.mMatrix,
                                          this.quat,
                                          this.translation,
                                          this.vscale);

        mat4.mul(mvpMatrix, pvMatrix, this.mMatrix);
        gl.uniformMatrix4fv(uniforms.pmv_matrix, false, mvpMatrix);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.index);
        gl.drawElements(gl.TRIANGLE_FAN, this.index_count * 0.5, gl.UNSIGNED_SHORT, 0);
        gl.drawElements(gl.TRIANGLE_FAN, this.index_count * 0.5, gl.UNSIGNED_SHORT, this.index_count * 0.5 * 2);
    },

    setScale : function(size) {
        this.size = size;
        vec3.set(this.vscale, size, size, size);
    },

    setTranslation : function(r, a_theta, a_phi) {
        this.translation = coordCarte( degToRad( a_theta ), degToRad( a_phi ), r );
        quat.fromEuler( this.quat, 0, a_theta, a_phi );
    },

    setParam : function( params ) {
//        setParam : function(r, pitch, heading, roll) {
        this.dis     = params.dis;
        this.pitch   = params.pitch;
        params.heading = params.heading - this.headingOffset;
        this.heading = params.heading;
        this.roll    = params.roll;
        var theta = 90 - this.pitch;
        this.setTranslation( this.dis, theta, this.heading );
        this.update();
    },

    update : function() {
        var spherical = this.spherical();
        for( var i = 0; i < this.callbacks.length; i++ ) {
            this.callbacks[i]( { dis: this.dis, pitch: this.pitch, heading: this.heading,
                                  roll: this.roll, theta: spherical[0], phi: spherical[1],
                                  size: this.size
                              } );
        }
    },

    addParamCallback : function( cb ) {
        this.callbacks.push( cb );
    },

    /**
    * @param {Number} pitch   range [-90, 90]
    * @param {Number} heading range [0, 360]
    * @returns {Vec3} the angle returned is in unit of rad  vec[0] and vec[1] is in unit of RAD
    */
    spherical : function() {
        var u = (90-this.pitch)/180 * Math.PI;
        var v = this.heading   /180 * Math.PI;
        return vec3.fromValues(u, v, this.dis);
    },

    reset : function() {
        this.headingOffset = this.heading;
        this.setParam( { pitch: this.pitch, heading: this.heading, roll: this.roll, dis: this.dis } );
    }
}  // end of SensorPoint prototype

// ****************  SensorPath Object  **************** //
function SensorPath() {
    PaintObj.call(this, {
        color: [0.9, 0.5, 0.2],
    } );

    this.type            = "SensorPath";
    this.all_index_count = 0;
    this.cur_path_count  = 0;
    this.cur_index_count = 0;
    this.cur_pi          = 0;  // path index
    this.max_path_num    = 4800 * 12;
    this.buffer_path_bytes  = this.max_path_num * 4;  // 4 means the bytes float occupies, 3 means a point contains 3 coordinate
    this.buffer_index_bytes = this.max_path_num * 2;  // 2 means the bytes uint  occupies
    this.gap        = 1;       // must equal or greater then 1
    this.pg         = 1;       // path gap count
    this.width      = 1.0;

    this.init();
}

SensorPath.prototype = {
    constructor: SensorPath,

    init : function() {
        this.angle      = this.last_point;
        this.path       = [];
        this.index      = [];

        // path buffer initialization
        this.buffers.path  = [];
        this.buffers.index = [];

        this.createBuffer();
    },

    paint : function() {
        if( !this.visible ) {
            return;
        }
        gl.uniform1f(uniforms.alpha, this.alpha);     // set alpha value
    //    mat4.identity(this.mMatrix);
//        mat4.mul(mvpMatrix, pvMatrix, this.mMatrix);
        gl.uniformMatrix4fv(uniforms.pmv_matrix, false, pvMatrix);

        // 分批绘制路径
        for(var i = 0; i < this.cur_pi; i++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.path[i]);
            gl.vertexAttribPointer( attributes.vertex_normal,   3, gl.FLOAT, false, 6*4, 0   );
            gl.vertexAttribPointer( attributes.vertex_position, 3, gl.FLOAT, false, 6*4, 0   );
            gl.vertexAttribPointer( attributes.color,           3, gl.FLOAT, false, 6*4, 3*4 );
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.index[i]);
            gl.drawElements(gl.TRIANGLES, this.max_path_num, gl.UNSIGNED_SHORT, 0);
        }
        if( this.cur_index_count > 0 ) {
//            console.log( this.cur_index_count );
            gl.bindBuffer( gl.ARRAY_BUFFER, this.buffers.path[this.cur_pi] );
            gl.vertexAttribPointer( attributes.vertex_normal,   3, gl.FLOAT, false, 6*4, 0   );
            gl.vertexAttribPointer( attributes.vertex_position, 3, gl.FLOAT, false, 6*4, 0   );
            gl.vertexAttribPointer( attributes.color,           3, gl.FLOAT, false, 6*4, 3*4 );
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.index[this.cur_pi]);
            gl.drawElements(gl.TRIANGLES, this.cur_index_count, gl.UNSIGNED_SHORT, 0);
        }
    },

    /**
      * @param nangle next sphericalCoord
      * @param langle last sphericalCoord
      */
    updateBuffer : function(nangle) {
        var langle = [ this.last_point.theta, this.last_point.phi, this.last_point.dis ];
        var presult = this.getLinearPoint( nangle, langle );
        this.all_index_count += presult.index.length;

        subBuffer( this.buffers.path[this.cur_pi],  this.cur_path_count  * 4, new Float32Array( presult.vertices ) );
        subBuffer( this.buffers.index[this.cur_pi], this.cur_index_count * 2, new Uint16Array(presult.index) );

        // Note! because the updateSubBuffer() should use the offset as the parameter,
        // the addition of path or index count should be later, or the buffer will be out of its size
        this.cur_path_count  += presult.vertices.length;
        this.cur_index_count += presult.index.length;

        // when path index count is greater or equal to this.max_path_num, then a new buffer should be realloced
        // and the counter should be reset
        if( this.cur_index_count >= this.max_path_num) {
            this.cur_pi++;
            console.log("Info: [Path] create a new buffer!\n");
            this.createBuffer();
            this.resetCurrentPath();
        }
    },

    setGap : function( gap ) {
        this.gap = gap;
    },

    setSize : function( size ) {
        this.size = size;
    },

    /**
     * 用于绘制路径所需的顶点和索引, 每次返回 4 个顶点
     * @param {Array} p     p[0] = theta    p[1] = beta    p[2] = radius
     * @param {Array} lp   lp[0] = theta   lp[1] = beta   lp[2] = lradius
     * @return {Object}
     */
    getLinearPoint : function(p, lp) {
        var s1 = coordCarte( p[0],  p[1],  p[2]);
        var s2 = coordCarte( lp[0], lp[1], lp[2]);
        var s  = [ s1[0]-s2[0], s1[1]-s2[1], s1[2]-s2[2] ];
    //    console.log("s1: "+ s1 + "  s2: "+s2 + "  s: " + s +"\n");
        var n0  = coordCarte( (p[0]+lp[0])*0.5, (p[1]+lp[1])*0.5, p[2] );
        var l = vec3.create();
        vec3.cross( l, s, n0 );
        vec3.normalize( l, l );
        vec3.scale( l, l, this.size * 0.02 );
    //    console.log("vec l: " + vec3.str(l));

        var vertex;
        var vertices = [];
        var that = this;

        var pushVertex = function() {
            vertices = vertices.concat( vertex );
            vertices = vertices.concat( that.color );
        }

        vertex = [s1[0]-l[0], s1[1]-l[1], s1[2]-l[2]];   // 0
        pushVertex();
        vertex = [s1[0]+l[0], s1[1]+l[1], s1[2]+l[2]];   // 1
        pushVertex();
        vertex = [s2[0]-l[0], s2[1]-l[1], s2[2]-l[2]];   // 2
        pushVertex();
        vertex = [s2[0]+l[0], s2[1]+l[1], s2[2]+l[2]];   // 3
        pushVertex();
        // until now, vertices length should be 24

        var index  = [];
        var seg = 6;
        var n = this.cur_path_count / seg;  // it is better than index.length
        index.push( n + 0, n + 2, n + 3, n + 0, n + 3, n + 1 );
        index.push( n + 0, n + 3, n + 2, n + 0, n + 1, n + 3 );

        return {
//            "point" : linearPoint,
//            "color" : color,
            "vertices": vertices,
            "index" : index,
        }
    },

    onSphericalChanged : function(params) {
        if( this.last_point === undefined ) {
            this.last_point = params;
//            return;
        }

        var lpos  = coordCarte( this.last_point.theta, this.last_point.phi, this.last_point.dis );
        var  pos  = coordCarte( params.theta, params.phi, params.dis );
        var dist  = vec3.dist( lpos, pos );
        var angle = [ params.theta, params.phi, params.dis ];

        if( dist > Math.PI * params.dis * 0.002 ) {
            this.updateBuffer( angle );
            this.angle      = angle;
            this.last_point = params;
        }

        // angle[2] is vector length
//        if( dist > Math.PI * params.dis * 0.03 ) {
//            this.updateBuffer( angle );
//            this.angle      = angle;
//            this.last_point = params;
//        } else if( dist > Math.PI * params.dis * 0.001 ) {
//            this.pg ++;
//            this.last_point = params;

//            if( this.pg === this.gap ) {
//                this.angle = angle;
//            }
//            if( this.pg === this.gap+1 ) {
//                this.pg = 1;
//                this.updateBuffer( angle );
//                this.angle = angle;
//            }
//        }
    },

    // 重置路径变量
    resetCurrentPath : function(vec) {
        this.cur_path_count  = 0;
        this.cur_index_count = 0;
        this.pg              = 0;
    },

    resetAllPath : function(args) {
        // 删掉无用的buffer，节省内存
        for (var i = 1; i <= this.cur_pi; i++) {
            gl.deleteBuffer(this.buffers.path[i] );
            gl.deleteBuffer(this.buffers.index[i]);
        }
        this.all_index_count = 0;
        this.cur_pi = 0;
//        this.createBuffer();
//        this.last_point = sensorPoint.spherical();
        this.resetCurrentPath();
    },

    createBuffer : function() {
        this.buffers.path[this.cur_pi]    = createArrayBuffer( this.buffer_path_bytes,  gl.DYNAMIC_DRAW, gl.ARRAY_BUFFER );
        this.buffers.index[this.cur_pi]   = createArrayBuffer( this.buffer_index_bytes, gl.DYNAMIC_DRAW, gl.ELEMENT_ARRAY_BUFFER );
    }
}  // end of SensorPath prototype

// **************** Ball Object **************** //
function Ball(props) {
    PaintObj.call(this, props);

    this.type       = "Ball";
    this.vn         = props.vn || 48;
    this.hn         = (props.hn || 48) * 0.5;
    this.ratio      = 0.25;
    this.size       = 4;    // default radius
    this.line_alpha = 0.55;
    this.drawMode = Ball.MODE_SURFACE;
    this.alpha = 0.5;
    this.init();
}

Ball.MODE_SURFACE  = 0;
Ball.MODE_LINE     = 1;
Ball.MODE_LESSLINE = 2;

Ball.prototype = {
    constructor: Ball,
    init : function() {
        var res = this.getVertex();
        this.getIndex();

        // vertex info，static_draw is enough for both vertex and index now
        this.buffers.vertex          = createArrayBuffer( new Float32Array( res.vertices ),  gl.STATIC_DRAW );
        this.buffers.vertex_index    = createArrayBuffer( new Uint16Array( this.vertex_index ),    gl.STATIC_DRAW );
        this.buffers.line_index      = createArrayBuffer( new Uint16Array( this.line_index ),      gl.STATIC_DRAW );
        this.buffers.less_line_index = createArrayBuffer( new Uint16Array( this.less_line_index ), gl.STATIC_DRAW );
        this.buffers.less_ls_index   = createArrayBuffer( new Uint16Array( this.less_ls_index ),   gl.STATIC_DRAW );
        // no need for normal vertex buffer anymore
        // this.vertex_normal_buffer   = createArrayBuffer(gl.ARRAY_BUFFER,         new Float32Array(this.vertex),    gl.STATIC_DRAW);
    },


    paint : function( ) {
        gl.bindBuffer( gl.ARRAY_BUFFER, this.buffers.vertex );
        gl.vertexAttribPointer( attributes.vertex_position, 3, gl.FLOAT, false, 6 * 4, 0 );
        gl.vertexAttribPointer( attributes.vertex_normal,   3, gl.FLOAT, false, 6 * 4, 0 );
        gl.vertexAttribPointer( attributes.color,           3, gl.FLOAT, false, 6 * 4, 3 * 4 );

        mat4.multiply(mvpMatrix, pvMatrix, this.mMatrix);
        gl.uniformMatrix4fv(uniforms.pmv_matrix, false, mvpMatrix);
        switch ( this.drawMode) {
            case Ball.MODE_LINE:
                gl.uniform1f(uniforms.alpha, this.line_alpha);          //  set alpha value
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.line_index);
                gl.drawElements(gl.LINES, this.line_index.length, gl.UNSIGNED_SHORT, 0);
                break;
            case Ball.MODE_LESSLINE:
                gl.uniform1f(uniforms.alpha, this.line_alpha);          //  set alpha value
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.less_line_index);
                gl.drawElements(gl.LINES, this.less_line_index.length, gl.UNSIGNED_SHORT, 0);
                // the surface on which equator lies
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.less_ls_index);
                gl.drawElements(gl.TRIANGLE_FAN, this.less_ls_index.length, gl.UNSIGNED_SHORT,  0);  // multiply 2 times means that UNSIGNED_SHORT occupies 2 bytes
                break;
            case Ball.MODE_SURFACE:
            default:
                gl.uniform1f(uniforms.alpha, this.alpha);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.vertex_index);
                gl.drawElements(gl.TRIANGLES, this.vertex_index.length, gl.UNSIGNED_SHORT, 0);
                break;
        }
    },

    setSize : function(size) {
        this.size   = size * this.ratio ;
        vec3.set(this.vscale, this.size, this.size, this.size);
        mat4.fromScaling(this.mMatrix, this.vscale);
    },

    setDrawMode : function( mode ) {
        this.drawMode = mode;
    },

    setAlpha : function( alpha ) {
        this.alpha = alpha;
    },

    /**
     * 计算得到球面的所有顶点的位置
     * 先绘制经线，后绘制纬线
     * @returns 返回所有类型的顶点个数
     */
    getVertex : function() {
//        var vertex = [];
//        var color  = [];
        var vertices = [];
        //    var vn = [];        // 顶点法向量数组，当球心在原点时，与顶点坐标相同
        var i, j, k;

        var that = this;
        var pushData = function(p) {
//            vertex.push.apply(vertex, p);
//            color.push.apply(color, that.color);
            vertices.push.apply( vertices, p );
            vertices.push.apply( vertices, that.color );
        }

        // i indicates vertical line while j indicates horizontal line,
        // vertical line is half a circle, so the number should be 1 more
        for (j = 0; j <= this.vn; j++) {
            for (i = 0; i <= this.hn; i++) {
                // (n+1)*n points are needed
                k = coordCarte(degToRad(i*180/this.hn), degToRad(j*360/this.vn), this.size);
                pushData( [k[0], k[1], k[2]] );
            }
        }
        // add origin point into array
        pushData( [0, 0, 0] );

        return {
//            "vertex": vertex,
//            "color" : color,
            "vertices": vertices
        }
    },

    // 获取绘制球面时需要的顶点索引
    getIndex : function() {
        var vertexIndex   = []; // surfaceDrawMode  绘制时所用的索引
        var lineIndex     = []; // lineDrawMode     绘制时所用的索引
        var lessLineIndex = []; // lessLineDrawMode 绘制时所用的索引
        var lessLSIndex   = [];
        var i = 0, j = 0;

        for (j = 0; j < this.vn; j++) {  // the last half circle (j = 0) overlaps the first one (j = 0)
            for (i = 0; i < this.hn+1; i++) {
                // for line mode index
                lineIndex.push(
                    this.calcIndex(i, j),
                    this.calcIndex(i+1, j),
                    this.calcIndex(i, j),
                    this.calcIndex(i, j+1)
                );

                // for surface mode index
                vertexIndex.push(
                    this.calcIndex(i, j),       // 0
                    this.calcIndex(i+1, j),     // 1
                    this.calcIndex(i+1, j+1)    // n+1
                );
                vertexIndex.push(
                    this.calcIndex(i, j),       // 0
                    this.calcIndex(i+1, j+1),   // n+1
                    this.calcIndex(i, j+1)      // n
                );
            }
        }
        for (i = 0; i < this.hn+1; i++) {
            // 绘出 4 条经线
            lessLineIndex.push( this.calcIndex(i, 0),      this.calcIndex(i+1, 0)      );
            lessLineIndex.push( this.calcIndex(i, 0.25*this.vn), this.calcIndex(i+1, 0.25*this.vn) );
            lessLineIndex.push( this.calcIndex(i, 0.5 *this.vn), this.calcIndex(i+1, 0.5 *this.vn) );
            lessLineIndex.push( this.calcIndex(i, 0.75*this.vn), this.calcIndex(i+1, 0.75*this.vn) );
        }
        for (j = 0; j < this.vn; j++) {
            i = this.hn / 2 ;
            lessLineIndex.push(this.calcIndex(i, j), this.calcIndex(i, j+1)); // equator line
        }
        // 赤道所在平面
        for (j = this.vn*0.5; j < this.vn*0.75+1; j++) {
            // 原点 -- 赤道上的点 -- 赤道上的点
            lessLSIndex.push(this.calcIndex(this.hn*0.5, j));
        }
        lessLSIndex.push((this.vn+1)*(this.hn+1));   // origin point

        this.vertex_index = vertexIndex;
        this.line_index   = lineIndex;
        this.less_line_index = lessLineIndex;
        this.less_ls_index   = lessLSIndex;
    },

    /**
     * 方便计算球体索引 index 的值
     * @param  i       半圆中第 i 部分
     * @param  j       第 j 个半圆
     */
    calcIndex : function(i, j) {
        return i + j * (this.hn+1);
    }
}  // end of Ball prototype


// ****************  Coord Object **************** //
function Coord() {
    PaintObj.call(this, {});

    this.type         = "Coord";
    this.coord_length = 10.0;
    this.init();
}

Coord.prototype = {
    constructor: Coord,

    init : function() {
        var vertices = [ // x coord
            0.0, 0.0, 0.0,
            0.9, 0.1, 0,
            this.coord_length, 0.0, 0.0,
            0.9, 0.1, 0,
            // y coord
            0.0, 0.0, 0.0,
            0, 0.9, 0,
            0.0, this.coord_length, 0.0,
            0, 0.9, 0,
            // z coord
            0.0, 0.0, 0.0,
            0, 0, 0.9,
            0.0, 0.0, this.coord_length,
            0, 0, 0.9
        ];
        var index = [0, 1, 2, 3, 4, 5];

        // 顶点信息，索引只需要用static draw
        this.buffers.vertex = createArrayBuffer( new Float32Array( vertices ), gl.STATIC_DRAW );
        this.buffers.index  = createArrayBuffer( new Uint16Array( index ),     gl.STATIC_DRAW);
    },

    paint : function() {
        mat4.multiply(mvpMatrix, pvMatrix, this.mMatrix);
        gl.uniformMatrix4fv(uniforms.pmv_matrix, false, mvpMatrix);

        gl.uniform1f(uniforms.alpha, this.alpha);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.vertex);
        gl.vertexAttribPointer( attributes.vertex_position, 3, gl.FLOAT, false, 6 * 4, 0 );
        gl.vertexAttribPointer( attributes.vertex_normal,   3, gl.FLOAT, false, 6 * 4, 0 );
        gl.vertexAttribPointer( attributes.color,           3, gl.FLOAT, false, 6 * 4, 3 * 4 );
        // 绘制坐标轴
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.index);
        gl.drawElements(gl.LINES, 6, gl.UNSIGNED_SHORT, 0);
    }
}  // end of Coord prototype


// **************** ReferenceCircle Object (球面上的参考圆圈) **************** //
function RefCircle( props ) {
    PaintObj.call( this, props );
    this.dis = props.dis || 4;
    this.visible = false;
    var circles = [];
    var red   = [1.0, 0.0, 0.0];
    var green = [0.0, 1.0, 0.0];
    var blue  = [0.0, 0.0, 1.0];
    var i, j, k;

    k = 0;
    circles[k] = new ReferCircle( { "pos": [0, 0, this.dis], color: green } );
    k++;
    for( i = 0; i <= 2; i ++ ) {
        for(j = 0; j < 8; j++) {
            if( i === 1 && j%2 === 0 ) {
                circles[k] = new ReferCircle( {"pos": [(i+1)*45, j*45, this.dis], color: green } );
            } else {
                circles[k] = new ReferCircle( {"pos": [(i+1)*45, j*45, this.dis], color: blue } );
            }
            k++;
        }
    }
    circles[k] = new ReferCircle( {"pos": [4*45, 0, this.dis], color: green } );
//    circles[20].isCurrent = true;
    this.circles = circles;
    this.setScale( props.size || 1);
}

RefCircle.prototype = {
    constructor: RefCircle,

    paint : function() {
        if( !this.visible ) {
            return;
        }

        for( var i = 0; i < 26; i++ ) {
            this.circles[i].paint();
        }
    },

    setDis : function(dis) {
        this.dis = dis;
        for( var i = 0; i < 26; i++) {
            this.circles[i].setTranslation( this.dis + 0.1 );
        }
    },

    setScale : function( size ) {
        this.size = size;
        for( var i = 0; i < 26; i++) {
            this.circles[i].setScale( this.size );
        }
    },

    onSphericalChanged : function( params ) {
        for( var i = 0; i < 26; i++ ) {
//            this.circles[i].current = false;
            this.circles[i].isCurrent( params );
        }
    }

}

function ReferCircle( props ) {
    PaintObj.call( this, props );
    this.type = "RCircle";

    if( props.pos !== undefined ) {
        this.setTranslation( props.pos[2], degToRad( props.pos[0] ), degToRad( props.pos[1] ) );
        this.setQuat( props.pos[0], props.pos[1] );
    }
    this.current = false;

    this.init();
}

ReferCircle.prototype = {
    constructor: ReferCircle,

    init : function() {
        var vertex = circleShape( this.size, this.sides, 0, Math.PI * 2 );
        var vertices = [];
        var i;
        for( i = 0; i < vertex.length; i += 3 ) {
            vertices.push( vertex[i], vertex[i+1], vertex[i+2] );
            vertices.push.apply( vertices, [0.75, 0.75, 0.75] );
            vertices.push.apply( vertices, this.color );
        }
        var index = [];
        for(i = 1; i < this.sides+1; i++) {
            index.push(i);
        }
        this.vertexBuffer = createArrayBuffer( new Float32Array( vertices ), gl.STATIC_DRAW );
        this.indexBuffer  = createArrayBuffer( new Uint16Array( index ),   gl.STATIC_DRAW );
    },

    paint : function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(attributes.vertex_position, 3, gl.FLOAT, false, 9 * 4, 0 );
        gl.vertexAttribPointer(attributes.vertex_normal,   3, gl.FLOAT, false, 9 * 4, 3 * 4 );
        gl.vertexAttribPointer(attributes.color,           3, gl.FLOAT, false, 9 * 4, 6 * 4 );
        gl.uniform1f(uniforms.alpha, this.alpha);

        mat4.fromRotationTranslationScale(this.mMatrix, this.quat, this.translation, this.vscale);
        mat4.mul(mvpMatrix, pvMatrix, this.mMatrix);
        gl.uniformMatrix4fv(uniforms.pmv_matrix, false, mvpMatrix);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        if( this.current ) {
            var w = gl.getParameter( gl.LINE_WIDTH );
            gl.lineWidth( 3 );
            gl.drawElements( gl.LINE_LOOP, this.sides, gl.UNSIGNED_SHORT, 0 );
            gl.lineWidth( 1 );
        } else {
            gl.drawElements( gl.LINES, this.sides, gl.UNSIGNED_SHORT, 0 );
        }
    },

    setTranslation : function(r, theta, phi) {
        if( theta !== undefined ) {
            this.theta = theta;
        }

        if( phi !== undefined ) {
            this.phi = phi;
        }

        this.translation = coordCarte(  this.theta, this.phi, r );
    },

    setQuat : function( a_theta, a_phi, a_beta ) {
        quat.fromEuler( this.quat, 0, a_theta, a_phi );
    },

    setScale : function( size ) {
        this.size = size;
        this.vscale  = vec3.fromValues(size, size, size);
    },

    isCurrent : function( spherical ) {
        this.current = false;
        if( Math.abs( spherical.theta - this.theta ) < Math.PI * 0.02
            && Math.abs( spherical.phi - this.phi ) < Math.PI * 0.02   ) {
            this.current = true;
        }
    }
}

function RecordPoint() {
    PaintObj.call(this, {});

    this.type        = "RecordPoint";
    this.max_vertex   = this.sides * 100;
    this.vertex_count = 0;
    this.index_count  = 0;
    this.init();
}

RecordPoint.prototype = {
    constructor: RecordPoint,

    init : function() {
        this.buffers.vertex = createArrayBuffer( this.max_vertex * 4, gl.DYNAMIC_DRAW, gl.ARRAY_BUFFER );
        this.buffers.index  = createArrayBuffer( this.max_vertex * 2, gl.DYNAMIC_DRAW, gl.ELEMENT_ARRAY_BUFFER );
    },

    paint : function() {
        // 进行采点操作
        if( this.vertex_count === 0 || !this.visible ) {
            return;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER,         this.buffers.vertex);
        gl.vertexAttribPointer( attributes.vertex_normal,   3, gl.FLOAT, false, 6*4, 0   );
        gl.vertexAttribPointer( attributes.vertex_position, 3, gl.FLOAT, false, 6*4, 0   );
        gl.vertexAttribPointer( attributes.color,           3, gl.FLOAT, false, 6*4, 3*4 );
//        gl.bindBuffer(gl.ARRAY_BUFFER,         this.buffers.color);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.index);
//        gl.uniform4fv(uniforms.color_unit, [0.1, 0.1, 0.95, 1.1]); // 传入颜色 uniform，就不再需要颜色顶点数据
        gl.uniform1f(uniforms.alpha, this.alpha);
        gl.uniformMatrix4fv(uniforms.pmv_matrix, false, pvMatrix);
        gl.drawElements(gl.TRIANGLES, this.index_count, gl.UNSIGNED_SHORT, 0);
    },

    setSize : function( size ) {
        this.size = size;
        vec3.fromValues( this.vscale, size, size, size );
    },

    record : function() {
        if( !this.visible ) {
            return;
        }

        console.log("[Info]: record a point.");

        var i = 0, j =0;
        var point = [];
        var index = [];
        var color = [];

        for(i = 0; i <= this.sides; i++) {
            color = color.concat([0, 0.5, 0.5]);
        }
        point = circleShape( this.size, this.sides, 0, Math.PI * 2 );
        rotateVertex( point, this.theta, this.phi, this.dis );

        var vertices = genVertices( point, color );

        var n = this.vertex_count / 6;
        for(i = 1; i < this.sides; i++) {
            index.push( n, n+i,   n+i+1,
                        n, n+i+1, n+i
                       );
        }
        index.push( n, n+this.sides, n+1,
                    n, n+1,          n+this.sides
                   );
        subBuffer( this.buffers.vertex, this.vertex_count * 4, new Float32Array( vertices ) );
        subBuffer( this.buffers.index,  this.index_count  * 2, new Uint16Array( index ) );

        this.vertex_count += vertices.length;
        this.index_count += index.length;
    },

    onSphericalChanged: function(params) {
        this.theta = params.theta;
        this.phi   = params.phi;
        this.dis   = params.dis *  1.01;
        this.size  = params.size * 0.98;
    },

    // 重置已经打的点
    reset : function() {
        this.vertex_count = 0;
        this.index_count = 0;
    }

}  // end of RecordPoint prototype


function Craft(props) {
    PaintObj.call( this );

    this.type    = "Craft";
    this.url     = "qrc:/obj/craft.obj";
    var scale = props.size || 1;
    this.setScale( scale );
    this.init();
}

Craft.prototype = {
    constructor: Craft,

    init : function() {
        var that = this;
        readFile( this.url, function(text) {
            that.mesh = new ObjLoader.OBJ.Mesh(text);
            ObjLoader.OBJ.initMeshBuffers(gl, that.mesh);
        } );
    },

    paint : function( ) {

        if( this.mesh === undefined || !this.visible ) {
            return;
        }

        gl.uniform1f(  uniforms.alpha, this.alpha );
        gl.uniform3fv( uniforms.frag_color, [0.8, 0.3, 0.6] );
        gl.uniform1i(  uniforms.has_texture, true );

        gl.bindBuffer( gl.ARRAY_BUFFER, this.mesh.vertexBuffer );
        gl.vertexAttribPointer(attributes.vertex_position, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

//        if(!this.mesh.textures.length){
//            gl.disableVertexAttribArray(attributes.textureCoordAttribute);
//        }
//        else{
//            // if the texture vertexAttribArray has been previously
//            // disabled, then it needs to be re-enabled
//            gl.enableVertexAttribArray( attributes.texture );
//            gl.bindBuffer( gl.ARRAY_BUFFER, this.mesh.textureBuffer );
//            gl.vertexAttribPointer( attributes.texture, this.mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
//        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
        gl.vertexAttribPointer(attributes.vertex_normal, this.mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

//        mat4.fromScaling(this.mMatrix, this.vscale);
//        mat4.rotateY(this.mMatrix, this.mMatrix, degToRad(90-addon.pitch) );
//        mat4.rotateZ(this.mMatrix, this.mMatrix, degToRad(addon.heading)  );
//        quat.fromEuler(this.quat, addon.pitch+90, addon.roll, addon.heading-90);
//        mat4.fromRotationTranslationScale(this.mMatrix,
//                                          this.quat,
//                                          this.translation,
//                                          this.vscale);

        mat4.mul(mvpMatrix, pvMatrix, this.mMatrix);
        gl.uniformMatrix4fv(uniforms.pmv_matrix, false, mvpMatrix);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

        gl.uniform1i( uniforms.has_texture, false );
    },

    setRotation : function(params) {
        this.pitch   = params.pitch;
        this.heading = params.heading;
        this.roll    = params.roll;
//        quat4.fromEuler( this.quat, params.heading, params.pitch, params.roll );
        mat4.fromScaling( this.mMatrix, this.vscale );
        // if craft's look at [1, 0, 0] and its up is [0, 0, 1]
        // following rotation will be fine, now it needs to some calibrations
        // what's more, the coordinate will rotate with the angle
//        mat4.rotateZ( this.mMatrix, this.mMatrix, degToRad( params.heading ) );
//        mat4.rotateY( this.mMatrix, this.mMatrix, degToRad( params.pitch ) );
//        mat4.rotateX( this.mMatrix, this.mMatrix, degToRad( params.roll ) );

        mat4.rotateX( this.mMatrix, this.mMatrix, degToRad( 90 ) );
//        mat4.rotateY( this.mMatrix, this.mMatrix, degToRad( 270 ) );
        mat4.rotateY( this.mMatrix, this.mMatrix, degToRad( params.heading + 270 ) );
        mat4.rotateX( this.mMatrix, this.mMatrix, degToRad( params.pitch ) );
        mat4.rotateZ( this.mMatrix, this.mMatrix, degToRad( params.roll ) );
    },

    setScale : function( size ) {
        this.size = size;
        vec3.set(this.vscale, size, size, size);
        sensorPoint.update();
//        this.setRotation( {} );
    }
}

