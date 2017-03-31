import QtQuick 2.0
import QtCanvas3D 1.1
import QtQuick.Controls 1.4

//import "Ball.js" as GLcode
import "Coordinate3D.js" as GLcode

Item {
    width: 800
    height: 600
    visible: true

    MouseArea {
        z: 1
        width: parent.width / 3
        height: parent.height / 3
        anchors {
            top: parent.top
            left: parent.left
        }

        onClicked: {
            canvas3d.xRotAnim+=canvas3d.gap;
        }

    }
    MouseArea {
        z: 1
        width: parent.width / 3
        height: parent.height / 3
        anchors {
            top: parent.top
            right: parent.right
        }

        onClicked: {
            canvas3d.xRotAnim-=canvas3d.gap;
        }

    }
    MouseArea {
        z: 1
        width: parent.width / 3
        height: parent.height / 3
        anchors {
            bottom: parent.bottom
            left: parent.left
        }

        onClicked: {
            canvas3d.yRotAnim+=canvas3d.gap;
        }
    }
    MouseArea {
        z: 1
        width: parent.width / 3
        height: parent.height / 3
        anchors {
            bottom: parent.bottom
            right: parent.right
        }

        onClicked: {
            canvas3d.yRotAnim-=canvas3d.gap;
        }
    }
    MouseArea {
        z: 1
        width: parent.width / 3
        height: parent.height / 3
        anchors {
            top: parent.top
            horizontalCenter: parent.horizontalCenter
        }

        onClicked: {
            canvas3d.zRotAnim+=canvas3d.gap;
        }
    }
    MouseArea {
        z: 1
        width: parent.width / 3
        height: parent.height / 3
        anchors {
            bottom: parent.bottom
            horizontalCenter: parent.horizontalCenter
        }

        onClicked: {
            canvas3d.zRotAnim-=canvas3d.gap;
        }
    }
    MouseArea {
        z: 1
        width: parent.width / 3
        height: parent.height / 3
        anchors {
            horizontalCenter: parent.horizontalCenter
            verticalCenter: parent.verticalCenter
        }

        onClicked: {
            canvas3d.xRotAnim = 0;
            canvas3d.yRotAnim = 0;
            canvas3d.zRotAnim = 0;
        }
    }

    Rectangle {
        id: textureSource
        z: 1
        color: "transparent"
        width: 200
        height: 200
        border.color: "blue"
        border.width: 2
        layer.enabled: true
        layer.smooth: true
        Label {
            anchors.fill: parent
            anchors.margins: 16
            text: "X Rot:" + (canvas3d.xRotAnim | 0) + "\n"
                + "Y Rot:" + (canvas3d.yRotAnim | 0) + "\n"
                + "Z Rot:" + (canvas3d.zRotAnim | 0) + "\n"
                + "FPS:" + canvas3d.fps
            color: "red"
            font.pointSize: 20
            horizontalAlignment: Text.AlignLeft
            verticalAlignment: Text.AlignVCenter
        }
    }

    Canvas3D {
        id: canvas3d
        anchors.fill: parent
        focus: true
        property double xRotAnim: 0
        property double yRotAnim: 0
        property double zRotAnim: 0
        property double xPos: 0
        property double yPos: 0
        property double zPos: 0
        property int gap: 10
        property bool isRunning: true
        // 渲染节点就绪时，进行初始化时触发
        onInitializeGL: {
            GLcode.initializeGL(canvas3d)
        }

        // 当 canvas3d 准备好绘制下一帧时触发
        onPaintGL: {
            GLcode.paintGL(canvas3d)
        }

        onResizeGL: {
            GLcode.resizeGL(canvas3d)
        }

        Keys.onSpacePressed: {
            canvas3d.isRunning = !canvas3d.isRunning
            if (canvas3d.isRunning) {
                objAnimationX.pause();
                objAnimationY.pause();
                objAnimationZ.pause();
            } else {
                objAnimationX.resume();
                objAnimationY.resume();
                objAnimationZ.resume();
            }
        }

        /*
         * x 方向的动画，修改 xRotAnim 的值，在 js 函数中实现旋转
        */
        SequentialAnimation {
            id: objAnimationX
            loops: Animation.Infinite
            running: false
            NumberAnimation {
                target: canvas3d
                property: "xRotAnim"
                from: 0.0
                to: 100.0
                duration: 7000
                easing.type: Easing.InOutQuad
            }
            NumberAnimation {
                target: canvas3d
                property: "xRotAnim"
                from: 100.0
                to: 0.0
                duration: 7000
                easing.type: Easing.InOutQuad
            }
        }


        /*
         * y 方向的动画，修改 yRotAnim 的值，在 js 函数中实现旋转
        */
        SequentialAnimation {
            id: objAnimationY
            loops: Animation.Infinite
            running: false
            NumberAnimation {
                target: canvas3d
                // yRotAnim 变量从 from 变到 to ，用时为 duration ms
                property: "yRotAnim"
                from: 0.0
                to: 30.0
                duration: 5000
                easing.type: Easing.InOutCubic
            }
            NumberAnimation {
                target: canvas3d
                property: "yRotAnim"
                from: 30.0
                to: 0.0
                duration: 5000
                easing.type: Easing.InOutCubic
            }
        }

        /*
         * z 方向的动画，修改 zRotAnim 的值，在 js 函数中实现旋转
        */
        SequentialAnimation {
            id: objAnimationZ
            loops: Animation.Infinite   // 重复循环
            running: false
            NumberAnimation {
                target: canvas3d
                property: "zRotAnim"
                from: -20.0
                to: 80.0
                duration: 3000
                easing.type: Easing.InOutSine
            }
            NumberAnimation {
                target: canvas3d
                property: "zRotAnim"
                from: 80.0
                to: -20.0
                duration: 3000
                easing.type: Easing.InOutSine
            }
        }
    }

}
