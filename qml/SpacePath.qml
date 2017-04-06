import QtQuick 2.0
import QtCanvas3D 1.1
import QtQuick.Controls 1.4

import "SpacePath.js" as GLcode

Item {
    id: windowContainer
    width: 1200
    height: 900
    visible: true

    MouseArea {
        id: mouseListener
        anchors.fill: parent
        property int lpx: 0
        property int lpy: 0
        property int mousex: 1
        property int mousey: 1
//        onClicked: {
//            console.log("clicked ==> " + mouseListener.mouseX + " ,  " + mouseListener.mouseY)
//        }
        onMouseXChanged: {
            if(mouseListener.pressed) {
//                console.log("clicked x ==> " + mouseListener.mouseX + " ,  " + mouseListener.mouseY + "  --> " + mouseListener.mousex++);
                mouseDraged();
                lpx = mouseListener.mouseX
            }
        }
        onMouseYChanged: {
            if(mouseListener.pressed) {
//                console.log("clicked y ==> " + mouseListener.mouseX + " ,  " + mouseListener.mouseY + "  --> " + mouseListener.mousey++);
                mouseDraged();
                lpy = mouseListener.mouseY;
            }
        }

//        onPressAndHold: {
//            console.log("pressed and hold ==> " + mouseListener.mouseX + " ,  " + mouseListener.mouseY)
//        }
        /** onPressed and onReleased 实现拖拽操作 */
        onPressed: {
//            console.log("pressed  ==> " + mouseListener.mouseX + " ,  " + mouseListener.mouseY)
            lpx = mouseListener.mouseX;
            lpy = mouseListener.mouseY;
        }
    }

    function mouseDraged() {
        var uoffset = (mouseListener.mouseY - mouseListener.lpy) / windowContainer.height;
        var voffset = (mouseListener.mouseX - mouseListener.lpx) / windowContainer.width;
        var u = canvas3d.ctheta;
        var v = canvas3d.cbeta;
//            console.log("released ==> " + uoffset + " ,  " + voffset);
        u += uoffset;
        v -= voffset;
        if( u < 0.001 ) {
            u = 0.001;
        } else if ( u > 0.999) {
            u = 0.999;
        }


        v = (v * 100) % 100 / 100;
//            console.log("released ==> " + u + " ,  " + v);
        cameraThetaContainer.sliderValue = u;
        cameraBetaContainer.sliderValue  = v;
        moveCamera();
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
        height: 350
        border.color: "blue"
        border.width: 1
        layer.enabled: true
        layer.smooth: true

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
        /*
        MySlider {
            id: xCameraContainer
            labelText: "X CAMARA POSITION: "
            height: 50
            width: 200
            anchors.left: parent.left
            anchors.top: parent.top
            sliderMaxValue: 30.0
            sliderMinValue: -30.0
            sliderValue: canvas3d.cx
            sliderWidth: 200
            onSliderValueChanged: {
                canvas3d.cx = xCameraContainer.sliderValue.toFixed(2)
            }
        }

        MySlider {
            id: yCameraContainer
            labelText: "Y CAMARA POSITION: "
            height: 50
            width: 200
            anchors.left: parent.left
            anchors.top: xCameraContainer.bottom
            sliderMaxValue: 30.0
            sliderMinValue: -30.0
            sliderValue: canvas3d.cy
            sliderWidth: 200
            onSliderValueChanged: {
                canvas3d.cy = yCameraContainer.sliderValue.toFixed(2)
            }
        }

        MySlider {
            id: zCameraContainer
            labelText: "Z CAMARA POSITION: "
            height: 50
            width: 200
            anchors.left: parent.left
            anchors.top: yCameraContainer.bottom
            sliderMaxValue: 30.0
            sliderMinValue: -30.0
            sliderValue: canvas3d.cz
            sliderWidth: 200
            onSliderValueChanged: {
                canvas3d.cz = zCameraContainer.sliderValue.toFixed(2)
            }
        }
        */

        MySlider {
            id: cameraThetaContainer
            labelText: "CAMARA THETA: "
            height: 50
            width: 200
            visible: false
            anchors.left: parent.left
            anchors.top: parent.top
            sliderMaxValue: 0.999
            sliderMinValue: 0.001
            sliderValue: canvas3d.ctheta
            sliderWidth: 200
            onSliderValueChanged: {
                canvas3d.ctheta = sliderValue.toFixed(3)
                moveCamera()
            }
        }



        MySlider {
            id: cameraBetaContainer
            labelText: "CAMARA BETA: "
            height: 50
            width: 200
            visible: false
            anchors.left: parent.left
            anchors.top: cameraThetaContainer.bottom
            sliderMaxValue: 0.999
            sliderMinValue: -0.999
            sliderValue: canvas3d.cbeta
            sliderWidth: 200
            onSliderValueChanged: {
                canvas3d.cbeta = sliderValue.toFixed(3)
                moveCamera()
            }
        }

        MySlider {
            id: ballRadiusContainer
            labelText: "BALL RADIUS: "
            height: 50
            width: 200
            anchors.left: parent.left
//            anchors.top: cameraBetaContainer.bottom
            anchors.top: parent.top
            sliderMaxValue: 10.0
            sliderMinValue: 2.0
            sliderValue: canvas3d.radius
            sliderWidth: 200
            onSliderValueChanged: {
                canvas3d.radius = sliderValue.toFixed(2)
//                console.log(canvas3d.radius)
            }
        }

        MySlider {
            id: cameraDisContainer
            labelText: "DISTANCE: "
            height: 50
            width: 200
            anchors.left: parent.left
            anchors.top: ballRadiusContainer.bottom
//            anchors.top: parent.top
            sliderMaxValue: 30.0
            sliderMinValue: -30.0
            sliderValue: canvas3d.cd
            sliderWidth: 200
            onSliderValueChanged: {
                canvas3d.cd = sliderValue.toFixed(2)
                moveCamera()
            }
        }

        MySlider {
            id: lineWidthContainer
            labelText: "LINE WIDTH: "
            height: 50
            width: 200
            anchors.left: parent.left
            anchors.top: cameraDisContainer.bottom
            sliderMaxValue: 10.0
            sliderMinValue: 1.0
            sliderValue: canvas3d.line_width
            sliderWidth: 200
            onSliderValueChanged: {
                canvas3d.line_width = sliderValue.toFixed(2)
            }
        }

        MySlider {
            id: pointSizeContainer
            labelText: "POINT SIZE: "
            height: 50
            width: 200
            anchors.left: parent.left
            anchors.top: lineWidthContainer.bottom
            sliderMaxValue: 1.5
            sliderMinValue: 0.15
            sliderValue: canvas3d.point_size
            sliderWidth: 200
            onSliderValueChanged: {
                canvas3d.point_size = sliderValue.toFixed(2)
            }
        }

        Rectangle {
            id: modeSelection
            anchors.top: pointSizeContainer.bottom
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

        MySlider {
            id: pitchContainer
            labelText: "PITCH: "
            height: 50
            width: 200
            anchors.left: parent.left
            anchors.top: modeSelection.bottom
            sliderMaxValue: 180
            sliderMinValue: -180
            sliderValue: canvas3d.pitch
            sliderWidth: 200
            onSliderValueChanged: {
                canvas3d.pitch = pitchContainer.sliderValue.toFixed(3)
            }
        }

        MySlider {
            id: headingContainer
            labelText: "HEADING: "
            height: 50
            width: 200
            anchors.top: pitchContainer.bottom
            anchors.left: parent.left
            sliderMaxValue: 360
            sliderMinValue: 0
            sliderValue: canvas3d.heading
            sliderWidth: 200
//            inputText: canvas3d.heading
            onSliderValueChanged: {
                canvas3d.heading = headingContainer.sliderValue.toFixed(3)
            }
        }

        Button {
            id: setButton
            width: 50
            height: 20
            text: "set"
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.horizontalCenterOffset: -50
            anchors.top: headingContainer.bottom
            onClicked: {
//                canvas3d.xRotAnim = parseFloat(xRotInput.text)
//                canvas3d.yRotAnim = parseFloat(yRotInput.text)
//                canvas3d.zRotAnim = parseFloat(zRotInput.text)

//                canvas3d.xPos = parseFloat(xPosInput.text)
//                canvas3d.yPos = parseFloat(yPosInput.text)
//                canvas3d.zPos = parseFloat(zPosInput.text)

//                canvas3d.cx = parseFloat(xCameraContainer.text)
//                canvas3d.cy = parseFloat(yCameraContainer.text)
//                canvas3d.cz = parseFloat(zCameraContainer.text)

//                xCameraContainer.sliderValue = canvas3d.cx
//                yCameraContainer.sliderValue = canvas3d.cy
//                zCameraContainer.sliderValue = canvas3d.cz

                pitchContainer.sliderValue = parseFloat(pitchContainer.text)
                headingContainer.sliderValue = parseFloat(headingContainer.text)
                cameraDisContainer.sliderValue = parseFloat(cameraDisContainer.text)
                ballRadiusContainer.sliderValue = parserFloat(ballRadiusContainer.text)
                lineWidthContainer.sliderValue = parseFloat(lineWidthContainer.text)
                pointSizeContainer.sliderValue = parseFloat(pointSizeContainer.text)
            }
        }

        Button {
            id: enablePathButton
            width: 70
            height: 20
            text: "Cancle Path"
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.horizontalCenterOffset: 20
            anchors.top: headingContainer.bottom
            onClicked: {
                if(canvas3d.enable_path) {
                    canvas3d.enable_path = false;
                    enablePathButton.text = "Draw Path"
                } else {
                    canvas3d.enable_path = true;
                    enablePathButton.text = "Cancle Path"
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

    function moveCamera() {
        var pos = GLcode.calcVertex(1-canvas3d.ctheta, canvas3d.cbeta, canvas3d.cd)
        canvas3d.cx = pos[0].toFixed(2)
        canvas3d.cy = pos[1].toFixed(2)
        canvas3d.cz = pos[2].toFixed(2)

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
        // distance between camera's position and origin position
        property double cd: 15
        property double ctheta: 0.5
        property double cbeta: 0.0
        property double cx: 15
        property double cy: 0.0
        property double cz: 0.0
//        property int gap: 10
        /* 只需要航向角和俯仰角即可确定传感器方向向量(默认向量长度为球体半径, 4) */
        property double heading: 0
        property double pitch: -89.3
        property double radius: 4
//        property double roll: 0
        property double vector_length: 4
        property bool enable_path: true
        property double line_width: 2.0
        property double point_size: 0.6
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

//        Keys.onSpacePressed: {
//            canvas3d.isRunning = !canvas3d.isRunning
//            if (canvas3d.isRunning) {
//                objAnimationX.pause();
//                objAnimationY.pause();
//                objAnimationZ.pause();
//            } else {
//                objAnimationX.resume();
//                objAnimationY.resume();
//                objAnimationZ.resume();
//            }
//        }

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
