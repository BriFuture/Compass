<template>
  <b-card header="模拟器参数设置" :class="{nopadding: !craft.visible}">
    <template slot="header">
      <b-checkbox @change="paintCraft($event)">绘制模拟器</b-checkbox>
    </template>
    <b-card-body v-if="craft.visible">
      <div :class="{disable: !craft.visible }">
        模拟器大小: {{craft.size}}
        <b-form-input
          type="range"
          id="craftSize"
          :value="craft.size"
          min="0.1"
          max="3"
          step="0.1"
          @change="setCraftSize($event)"
        />
      </div>
      <div class>
        模拟器headingOffset: {{craft.headingOffset}}
        <b-form-input
          type="range"
          id="craftHO"
          :value="craft.headingOffset"
          min="0"
          max="360"
          step="45"
          @change="changeHeadingOffset($event)"
        />
      </div>
      <div class>
        模拟器pitchOffset: {{craft.pitchOffset}}
        <b-form-input
          type="range"
          id="craftPO"
          :value="craft.pitchOffset"
          min="0"
          max="180"
          step="45"
          @change="changePitchOffset($event)"
        />
      </div>
      <div class>
        模拟器rollOffset: {{craft.rollOffset}}
        <b-form-input
          type="range"
          id="craftRO"
          :value="craft.rollOffset"
          min="0"
          max="360"
          step="45"
          @change="changeRollOffset($event)"
        />
      </div>
    </b-card-body>
  </b-card>
</template>

<script>
export default {
  props: {
    craft: Object,
  },
  methods: {
    paintCraft(value) {
      if(value) {       
        this.$emit("initCraft");
      }
      this.craft.visible = value;
    },
    changePitchOffset(value) {
      this.craft.pitchOffset = parseFloat(value);
    },
    changeHeadingOffset(value) {
      this.craft.headingOffset = parseFloat(value);
    },
    changeRollOffset(value) {
      this.craft.rollOffset = parseFloat(value);
    }
  }
};
</script>

<style>
.nopadding > .card-body {
  padding: 0
}
</style>
