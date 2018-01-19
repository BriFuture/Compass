﻿/******************************
  filename: SpacePath.js
  feature:  绘制 3D 动态图形
  author:   brifuture
  date:     2017.04.10
  Last Update :  2018.01.03, seperate each object into different reign whose ratation
        and transparation is controlled by itself.
*******************************/

Qt.include("gl-matrix.js");
Qt.include("three.js");
Qt.include("OBJLoader.js");

/**
  * UI initializing
**/
function initUI(item) {
    item.ball_radius = 4.0;
    item.cam_dis     = 18.0;
    item.cam_theta   = 70;
    item.cam_beta    = 50;
    item.path_gap    = 1;
    item.point_size  = 0.3;
    item.path_width  = 3;
    item.ball_alpha  = 0.65;
    item.enable_path = false;
    item.calibration = false;
    item.enable_sim  = false;
    selectDrawMode(surfaceRB);
}



// some problem occurred when cam_x or cam_y equals to zero
function rotateCamera(item) {
    var pos = calcVertex(degToRad(item.cam_theta), degToRad(item.cam_beta), item.cam_dis);
    item.cam_x = pos[0];
    item.cam_y = pos[1];
    item.cam_z = pos[2];
}

function mouseDraged(item, ml, container) {
    var xoffset = (ml.mouseX - ml.lpx)*2 / container.width;
    var yoffset = (ml.mouseY - ml.lpy)*2 / container.height;
    var beta = 540 + item.cam_beta - xoffset*360; // - indicates that drag direction is oppsite with movement
    item.cam_beta   = beta % 360 - 180;
    item.cam_theta -= yoffset*180;
    if( item.cam_theta.toFixed(2) === "0.00" ) {
        item.cam_theta = 0.01;
    }
    if( item.cam_theta.toFixed(2) === "180.00" ) {
        item.cam_theta = 179.99
    }
    rotateCamera(item);
}

function reset(item) {
    item.heading_offset = item.heading;
    var angle = calcAngle(item.pitch, 0);
    var u = angle[0], v = angle[1];
    resetAllPath();
}

function resetRecord() {

}

function resetAllPath() {

}

function recordPoint() {

}

/******************** end of UI init *****************************/



/******************** start of GL ********************************/
var scene;
var renderer;
var camera;
var loader;
var craftObj;
var sphere ;

// use THREE.js to initialize
function onInitializeGL(canvas, mainview) {
    camera = new THREE.PerspectiveCamera(45, 4/3, 1, 1000);
    camera.position.set(300, 300,  100);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    camera.up.set(0, 0, 1);

    scene = new THREE.Scene();
    scene.add(camera);

    var ambient = new THREE.AmbientLight( 0x1f1f1f );
    scene.add( ambient );

    var directionalLight = new THREE.DirectionalLight( 0xffeedd );
    directionalLight.position.set( 15, 15, 15 );
    scene.add( directionalLight );

    loader = new THREE.OBJLoader();
    loader.load("qrc:obj/craft.obj", function(obj) {
//        obj.traverse( function ( child ) {

//            if ( child instanceof THREE.Mesh ) {

//                child.material.side = THREE.DoubleSide;

//            }

//        } );
        craftObj = obj;
        craftObj.scale.set(0.1, 0.1, 0.1);
        // the default rotation order is "XYZ", if I change it to "YZX",
        // the rotation will be some different from previous rotation
        craftObj.rotation.order = "YZX";
//        craftObj.rotateX(Math.PI*0.5);
//        craftObj.rotateY(Math.PI*1.5);  // here local axis Y has moved to previous axis Z
        // after rotation the coordinate of obj is rotated
        //        y  ^
        //           |  / z
        //           | /
        //   x <-----|/
        // while the camera is at (15, 15, 15) look at (0, 0, 0), so Z coordinate of camera is pointed at up
        // Note, rotation value can be set directly to meet our needs, so the rotateOnWorldAxis function is
        // none of use now. But rotation
        scene.add(craftObj);
    });

    // a cube in the scene
    sphere = new THREE.Mesh(
        new THREE.SphereGeometry(4, 36, 36),
        new THREE.MeshPhongMaterial( {
                opacity: 0.65,
                transparent: true,
                color: 0xeeeeee
        } )
    );
    scene.add(sphere);

    var origin = new THREE.Vector3(0, 0, 0);
    var arrowX = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, 10, 0xff0000);
    scene.add(arrowX);
    var arrowY = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, 10, 0x00ff00);
    scene.add(arrowY);
    var arrowZ = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, 10, 0x0000ff);
    scene.add(arrowZ);

    renderer = new THREE.Canvas3DRenderer( {
                    canvas: canvas,
                    antialias: true,
                    devicePixelRatio: canvas.devicePixelRatio,

                } );
    renderer.setPixelRatio(canvas.devicePixelRatio);
    renderer.setSize(canvas.width, canvas.height);
    renderer.setClearColor(0x171717);
}


function onResizeGL(canvas) {

    if (camera === undefined) return;

    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(canvas.devicePixelRatio);
    renderer.setSize(canvas.width, canvas.height);

}


function onPaintGL(canvas, mainview) {
    camera.position.set(mainview.cam_x, mainview.cam_y, mainview.cam_z);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    var rad = calcRad(mainview.pitch, mainview.heading, mainview.roll);
    if( craftObj !== undefined ) {
        craftObj.rotation.set(rad[2], rad[0] - Math.PI * 0.5, rad[1]- Math.PI * 0.5);
    }

    renderer.render(scene, camera);
}

function degToRad(deg) {
    return deg * Math.PI /180;
}


/**
* @param {Number} pitch   range [-90, 90]
* @param {Number} heading range [-180, +180]
* @param {Number} roll    range [-180, +180]
*/
//function calcAngle(pitch, heading) {
//    var u, v;
//    if (Math.abs(pitch) <= 90) {
//        // 将俯仰角转换成绘图时的 theta 角
//        u = (90 - pitch) / 180;
//        // 绘图时的 beta 角
//        v = heading / 360;
//    } else {
//        // pitch 绝对值超过 90
//        if (pitch > 0) {
//            u = (pitch - 90) / 180;
//        } else {
//            u = (270 + pitch) / 180;
//        }
//        v = (heading + 180) % 360 / 360;
//    }
//    //    console.log("u: " + u);
//    return [u, -v];
//}

function calcRad(pitch, heading, roll) {
    var u, v, r;
    u = degToRad(pitch);
    v = degToRad(heading);
    r = degToRad(roll);
    return [-u, v, r];
}


/**
 * 假设球心即为原点，将球面坐标系转换成平面直角坐标系
 * @param   theta {Rad}     球心到顶点的连线与 Z 轴正方向的夹角为 theta
 * @param   beta  {Rad}     球心到顶点的连线在 xoy 平面上的投影与 X 轴正方向的夹角为 beta
 * @param   r     {Number}  球半径
 * @return      顶点的坐标，用三维数组表示
 */
function calcVertex(theta, beta, r) {
    var st = Math.sin(theta);
    var ct = Math.cos(theta);
    var sb = Math.sin(beta);
    var cb = Math.cos(beta);
    var x  = r * st * cb;
    var y  = r * st * sb;
    var z  = r * ct;
    return [x, y, z];
}

