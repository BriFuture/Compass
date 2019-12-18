<template>
  <b-container fluid id="app">
    <!-- <script type="text/javascript" src="@/components/gl-matrix-min.js"></script> -->
    <canvas ref="canvas" id="canvas" v-bind:width="canvasWidth" v-bind:height="canvasHeight"></canvas>

    <div >
      <b-row class="panel">
        <b-col cols="6" md="3" lg="2" class="full-height px-0 float-right subpanel" v-bind:style="{'height':canvasHeight+'px'}">
          <c-sidebar v-show="showSidebar" ref="sidebar" class=""></c-sidebar>
        </b-col>
        <b-col cols="6" md="6" lg="8"  ref="panel">
          <b-checkbox v-model="showSidebar"   class="d-inline-block mx-4">显示控制面板</b-checkbox> 
          <b-checkbox v-model="showDebugInfo" class="d-inline-block mx-4">显示调试信息</b-checkbox>
        </b-col>
        <b-col cols="6" md="3" lg="2" class="full-height" v-bind:style="{'height':canvasHeight+'px'}">
          <div v-show="showDebugInfo" class="subpanel">
            <c-debug-panel :data="data" @valueChanged="debugValueChanged($event)" ></c-debug-panel>
            <c-information :data="data"></c-information>
          </div>
        </b-col>
      </b-row>
    </div>

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
      canvasWidth: 800,
      canvasHeight: 600,
      data: {
        heading: 0,
        pitch: 0,
        roll: 0,
      },
      showSidebar: true,
      showDebugInfo: true,
    }
  },
  created() {
    // console.log(this.$refs)
    // this.sp = new SpacePath()
  },
  mounted() {
    this.$debug = {"heading": 0, "pitch": 0, "roll": 0}
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
    var panel = this.$refs.panel;
    panel.addEventListener('mousedown', onMouseDown);
    panel.addEventListener('mousemove', onMouseMove);
    panel.addEventListener('mouseup', onMouseUp);
    panel.addEventListener('wheel', wheelScroll, false);

    // socket.IO
    // this.$socket.emit('connect');
    // nativeSocket
    // this.$socket.send('test')
    this.canvasWidth = window.innerWidth;
    this.canvasHeight = window.innerHeight;
    this.spacepath.camera.setSize(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", (e) => {
      this.canvasWidth = window.innerWidth - 2;
      this.canvasHeight = window.innerHeight - 2;
      this.spacepath.camera.setSize(this.canvasWidth, this.canvasHeight);
        // console.log("Resource conscious resize callback!", e);
    });
    this.registerSockets()
  },
  methods: {
    debugValueChanged(event) {
      this.$set(this.data, event.key, parseFloat(event.value))
      // console.log(this.data, typeof(this.data.heading))
      this.spacepath.setAttitude(this.data)
      // console.log(event);
    },
    registerSockets() {
      /**
       * data: { type: 'feedHPR', heading: 0 , ...}
       * or {type: 'action', idx: 99, record: true ...}
       */
      this.$options.sockets.onmessage = (msg) => {
        // console.log('socket recv: ', msg.data)
        let data = JSON.parse(msg.data)
        // console.log('socket recv after: ', data)
        if(data.type === "feedHPR") {
          this.data.heading = data.heading || this.data.heading;
          this.data.pitch = data.pitch || this.data.pitch;
          this.data.roll = data.roll || this.data.roll;
          this.data.length = data.length || this.data.length;
          this.spacepath.setAttitude(this.data)

        } else if(data.type === "action") {
          /**
           * example of `data`: { idx: 99, record: true, resetRecord: true, resetPath: true }
           * response: { idx, status: 'ok' }
           */
          // first reset all records and then record one
          // console.log("action:", data)
          if(data.resetRecord) {
            this.spacepath.recordPoint.reset();
          }
          if(data.record) {
            this.spacepath.recordPoint.record();
          }
          if(data.resetPath) {
            this.spacepath.sensorPath.resetAllPath()
          }
          this.$socket.send( JSON.stringify({idx: data.idx, status: 'ok' }) );
        }
      };
    },
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
    action(data) {
      /**
       * example of `data`: { idx: 99, record: true, resetRecord: true, resetPath: true }
       * response: { idx, status: 'ok' }
       */
      // first reset all records and then record one
      // console.log("action:", data)
      if(data.resetRecord) {
        this.spacepath.recordPoint.reset();
      }
      if(data.record) {
        this.spacepath.recordPoint.record();
      }
      if(data.resetPath) {
        this.spacepath.sensorPath.resetAllPath()
      }
      this.$socket.emit('response', {idx: data.idx, status: 'ok' } )
      // console.log("Test my response", data);
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
  padding: 0;
  /* margin-top: 60px; */
}
#canvas {
  margin: 0;
  padding: 0;
  z-index: 100;
  /* display: ; */
  /* position: fixed; */
}

html body {
  overflow: hidden;
}

.full-height {
  height: 100%;
}

.panel {
  position: absolute;
  left: 5px;
  padding: 0;
  margin: 0;
  /* padding-left: 20px; */
  top: 0px;
  width: 100%;
  height: 100%;
  /* z-index: 100; */
  -moz-user-select: -moz-none; 
  -moz-user-select: none; 
  -o-user-select:none; 
  -khtml-user-select:none; 
  -webkit-user-select:none; 
  -ms-user-select:none; 
  user-select:none;

}

.subpanel {
  overflow-y: auto;
  height: 100%;
  padding: 0;
  margin: 0;
}
</style>
