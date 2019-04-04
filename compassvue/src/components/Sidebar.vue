<template>
<div>
  <b-checkbox v-model="scene.running" @change="setSceneRun($event)">实时更新 3D 图像</b-checkbox>
  <craft-setting :craft="craft" @initCraft="initCraft()" ></craft-setting>
  <b-card header="其他参数设置"> 
    <div class="option">
      <b-checkbox v-model="sensorPath.visible">绘制路径</b-checkbox>
      <b-btn @click="resetPath()">重置路径</b-btn>
      <div>轨迹宽度 {{pathWidth}}
        <b-form-input type="range" id="pathWidth" :value="pathWidth" min="1" max="100" 
          @change="setPathWidth($event)" />
      </div>
      <b-checkbox v-model="refCircle.visible">显示修正圆圈</b-checkbox>
    </div>
    <div class="action">
      <b-btn @click="recordPoint()" class="mx-4">打点</b-btn>
      <b-btn @click="resetRecordedPoint()" class="mx-4">重置打点</b-btn>
    </div>

    <div>指示器大小: {{indicatorSize.toFixed(1)}}
      <b-form-input type="range" id="indicatorSize" :value="indicatorSize" min="1" max="100" 
        @change="setIndicatorSize($event)" />
    </div>
    <div class="">修正圆圈大小
      <b-form-input type="range" id="refCircleSize" :value="refCircle.size" min="0.1" max="1" step="0.01" 
        @change="setRefCircleSize($event)" />
    </div>
  </b-card>
  <camera-setting :camera="camera" />
  <sphere-setting :sphere="sphere" />
</div>
</template>

<script>

import {spacepath} from '@/states'
import { setTimeout } from 'timers';
import CameraSetting from './CameraSetting'
import SphereSetting from './SphereSetting'
import CraftSetting from './CraftSetting'
const craftObj = import('!raw-loader!@/assets/craft.obj')
export default {
  components: {
    CameraSetting,
    SphereSetting,
    CraftSetting
  },
  data() {
    return {
      scene: { 
        running: true
      },
      camera: {
        theta: 0,
        phi: 0,
        dis: 4
      },
      sphere: {
        size: 4,
        alpha: 1,
        drawMode: 0,
      },
      indicator: {
        size: 1
      },
      sensorPath: {
        visible: true,
        size: 1
      },
      refCircle: {
        visible: true,
        size: 1
      },
      craft: { 
        visible: false,
        size: 1,
        headingOffset: 0,
        pitchOffset: 0,
        rollOffset: 0,
      }
    }
  },
  computed: {

    indicatorSize() {
      return this.indicator.size * 100;
    },
    pathWidth() {
      return this.sensorPath.size;
    }
  },
  methods: {
    setSceneRun(value) {
      if(value) {
        this.scene.render()
      }
    },
    recordPoint() {
      this.spacepath.recordPoint.record();
      this.$socket.emit('action', {record: true});
    },
    resetRecordedPoint() {
      this.spacepath.recordPoint.reset();
      this.$socket.emit('action', {resetRecord: true});
    },
    setIndicatorSize(value) {
      this.indicator.setScale(parseFloat(value) / 100);
    },
    setPathWidth(value) {
      this.sensorPath.setSize(value);
    },
    setRefCircleSize(value) {
      this.refCircle.setScale(parseFloat(value));
    },
    setCraftSize(value) {
      if(this.craft.visible) {
        this.craft.setScale(value);
      }
    },
    initCraft() {
      // this.spacepath.addCraft({obj: craftObj});
      this.spacepath.addCraft({});
      this.craft = this.spacepath.craft;
      this.craft.init(craftObj)
      this.craft.headingOffset = 270
      this.craft.pitchOffset = 90
      this.craft.setRotation({})
    },
    resetPath() {
      this.sensorPath.resetAllPath();
    },
    init(spacepath) {
      this.spacepath = spacepath;
      // console.log(spacepath)
      this.scene = spacepath.scene;
      this.camera = spacepath.camera;
      if(spacepath.sphere) {
        this.sphere = spacepath.sphere;
      }
      if(spacepath.sensorPoint) {
        this.indicator = spacepath.sensorPoint;
        this.indicator.setScale(0.4);
      }
      if(spacepath.sensorPath) {
        this.sensorPath = spacepath.sensorPath;
      }
      if(spacepath.refCircle) {
        this.refCircle = spacepath.refCircle;
        this.refCircle.setScale(0.5)
      }
      // console.log(craftObj)
    }
  },
  mounted() {
    console.log("Sidebar Mounted")
    setTimeout(() => {
      this.init(spacepath)
    }, 500)
  }
}
</script>

<style>

</style>
