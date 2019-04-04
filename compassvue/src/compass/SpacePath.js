/**
 * Author: BriFuture
 * update: 2019/03/27
 * Description: [Compass](https://github.com/BriFuture/Compass) 是这个程序的 QML 版本，
 * 利用 webpack 的打包功能重写了核心的 JS 绘图程序。
 * 
 * License: GPLv3
 * Note: 默认 glMatrix 和 webgl-loader 已加载，并且 mat4, vec3 可以直接使用，否则程序运行会出错
 */
export const version = "0.0.01";

import {states, attributes, uniforms, attitude} from './Variables'
//var nMatrix   = mat4.create();
import Coord from './Coord'
import {Camera, Scene} from './Scene'
import {SensorPoint, SensorPath, RecordPoint} from './SensorPoint'
import {Craft} from './Craft'
import {Sphere, RefCircle} from './Sphere'
// const fs = require('fs')

import vertexCode from '!raw-loader!@/assets/SPVertexCode.vsh'
import fragCode from '!raw-loader!@/assets/SPFragCode.fsh'
// this.url = "qrc:/res/obj/craft.obj";
var canvasArgs; // 相关绘图变量

export class SpacePath {
  constructor() {
    // var gl2d;  // this is used for HUD drawing
    // return;
    this.attributes = attributes;
    this.uniforms = uniforms;
    this.states = states;
  }

  // initializeGL(canvas, args) {
  //   gl = canvas.getContext("canvas3d",
  //     { depth: true, antilias: true }
  //   );
  //   gl2d = canvas.getContext("2d");

  //   this.init();
  // }

  init(canvasGL) {
    states.gl = canvasGL;
    var scene = new Scene({});
    this.scene = scene;
    scene.initShaders(vertexCode, fragCode)
    this.camera = new Camera({height: 600, width: 800});
    scene.addCamera(this.camera)
    this.coord = new Coord({});
    scene.add(this.coord);
  }

  paintGL(canvas) {
    var pixelRatio = canvas.devicePixelRatio;
    var currentWidth = canvas.width * pixelRatio;
    var currentHeight = canvas.height * pixelRatio;

    if (currentWidth !== camera.width || currentHeight !== camera.height) {
      this.camera.setSize(currentWidth, currentHeight);
    }
    this.scene.render();
  }

  setAttitude(attitude) {
    this.sensorPoint.setParam(attitude)
  }
  hideAll() {
    this.sensorPoint.visible = false;
    this.sensorPath.visible = false;
    this.recordPoint.visible = false;
    this.refCircle.visible = false;
    this.sphere.visible = false;
  }

  reset() {
    this.sensorPoint.reset();
    this.sensorPath.resetAllPath();
    this.camera.reset();
  }

  defaultInit() {
    this.addIndicator();
    this.addSensorPath();
    this.addRefCircle();
    this.addRecordPoint();
    this.addSphere();
  }

  /**
   * 需要第一个添加
   * @param {*} props 
   */
  addIndicator(props) {
    props = props || {
      color: [1.0, 0.2, 0.1]
    };
    this.sensorPoint = new SensorPoint(props);
    this.sensorPoint.init()
    // 调整初始位置
    this.sensorPoint.setParam({ dis: 4, pitch: 0, roll: 0, heading: 0 });
    this.scene.add(this.sensorPoint, true);
  }

  addSensorPath(props) {
    if(this.sensorPath === undefined) {
      props = props || {color: [0.9, 0.5, 0.2] };
      this.sensorPath = new SensorPath(props);
      this.scene.add(this.sensorPath, true);
      this.sensorPoint.addSphericalChange(this.sensorPath);
    }
  }

  addRecordPoint(props) {
    if(this.recordPoint === undefined) {
      this.recordPoint = new RecordPoint(props);
      this.scene.add(this.recordPoint, true);
      this.sensorPoint.addSphericalChange(this.recordPoint);
      this.sensorPoint.update();
    }
  }

  addRefCircle(props) {
    if (this.refCircle === undefined) {
      this.refCircle = new RefCircle(props);
      this.scene.add(this.refCircle, true);
      this.sensorPoint.addSphericalChange(this.refCircle);
      this.sensorPoint.update();
    }
  }

  /** 开始执行实际的绘图操作，由于开启了 ALPHA BLEND 功能，先绘制球内物体 **/  
  addSphere(props) {
    if(this.sphere === undefined) {
      props = props || {
        color: [0.95, 0.2, 0.2],
        vn: 48,
        hn: 48
      };
      this.sphere = new Sphere(props);
      this.sphere.init()
      this.scene.add(this.sphere);
    } 
  }


  addCraft(props) {
    if (this.craft === undefined) {
      this.craft = new Craft(props || {});
      this.scene.add(this.craft, true);
      this.sensorPoint.addSphericalChange(this.craft);
      this.sensorPoint.update();
    }
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