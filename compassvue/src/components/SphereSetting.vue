<template>
  <b-card header="球体参数设置">
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
    <b-checkbox v-model="sphere.visible">显示球体</b-checkbox>
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
