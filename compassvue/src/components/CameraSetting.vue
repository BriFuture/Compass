<template>
  <b-card header="相机设置">
    <b-btn @click="resetCamera()">重置摄像机位置</b-btn>
    <div>
      摄像机θ角(与Z轴正半轴夹角): {{ cameraTheta.toFixed(1) }}
      <b-form-input
        type="range"
        id="cameraTheta"
        :value="cameraTheta"
        min="0"
        max="180"
        @change="cameraThetaChanged($event)"
      />
    </div>
    <div>
      摄像机φ角(与X轴正半轴夹角): {{ cameraPhi.toFixed(1) }}
      <b-form-input
        type="range"
        id="cameraPhi"
        :value="cameraPhi"
        min="0"
        max="360"
        @change="cameraPhiChanged($event)"
      />
    </div>
    <div>
      摄像机距原点: {{cameraDis}}
      <b-form-input
        type="range"
        id="cameraDis"
        :value="cameraDis"
        min="1"
        max="180"
        @change="cameraDisChanged($event)"
      />
    </div>
    <b-checkbox v-model="sphereCoord">球坐标系</b-checkbox>
  </b-card>
</template>

<script>
import {radToDeg} from '@/states'
export default {
  props: {
    camera: {
      type: Object,
      default: {
        theta: 0,
        phi: 0,
        dis: 4
      },
    }
  },
  data() {
    return {
      sphereCoord: true,
    }
  },
  computed: {
    cameraPhi() {
      return radToDeg(this.camera.phi);
    }, 
    cameraTheta() {
      return radToDeg(this.camera.theta);
    },
    cameraDis() {
      return this.camera.dis;
    },
  },
  methods: {
    cameraPhiChanged(value) {
      this.camera.rotate(null, value, null);
    },
    cameraThetaChanged(value) {
      this.camera.rotate(value, null, null);
    },
    cameraDisChanged(value) {
      this.camera.rotate(null, null, value);
    },
    resetCamera() {
      this.camera.reset()
    }
  }
};
</script>

<style>
</style>
