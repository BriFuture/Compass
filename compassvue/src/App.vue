<template>
  <b-container fluid id="app">
    <!-- <script type="text/javascript" src="@/components/gl-matrix-min.js"></script> -->
    <b-row>
      <b-col cols="2" class="">
        <c-sidebar ref="sidebar"
        ></c-sidebar>
      </b-col>
      <b-col cols="10">
        <canvas ref="canvas" width="800" height="600"></canvas>
        <div class="float-right">
          <c-debug-panel @valueChanged="debugValueChanged($event)"></c-debug-panel>
          <c-information :data="data"></c-information>
        </div>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import CSidebar from './components/Sidebar.vue'
import CInformation from './components/Information.vue'
import CDebugPanel from './components/DebugPanel.vue'
import {spacepath, radToDeg, wheelScroll, onMouseUp, onMouseMove, onMouseDown, cameraParam} from './states'


export default {
  name: 'app',
  components: {
    CSidebar,
    CInformation,
    CDebugPanel
  },
  data() {
    return {
      data: {}
    }
  },
  created() {
    // console.log(this.$refs)
    // this.sp = new SpacePath()
  },
  mounted() {
    console.log("SpacePath is Mounted")
    var canvas = this.$refs.canvas;
    var gl = canvas.getContext('webgl',
      { depth: true, antilias: true }
    );
    this.spacepath = spacepath;
    this.spacepath.init(gl);
    this.spacepath.defaultInit();
    this.spacepath.scene.render();

    cameraParam.camera = this.spacepath.camera;
    cameraParam.canvas = canvas;
    canvas.addEventListener('mousedown', onMouseDown);

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);

    canvas.addEventListener('wheel', wheelScroll, false);
    this.$socket.emit('connect')
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
  },
  sockets: {
    connect: function () {
        console.log('socket connected')
    },
    feedHPR(data) {
      this.data = data;
      this.spacepath.setAttitude(data)
      // console.log(this.spacepath.attitude)
        // console.log('this method was fired by the socket server. eg: io.emit("customEmit", data)')
    },
    my_response: function(data) {
      console.log("Test my response", data);
    }
  },
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
