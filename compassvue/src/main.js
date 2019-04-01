import Vue from 'vue'
import App from './App.vue'
import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
Vue.use(BootstrapVue);

import SocketIO from 'socket.io-client';
import VueSocketIO from 'vue-socket.io'
const wsPort = 4900; // location.port
// for qt webengineview
const socketIOAddr = 'ws://localhost:' + wsPort + '/feed'; 
// const socketIOAddr = location.protocol + '//' + document.domain + ':' + wsPort + '/feed';
console.info("socketio:", socketIOAddr)
const options = { path: '/socket.io', origins:socketIOAddr };
Vue.use(new VueSocketIO({
  debug: false,
  connection: SocketIO(socketIOAddr, options), //options object is Optional
  // connection: socketIOAddr, //options object is Optional
})
);

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
