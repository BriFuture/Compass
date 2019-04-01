<template>
  <b-card header="球体参数设置" :class="{nopadding: !sphere.visible}">
    <template slot="header">
      <b-checkbox v-model="sphere.visible">显示球体</b-checkbox>
    </template>
    <b-card-body v-if="sphere.visible">
      <div>
        参考球半径: {{sphere.size}}
        <b-form-input
          type="range"
          id="sphereRadius"
          :value="sphere.size"
          min="1"
          max="10"
          @change="sphereRadiusChanged($event)"
        />
      </div>
      <div>球面透明度: {{sphereAlpha}}
        <b-form-input type="range" id="sphereOpacity" :value="sphereAlpha" min="0" max="100" 
          @change="sphere.alpha = parseFloat($event) / 100" />
      </div>
      <b-form-group label="绘制球体的模式">
        <b-radio-group v-model="sphere.drawMode" class="sphereMode">
          <div>
            <b-radio :value="0">Surface</b-radio>
          </div>
          <div>
            <b-radio :value="1">Line</b-radio>
          </div>
          <div>
            <b-radio :value="2">lessLine</b-radio>
          </div>
        </b-radio-group>
      </b-form-group>
    </b-card-body>
  </b-card>
</template>

<script>
export default {
  props: {
    sphere:{
      type: Object,
      default: {
        size: 4,
        alpha: 1,
        drawMode: 0,
      },
    }
  },
  computed: {
    sphereAlpha() {
      return this.sphere.alpha * 100;
    },
  },
  methods: {
        
    sphereRadiusChanged(value) {
      this.sphere.setSize(value);
      // this.camera.rotate()
    },
  }
  
};
</script>

<style>
</style>
