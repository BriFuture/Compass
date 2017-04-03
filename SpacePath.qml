import QtQuick 2.0
import QtCanvas3D 1.1
import QtQuick.Controls 1.4

//import "Ball.js" as GLcode
import "SpacePath.js" as GLcode

Item {
    width: 1200
    height: 900
    visible: true

    MouseArea {
        anchors.fill: parent
        onClicked: {
            canvas3d.isRunning = !canvas3d.isRunning
        }

    }

    Label {
        z: 1
        anchors.top: parent.top
        anchors.right: parent.right
        anchors.rightMargin: 80
        width: 30
        height: 20
        text: "FPS: " + canvas3d.fps
        font.pointSize: 20
        horizontalAlignment: Text.AlignLeft
        verticalAlignment: Text.AlignVCenter
    }

    Rectangle {
        id: textureSource
        z: 1
        color: "transparent"
        width: 200
        height: 300
        border.color: "blue"
        border.width: 1
        layer.enabled: true
        layer.smooth: true
//        Label {
////            anchors.fill: parent
//            anchors.margins: 16
//            text: "X Rot:" + (canvas3d.xRotAnim | 0) + "\n"
//                + "Y Rot:" + (canvas3d.yRotAnim | 0) + "\n"
//                + "Z Rot:" + (canvas3d.zRotAnim | 0) + "\n"
//                + "FPS:" + canvas3d.fps
//            color: "red"
//            font.pointSize: 20
//            horizontalAlignment: Text.AlignLeft
//            verticalAlignment: Text.AlignVCenter
//        }
        /*
        Label {
            id: xPosLabel
            anchors.leftMargin: 5
            anchors.left: parent.left
            anchors.top: parent.top
            anchors.topMargin: 5
            height: 20
            text: "X POSITION:"
        }
        Rectangle {
            border.color: "black"
            anchors.top: parent.top
            anchors.leftMargin: 5
            anchors.left: xPosLabel.right
            width: 50
            height: 20
            TextInput {
                id: xPosInput
                font.pointSize: 16
                anchors.fill: parent
                text: canvas3d.xPos
                validator: DoubleValidator{bottom: -300; top: 300;}
            }
        }
        Label {
            id: yPosLabel
            anchors.leftMargin: 5
            anchors.left: parent.left
            anchors.top: xPosLabel.bottom
            anchors.topMargin: 5
            height: 20
            text: "Y POSITION:"
        }
        Rectangle {
            border.color: "black"
            anchors.left: yPosLabel.right
            anchors.leftMargin: 5
            anchors.top: xPosLabel.bottom
            width: 50
            height: 20
            TextInput {
                id: yPosInput
                font.pointSize: 16
                anchors.fill: parent
                text: canvas3d.yPos
                validator: DoubleValidator{bottom: -300; top: 300;}
            }
        }
        Label {
            id: zPosLabel
            anchors.leftMargin: 5
            anchors.left: parent.left
            anchors.top: yPosLabel.bottom
            anchors.topMargin: 5
            height: 20
            text: "Z POSITION:"
        }
        Rectangle {
            border.color: "black"
            anchors.left: zPosLabel.right
            anchors.leftMargin: 5
            anchors.top: yPosLabel.bottom
            width: 50
            height: 20
            TextInput {
                id: zPosInput
                font.pointSize: 16
                anchors.fill: parent
                text: canvas3d.zPos
                validator: DoubleValidator{bottom: -300; top: 300;}
            }
        }

        Label {
            id: xRotLabel
            anchors.leftMargin: 5
            anchors.left: parent.left
            anchors.top: zPosLabel.bottom
            anchors.topMargin: 5
            height: 20
            text: "X ROTATION:"
        }
        Rectangle {
            border.color: "black"
            anchors.top: zPosLabel.bottom
            anchors.leftMargin: 5
            anchors.left: xRotLabel.right
            width: 50
            height: 20
            TextInput {
                id: xRotInput
                font.pointSize: 16
                anchors.fill: parent
                text: canvas3d.xRotAnim
                validator: DoubleValidator{bottom: -360; top: 360;}
            }
        }
        Label {
            id: yRotLabel
            anchors.leftMargin: 5
            anchors.left: parent.left
            anchors.top: xRotLabel.bottom
            anchors.topMargin: 5
            height: 20
            text: "Y ROTATION:"
        }
        Rectangle {
            border.color: "black"
            anchors.left: yRotLabel.right
            anchors.leftMargin: 5
            anchors.top: xRotLabel.bottom
            width: 50
            height: 20
            TextInput {
                id: yRotInput
                font.pointSize: 16
                anchors.fill: parent
                text: canvas3d.yRotAnim
                validator: DoubleValidator{bottom: -360; top: 360;}
            }
        }
        Label {
            id: zRotLabel
            anchors.leftMargin: 5
            anchors.left: parent.left
            anchors.top: yRotLabel.bottom
            anchors.topMargin: 5
            height: 20
            text: "Z ROTATION:"
        }
        Rectangle {
            border.color: "black"
            anchors.left: zRotLabel.right
            anchors.leftMargin: 5
            anchors.top: yRotLabel.bottom
            width: 50
            height: 20
            TextInput {
                id: zRotInput
                font.pointSize: 16
                anchors.fill: parent
                text: canvas3d.zRotAnim
                validator: DoubleValidator{bottom: -360; top: 360;}
            }
        }
        */
        Rectangle {
            id: xCameraContainer
            width: 200
            height: 50
            anchors.top: parent.top
            anchors.left: parent.left
            color: "transparent"
            Label {
                id: xCameraPos
                anchors.leftMargin: 5
                anchors.left: parent.left
                anchors.top: parent.top
                anchors.topMargin: 5
                height: 20
                text: "X CAMARA POSITION:"
            }
            Rectangle {
                border.color: "black"
    //            anchors.top: zRotLabel.bottom
                anchors.top: parent.top
                anchors.leftMargin: 5
                anchors.left: xCameraPos.right
                width: 70
                height: 20
                TextInput {
                    id: xCameraInput
                    font.pointSize: 16
                    anchors.fill: parent
                    text: canvas3d.cx
                    validator: DoubleValidator{bottom: -20; top: 20;}
                }
            }
            Slider {
                id: xCameraSlider
                anchors.top: xCameraPos.bottom
                maximumValue: 30.0
                minimumValue: -30.0
                width: 200
                orientation: Qt.Horizontal
                value: canvas3d.cx
                onValueChanged: {
                    canvas3d.cx = xCameraSlider.value.toFixed(2)
                }
            }
        }
        Rectangle {
            id: yCameraContainer
            width: 200
            height: 50
            anchors.top: xCameraContainer.bottom
            anchors.left: parent.left
            color: "transparent"
            Label {
                id: yCameraPos
                anchors.leftMargin: 5
                anchors.left: parent.left
                anchors.top: parent.top
                anchors.topMargin: 5
                height: 20
                text: "Y CAMARA POSITION:"
            }
            Rectangle {
                border.color: "black"
                anchors.left: yCameraPos.right
                anchors.leftMargin: 5
                anchors.top: parent.top
                width: 70
                height: 20
                TextInput {
                    id: yCameraInput
                    font.pointSize: 16
                    anchors.fill: parent
                    text: canvas3d.cy
                    validator: DoubleValidator{bottom: -20; top: 20;}
                }
            }
            Slider {
                id: yCameraSlider
                anchors.top: yCameraPos.bottom
                maximumValue: 30.0
                minimumValue: -30.0
                width: 200
                orientation: Qt.Horizontal
                value: canvas3d.cy
                onValueChanged: {
                    canvas3d.cy = yCameraSlider.value.toFixed(2)
                }
            }
        }
        Rectangle {
            id: zCameraContainer
            height: 50
            width: 200
            anchors.top: yCameraContainer.bottom
            anchors.left: parent.left
            color: "transparent"
            Label {
                id: zCameraPos
                anchors.leftMargin: 5
                anchors.left: parent.left
                anchors.top: parent.top
                anchors.topMargin: 5
                height: 20
                text: "Z CAMARA POSITION:"
            }
            Rectangle {
                border.color: "black"
                anchors.left: zCameraPos.right
                anchors.leftMargin: 5
                anchors.top: parent.top
                width: 70
                height: 20
                TextInput {
                    id: zCameraInput
                    font.pointSize: 16
                    anchors.fill: parent
                    text: canvas3d.cz
                    validator: DoubleValidator{bottom: -20; top: 20;}
                }
            }
            Slider {
                id: zCameraSlider
                anchors.top: zCameraPos.bottom
                maximumValue: 30.0
                minimumValue: -30.0
                width: 200
                orientation: Qt.Horizontal
                value: canvas3d.cz
                onValueChanged: {
                    canvas3d.cz = zCameraSlider.value.toFixed(2)
                }
            }
        }

        Button {
            id: setButton
            width: 50
            height: 20
            text: "set"
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.top: zCameraContainer.bottom
            onClicked: {
//                canvas3d.xRotAnim = parseFloat(xRotInput.text)
//                canvas3d.yRotAnim = parseFloat(yRotInput.text)
//                canvas3d.zRotAnim = parseFloat(zRotInput.text)

//                canvas3d.xPos = parseFloat(xPosInput.text)
//                canvas3d.yPos = parseFloat(yPosInput.text)
//                canvas3d.zPos = parseFloat(zPosInput.text)

                canvas3d.cx = parseFloat(xCameraInput.text)
                canvas3d.cy = parseFloat(yCameraInput.text)
                canvas3d.cz = parseFloat(zCameraInput.text)

                xCameraSlider.value = canvas3d.cx
                yCameraSlider.value = canvas3d.cy
                zCameraSlider.value = canvas3d.cz
            }
        }
        Rectangle {
            id: modeSelection
            anchors.top: setButton.bottom
            anchors.left: parent.left
            height: 25
            RadioButton {
                id: lineDrawMode
                anchors.top: parent.top
                anchors.left: parent.left
                anchors.leftMargin: 5
                text: "line"
                checked: false
                width: 20
                height: 20
                onClicked: {
                    selectRB(lineDrawMode);
                }
            }
            RadioButton {
                id: surfaceDrawMode
                anchors.top: parent.top
                anchors.left: lineDrawMode.right
                anchors.leftMargin: 30
                text: "surface"
                checked: false
                width: 20
                height: 20
                onClicked: {
                    selectRB(surfaceDrawMode);
                }
            }
            RadioButton {
                id: lessLineDrawMode
                anchors.top: parent.top
                anchors.left: surfaceDrawMode.right
                anchors.leftMargin: 46
                text: "lessLine"
                checked: false
                width: 20
                height: 20
                onClicked: {
                    selectRB(lessLineDrawMode);
                }
            }

        }

        Rectangle {
            id: pitchContainer
            height: 50
            width: 200
            anchors.top: modeSelection.bottom
            anchors.left: parent.left
            color: "transparent"
            Label {
                id: pitchPos
                anchors.leftMargin: 5
                anchors.left: parent.left
                anchors.top: parent.top
                anchors.topMargin: 5
                height: 20
                text: "PITCH:"
            }
            Rectangle {
                border.color: "black"
                anchors.left: pitchPos.right
                anchors.leftMargin: 5
                anchors.top: parent.top
                width: 70
                height: 20
                TextInput {
                    id: pitchInput
                    font.pointSize: 16
                    anchors.fill: parent
                    text: canvas3d.pitch
                    validator: DoubleValidator{bottom: -90; top: 90;}
                }
            }
            Slider {
                id: pitchSlider
                anchors.top: pitchPos.bottom
                maximumValue: 90.0
                minimumValue: -90.0
                width: 200
                orientation: Qt.Horizontal
                value: canvas3d.pitch
                onValueChanged: {
                    canvas3d.pitch = pitchSlider.value.toFixed(2)
                }
            }
        }


        Rectangle {
            id: headingContainer
            height: 50
            width: 200
            anchors.top: pitchContainer.bottom
            anchors.left: parent.left
            color: "transparent"
            Label {
                id: headingPos
                anchors.leftMargin: 5
                anchors.left: parent.left
                anchors.top: parent.top
                anchors.topMargin: 5
                height: 20
                text: "HEADING:"
            }
            Rectangle {
                border.color: "black"
                anchors.left: headingPos.right
                anchors.leftMargin: 5
                anchors.top: parent.top
                width: 70
                height: 20
                TextInput {
                    id: headingInput
                    font.pointSize: 16
                    anchors.fill: parent
                    text: canvas3d.heading
                    validator: DoubleValidator{bottom: 0; top: 360;}
                }
            }
            Slider {
                id: headingSlider
                anchors.top: headingPos.bottom
                maximumValue: 360.0
                minimumValue: 0.0
                width: 200
                orientation: Qt.Horizontal
                value: canvas3d.heading
                onValueChanged: {
                    canvas3d.heading = headingSlider.value.toFixed(2)
                }
            }
        }

    }
    function selectRB(rb) {
        lineDrawMode.checked = false;
        surfaceDrawMode.checked = false;
        lessLineDrawMode.checked = false;
        rb.checked = true;
//        console.log(rb.text);
        canvas3d.drawMode = rb.text;
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
        // camera position
        property double cx: 12
        property double cy: 2
        property double cz: 3
//        property int gap: 10
        /* 只需要航向角和俯仰角即可确定传感器方向向量(默认向量长度为球体半径) */
        property double heading: 0
        property double pitch: 0
//        property double roll: 0
        property string drawMode: "line"
        property bool isRunning: true
        // 渲染节点就绪时，进行初始化时触发
        onInitializeGL: {
//            selectRB(lessLineDrawMode)
            selectRB(lineDrawMode)
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
