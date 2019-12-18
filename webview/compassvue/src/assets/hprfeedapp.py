"""
Note: Obsolute, because QtWebSocket is native socket, not support for Socket.IO
"""
from gevent import monkey
monkey.patch_all()
from flask_socketio import SocketIO, emit
from flask import Flask, render_template, request
from threading import Lock    
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)
thread = None
thread_lock = Lock()
DefaultNameSpace = '/'
def background_task():
    heading = 0
    pitch = 0
    roll = 0
    print('Starting Background task')
    t = 0
    while True:
        heading += 0.1
        pitch += 0.1
        roll += 0.1
        if abs(heading - 360) < 0.1:
            heading = 0
            
        if abs(pitch - 180) < 0.1:
            pitch = 0
        if abs(roll - 360) < 0.1:
            roll = 0

        socketio.emit("feedHPR", {'pitch': pitch, 'heading': heading, 'roll': roll}, namespace=DefaultNameSpace)
        socketio.sleep(0.01)
        t += 1
        if t == 3500:
            print("reset")
            socketio.emit("action", {"resetRecord": True, "resetPath": True}, namespace=DefaultNameSpace)
            socketio.sleep(0.01)
            t = 0
        if t % 500 == 0:
            print("record")
            socketio.emit("action", {"record": True}, namespace=DefaultNameSpace)
            socketio.sleep(0.01)

@app.route('/')
def index():
    # socketio.emit("feedHPR", {'data': 'test'}, namespace='/')
    print('index')
    # socketio.sleep(0)
    return 'Hello'
@app.errorhandler(404)
def page_not_found(e):
    url = request.url
    return 'Page Not Found, request: {}'.format(url)
    
print('start')
@socketio.on('connect', namespace=DefaultNameSpace)
def test_connect():
    global thread
    print('connected', request.url)
    # emit("connect", {'data': 'test'}, namespace='/')
    socketio.sleep(0)
    with thread_lock:
        if thread is None:
            thread = socketio.start_background_task(background_task)

@socketio.on('getHPR', namespace=DefaultNameSpace)
def test_feedHPR():
    emit("feedHPR", {'data': 'test'})


@socketio.on('feedHPR', namespace=DefaultNameSpace)
def test_message(message):
    emit('my response', {'data': 'got it! Feed HPR'})

if __name__ == '__main__':
    socketio.run(app, port=4900)