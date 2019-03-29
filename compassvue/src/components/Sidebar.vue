<template>
<div>
  <b-checkbox v-model="scene.running" @change="setSceneRun($event)">实时更新 3D 图像</b-checkbox>
  <b-card header="其他参数设置"> 
    <div class="option">
      <b-checkbox v-model="sensorPath.visible">绘制路径</b-checkbox>
      <b-checkbox @change="paintCraft($event)">绘制模拟器</b-checkbox>{{ craft.elements}}
      <b-checkbox v-model="refCircle.visible">显示修正圆圈</b-checkbox>
    </div>
    <div class="action">
      <b-btn>重置摄像机位置</b-btn>
      <b-btn>重置路径</b-btn>
      <b-btn>打点</b-btn>
      <b-btn>重置打点</b-btn>
    </div>
    <div>球面透明度: {{sphereAlpha}}
      <b-form-input type="range" id="sphereOpacity" :value="sphereAlpha" min="0" max="100" 
        @change="sphere.alpha = parseFloat($event) / 100" />
    </div>
    <div>指示器大小: {{indicatorSize.toFixed(1)}}
      <b-form-input type="range" id="indicatorSize" :value="indicatorSize" min="1" max="100" 
        @change="setIndicatorSize($event)" />
    </div>
    <div>轨迹宽度 {{pathWidth}}
      <b-form-input type="range" id="pathWidth" :value="pathWidth" min="1" max="100" 
        @change="setPathWidth($event)" />
    </div>
    <div class="hidden">模拟器大小
      <b-form-input type="range" id="craftSize" :value="pathWidth" min="1" max="100" 
        @change="setPathWidth($event)" />
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

import {spacepath, craftObj, radToDeg} from '@/states'
import { setTimeout } from 'timers';
import CameraSetting from './CameraSetting'
import SphereSetting from './SphereSetting'

export default {
  components: {
    CameraSetting,
    SphereSetting
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
        visible: false
      }
    }
  },
  computed: {

    sphereAlpha() {
      return this.sphere.alpha * 100;
    },
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

    setIndicatorSize(value) {
      this.indicator.setScale(parseFloat(value) / 100);
    },
    setPathWidth(value) {
      this.sensorPath.setSize(value);
    },
    setRefCircleSize(value) {
      this.refCircle.setScale(parseFloat(value));
    },
    paintCraft(value) {
      if(value) {
        // this.spacePath.addCraft({obj: craftObj});
        this.spacePath.addCraft({});

        this.craft = this.spacePath.craft;
        this.craft.init(craftObj)
        // console.log(craftObj)
        // var mesh = new OBJ.Mesh(craftObj)
        // OBJ.initMeshBuffers(this.spacePath.states.gl, mesh)
        // console.log(mesh)
        // this.craft.mesh = mesh;
        this.craft.visible = true;
      } else {
        this.craft.visible = false;
      }
      console.log("Paint", value)
    },
    init(spacePath) {
      this.spacePath = spacePath;
      console.log(spacePath)
      this.scene = spacePath.scene;
      this.camera = spacePath.camera;
      if(spacePath.sphere) {
        this.sphere = spacePath.sphere;
      }
      if(spacePath.sensorPoint) {
        this.indicator = spacePath.sensorPoint;
        this.indicator.setScale(0.4);
      }
      if(spacePath.sensorPath) {
        this.sensorPath = spacePath.sensorPath;
      }
      if(spacePath.refCircle) {
        this.refCircle = spacePath.refCircle;
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
