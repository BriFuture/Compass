<template>
  <b-container fluid id="app">
    <!-- <script type="text/javascript" src="@/components/gl-matrix-min.js"></script> -->
    <b-row>
      <b-col cols="2" class="">
        <c-sidebar :camera="camera"
        ></c-sidebar>
        <c-information></c-information>
      </b-col>
      <b-col cols="10">
        <canvas ref="canvas" width="800" height="600"></canvas>
      </b-col>
      <b-col cols="3">
        <c-debug-panel @valueChanged="debugValueChanged($event)"></c-debug-panel>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import CSidebar from './components/Sidebar.vue'
import CInformation from './components/Information.vue'
import CDebugPanel from './components/DebugPanel.vue'
import {SpacePath} from './compass/SpacePath'

export default {
  name: 'app',
  components: {
    CSidebar,
    CInformation,
    CDebugPanel
  },
  data() {
    return {
      camera: {},
      // spacepath: {}
    }
  },
  created() {
    // console.log(this.$refs)
    // this.sp = new SpacePath()
  },
  mounted() {
    console.log("Mounted")
    this.spacepath = new SpacePath(this.$refs.canvas)
    this.camera = this.spacepath.camera;
  },
  methods: {
    debugValueChanged(event) {
      if(event.key == "heading") {
        this.spacepath.sensorPoint.setParam({heading: parseFloat(event.value)})
      } else if(event.key == "pitch") {
        this.spacepath.sensorPoint.setParam({pitch: parseFloat(event.value)})
      } else if(event.key == "roll") {
        this.spacepath.sensorPoint.setParam({roll: parseFloat(event.value)})
      }
      // console.log(event);
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
