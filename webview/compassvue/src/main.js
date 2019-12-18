import Vue from 'vue'
import App from './App.vue'
import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
Vue.use(BootstrapVue);

const wsPort = 4900; // location.port
// for qt webengineview
const namespace = "/"
const socketIOAddr = 'ws://localhost:' + wsPort + namespace; 
// const socketIOAddr = location.protocol + '//' + document.domain + ':' + wsPort + namespace;
console.info("socketio:", socketIOAddr)
// import SocketIO from 'socket.io-client';
// import VueSocketIO from 'vue-socket.io'
// const options = { path: '/socket.io', origins:socketIOAddr };
// Vue.use(new VueSocketIO({
//   debug: false,
//   connection: SocketIO(socketIOAddr, options), //options object is Optional
//   // connection: socketIOAddr, //options object is Optional
// })
// );
import VueNativeSock from 'vue-native-websocket'
Vue.use(VueNativeSock, socketIOAddr, { format: 'json' })

Vue.config.productionTip = false

const vm = new Vue({
  render: h => h(App),
}).$mount('#app');

// // Connect to the websocket target specified in the configuration
// vm.$connect()
// // Connect to an alternative websocket URL and Options e.g.
// vm.$connect('ws://localhost:9090/alternative/connection/', { format: 'json' })
// // do stuff with WebSockets
// vm.$disconnect()
