/**
 * Author: BriFuture
 * update: 2019/03/27
 * Description: [Compass](https://github.com/BriFuture/Compass) 是这个程序的 QML 版本，
 * 利用 webpack 的打包功能重写了核心的 JS 绘图程序。
 * 
 * License: GPLv3
 * Note: 默认 glMatrix 已加载，并且 mat4, vec3 可以直接使用，否则程序运行会出错
 */
/* 保存画布上下文 */
export const version = "0.0.01";

import {states} from './Variables'
var gl2d;  // this is used for HUD drawing
//var nMatrix   = mat4.create();
import Coord from './Coord'
import { Camera, Scene } from './Scene'
import { SensorPoint, SensorPath, RecordPoint } from './SensorPoint'
import { Craft } from './Craft'
import {Sphere, RefCircle} from './Sphere'
// const fs = require('fs')

import vertexCode from '!raw-loader!../assets/SPVertexCode.vsh'
import fragCode from '!raw-loader!../assets/SPFragCode.fsh'
var canvasArgs; // 相关绘图变量
var gl;

export class SpacePath {
  constructor(canvas) {
    gl  = canvas.getContext("webgl",
      { depth: true, antilias: true }
    );
    states.gl = gl;
    // console.log(vertexCode)
    var scene = new Scene({gl});
    this.scene = scene;
    scene.initShaders(vertexCode, fragCode)
    this.camera = new Camera({height: 600, width: 800});
    scene.addCamera(this.camera)
    
    this.coord = new Coord({gl});
    scene.add(this.coord);

    var sensorPoint = new SensorPoint({gl, color: [1.0, 0.2, 0.1]});
    // sensorPoint.setParam({dis: 3, pitch: 0, heading: 0});
    this.sensorPoint = sensorPoint;
    scene.add(sensorPoint);
    var sensorPath = new SensorPath({gl});
    this.sensorPath = sensorPath;
    scene.add(this.sensorPath);
    this.sphere = new Sphere({gl});
    scene.add(this.sphere);
    var recordPoint = new RecordPoint({gl});
    this.recordPoint = recordPoint;
    
    scene.add(this.recordPoint);
    var refCircle = new RefCircle({gl});
    this.refCircle = refCircle;
    scene.add(this.refCircle);
    sensorPoint.addParamCallback(function( params ) {
      sensorPath.onSphericalChanged( params );
      recordPoint.onSphericalChanged(params);
      refCircle.onSphericalChanged( params );
      // craft.setRotation( params );
    });
    // this.craft = craft;
    scene.render()
    // return;
  }

  reset() {
    sensorPoint.reset();
    sensorPath.resetAllPath();
    camera.reset();
  }

  addRefCircle(props) {
    if (refCircle === undefined) {
      refCircle = new RefCircle(props);
      sensorPoint.addParamCallback(function (params) {
        refCircle.onSphericalChanged(params);
      });
      sensorPoint.update();
      scene.add(refCircle, true);
    }
  }

  addCraft(props) {
    if (craft === undefined) {
      craft = new Craft(props);
      sensorPoint.addParamCallback(function (params) {
        craft.setRotation(params);
      });
      sensorPoint.update();
      scene.add(craft, true);
    }
  }

  initializeGL(canvas, args) {
    gl = canvas.getContext("canvas3d",
      { depth: true, antilias: true }
    );
    gl2d = canvas.getContext("2d");

    scene = new Scene();
    camera = new Camera();
    coordinate = new Coord();
    sensorPoint = new SensorPoint({ color: [0.9, 0.2, 0.15] });
    sensorPoint.setScale(0.1);
    sensorPath = new SensorPath({ color: [0.9, 0.5, 0.2], size: 0.3 });
    sensorPoint.addParamCallback(function (params) {
      sensorPath.onSphericalChanged(params);
    });

    recordPoint = new RecordPoint();

    sensorPoint.addParamCallback(function (params) {
      recordPoint.onSphericalChanged(params);
    });
    sphere = new Ball({
      color: [0.95, 0.2, 0.2],
      vn: 48,
      hn: 48
    });

    sensorPoint.setParam({ dis: 4, pitch: 0, roll: 0, heading: 0 });

    /** 开始执行实际的绘图操作，由于开启了 ALPHA BLEND 功能，先绘制球内物体 **/
    scene.add(coordinate);
    scene.add(sensorPoint);
    scene.add(sensorPath);
    scene.add(recordPoint);
    scene.add(sphere);
    scene.add(camera);
  }

  paintGL(canvas) {
    var pixelRatio = canvas.devicePixelRatio;
    var currentWidth = canvas.width * pixelRatio;
    var currentHeight = canvas.height * pixelRatio;

    if (currentWidth !== camera.width || currentHeight !== camera.height) {
      camera.setSize(currentWidth, currentHeight);
    }
    scene.render();
  }

  resizeGL(canvas) {
    var pixelRatio = canvas.devicePixelRatio;
    canvas.pixelSize = Qt.size(canvas.width * pixelRatio, canvas.height * pixelRatio);
  }
}


/** Test: to watch variables change **/
class Test {
  constructor() {
    this._x = 0;
    this._y = 0;
    this._z = 0;
  }
}

/**
* this function is copied from planets demo of qt version of threejs
* I modified some of it, now it works fine for me
**/
function readFile(url, onLoad, onProgress, onError) {
  var request = new XMLHttpRequest();

  request.onreadystatechange = function () {
    if (request.readyState === XMLHttpRequest.DONE) {
      // TODO: Re-visit https://bugreports.qt.io/browse/QTBUG-45581 is solved in Qt
      if (request.status == 200 || request.status == 0) {
        //                var response;
        // TODO: Remove once https://bugreports.qt.io/browse/QTBUG-45862 is fixed in Qt
        //                response = request.responseText;

        console.time('Process file: "' + url + '"');
        onLoad(request.responseText);
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

  request.open('GET', url, true);
  request.send(null);
}
window.SpacePath = SpacePath;
export default { SpacePath }