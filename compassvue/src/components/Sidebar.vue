<template>
<div>
  <div class="camera">
    <div>摄像机θ角(与Z轴正半轴夹角)
      <b-form-input type="range" id="cameraTheta" v-model="cameraTheta" min="0" max="180" @change="cameraThetaChanged"/>
    </div>
    <div>摄像机φ角(与X轴正半轴夹角)
      <b-form-input type="range" id="cameraPhi" v-model="cameraPhi" min="0" max="360" @change="cameraPhiChanged" />
    </div>
    <div>摄像机距原点
      <b-form-input type="range" id="cameraDis" v-model="cameraDis" min="1" max="180" @change="cameraDisChanged" />
    </div>
  </div>
  <div class="params"> 
    <div>参考球半径</div>
    <div>球面透明度</div>
    <div>指示器大小</div>
    <div>轨迹宽度</div>
    <div>模拟器大小</div>
  </div>
  <div class="sphereMode">
    <div>Line</div>
    <div>Surface</div>
    <div>lessLine</div>
  </div>
  <div class="option">
    <div>绘制路径</div>
    <div>绘制模拟器</div>
    <div>球坐标系</div>
    <div>显示修正圆圈</div>
  </div>
  <div class="action">
    <div>重置摄像机</div>
    <div>重置路径</div>
    <div>打点</div>
    <div>重置打点</div>
  </div>
</div>
</template>

<script>
export default {
  props: {
    camera: Object
  },
  data() {
    return {
      cameraTheta: 0,
      cameraPhi: 0,
      cameraDis: 0,
    }
  },
  methods: {
    cameraPhiChanged() {
      this.camera.rotate(null, this.cameraPhi, null);
    },
    cameraThetaChanged() {
      this.camera.rotate(this.cameraTheta, null, null);
    },
    cameraDisChanged() {
      this.camera.rotate(null, null, this.cameraDis);
    }
  }
}
</script>

<style>

</style>
