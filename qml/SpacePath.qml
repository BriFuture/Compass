import QtQuick 2.0
import QtCanvas3D 1.1
import QtQuick.Controls 1.4

import "SpacePath.js" as GLcode

Item {
    id: container
    width: 1400
    height: 900
    visible: true

    Label {
        z: 1000
        anchors {
            top: parent.top
            right: parent.right
            rightMargin: 120
        }
        width: 30
        height: 20
        text: "FPS: " + canvas3d.fps
        font.pointSize: 20
        horizontalAlignment: Text.AlignLeft
        verticalAlignment: Text.AlignVCenter
    }


//        flickableItem: contentRect
    Rectangle {
        id:    controller
        z:     10
        anchors.top: parent.top
        property int topmargin: 10
        property bool show: true

        width: 215
        height: parent.height
        color: Qt.rgba(0.6, 0.6, 0.6, 0.5)

        Flickable {
            id: view
            width: 200
            height: parent.height
            contentWidth: 200
            contentHeight: calcHeight(this)
//            contentHeight: 1100

            Item {
                id: cameraItem
                width:  parent.width
                height: calcHeight(this)
                anchors.top: parent.top
                Item {
                    id: cameraItem0
                    width: parent.width
                    height: calcHeight(this)
        //            on
                    MySlider {
                        id: camTheta
                        anchors {
                            top: parent.top
                            topMargin: controller.topmargin
                        }

                        width: parent.width
                        text: "摄像机θ角："
                        maxValue: 180.0
                        minValue: 0.0
                        onValueChanged: {
                            argItem.cam_theta = this.value;
                            GLcode.rotateCamera(argItem);
                        }
                    }

                    MySlider {
                        id: camBeta
                        anchors {
                            top: camTheta.bottom
                            topMargin: controller.topmargin
                        }
                        width: parent.width
                        text: "摄像机β角："
                        maxValue: 180.0
                        minValue: -180.0
                        onValueChanged: {
                            argItem.cam_beta = this.value;
                            GLcode.rotateCamera(argItem);
                        }
                    }

                    MySlider {
                        id: camDis
                        anchors {
                            top: camBeta.bottom
                            topMargin: controller.topmargin
                        }
                        width: parent.width
                        text: "摄像机距原点："
                        maxValue: 30.0
                        minValue: 0.5
                        onValueChanged: GLcode.rotateCamera(argItem);
                    }
                }  // cameraItem 0

                Item {
                    id: cameraItem1
                    width: parent.width
                    height: calcHeight(this)
                    visible: false

                    MySlider {
                        id: cameraXPos
                        anchors {
                            top: cameraItem1.top
                            topMargin: controller.topmargin
                        }
                        enabled: false
                        width: parent.width
                        text: "摄像机X："
                        maxValue: 30.0
                        minValue: -30.0
                    }

                    MySlider {
                        id: cameraYPos
                        anchors {
                            top: cameraXPos.bottom
                            topMargin: controller.topmargin
                        }
                        enabled: false
                        width: parent.width
                        text: "摄像机Y："
                        maxValue: 30.0
                        minValue: -30.0
                    }

                    MySlider {
                        id: cameraZPos
                        anchors {
                            top: cameraYPos.bottom
                            topMargin: controller.topmargin
                        }
                        enabled: false
                        width: parent.width
                        text: "摄像机Z："
                        maxValue: 30.0
                        minValue: -30.0
                    }
                }  // cameraItem 1
            }   // cameraItem

            Item {
                id: canvasSetting
                width: parent.width
                height: calcHeight(this)
                anchors {
                    top: cameraItem.bottom
                    topMargin: controller.topmargin
                }

                MySlider {
                    id: ballRadius
                    anchors {
                        top: canvasSetting.top
                        topMargin: controller.topmargin
                    }
                    width: parent.width
                    text: "参考球半径："
                    maxValue: 15
                    minValue: 0.5
                    btnSize: 0.5
                }

                MySlider {
                    id: ballAlpha
                    anchors {
                        top: ballRadius.bottom
                        topMargin: controller.topmargin
                    }
                    width: parent.width
                    text:  "球面透明度"
                    maxValue: 1.0
                    minValue: 0.1
                    btnSize: 0.1
                }

                MySlider {
                    id: pointSize
                    anchors {
                        top: ballAlpha.bottom
                        topMargin: controller.topmargin
                    }
                    width: parent.width
                    text: "指示器大小："
                    maxValue: 1
                    minValue: 0.1
                    btnSize: 0.1
                }

                MySlider {
                    id: pathWidth
                    anchors {
                        top: pointSize.bottom
                        topMargin: controller.topmargin
                    }
                    width: parent.width
                    text: "轨迹宽度："
                    maxValue: 50
                    minValue: 1
                    stepSize: 1.0
                }

                MySlider {
                    id: path_gap
                    anchors {
                        top: pathWidth.bottom
                        topMargin: controller.topmargin
                    }
                    width: parent.width
                    text: "路径间隔："
                    maxValue: 10
                    minValue: 1
                    stepSize: 1.0
                }

                MySlider {
                    id: circle_size
                    anchors {
                        top: path_gap.bottom
                        topMargin: controller.topmargin
                    }
                    width: parent.width
                    text: "参考圆圈大小："
                    value: 0.3
                    maxValue: 1
                    minValue: 0.1
                    btnSize: 0.1
                }
            }  // canvasSetting

            Item {
                id: drawMode
                width: parent.width
                height: 40
                anchors {
                    top: canvasSetting.bottom
                    topMargin: 15
                }

                RadioButton {
                    id: lineRB
                    anchors {
                        top: parent.top
                        left: parent.left
                        leftMargin: 15
                    }
                    width: 20
                    height: 20
                    text: "line"
                    onClicked: selectDrawMode(this)
                }

                RadioButton {
                    id: surfaceRB
                    anchors {
                        top: parent.top
                        left: lineRB.right
                        leftMargin: 50
                    }
                    width: 20
                    height: 20
                    text: "surface"
                    onClicked: selectDrawMode(this)
                }

                RadioButton {
                    id: lessLineRB
                    anchors {
                        top: lineRB.bottom
                        left: parent.left
                        leftMargin: 15
                    }
                    width: 20
                    height: 20
                    text: "lessLine"
                    onClicked: selectDrawMode(this)
                }

            }   // drawMode

            Item {
                id: checkBoxItem
                width: parent.width
                property int bheight: 15
                height: calcHeight(this) * 0.5
                anchors {
                    top: drawMode.bottom
                    topMargin: 5
                    left: parent.left
                }

                CheckBox {
                    id: pathEnableBox
                    height: parent.bheight
                    text  : "绘制路径"
                    anchors {
                        left: parent.left
                        leftMargin: 15
                    }
                    checked: argItem.enable_path
                    onCheckedChanged: {
    //                    clickCheckBox(this, checked)
                        argItem.enable_path = checked;
                    }
                }

                CheckBox {
                    id: simBox
                    height: parent.bheight
                    text: "绘制模拟器"
                    anchors {
                        left: pathEnableBox.right
                        leftMargin: 15
                    }
                    checked: argItem.enable_sim
                    onCheckedChanged: {
                        argItem.enable_sim = checked;
                    }
                }

                CheckBox {
                    id: axisBox
                    height: parent.bheight
                    text: "球坐标系"
                    checked: true

                    anchors {
                        top: pathEnableBox.bottom
                        topMargin: 5
                        left: parent.left
                        leftMargin: 15
                    }
                    onCheckedChanged: {
                        cameraItem0.visible = checked;
                        cameraItem1.visible = !checked;
                    }
                }

                CheckBox {
                    id: calibrationBox
                    height: parent.bheight
                    text: "显示修正圆圈"
                    checked: true

                    anchors {
                        top: pathEnableBox.bottom
                        topMargin: 5
                        left: axisBox.right
                        leftMargin: 15
                    }
                    onCheckedChanged: {
                        argItem.calibration = checked;
                    }
                }
            }  // checkBoxItem

            Item {
                id: operateItem
                width: parent.width
                height: calcHeight(this) * 0.5
                anchors {
                    top: checkBoxItem.bottom
                    topMargin: 10
                    left: parent.left
                }

                Button {
                    id: resetCameraBtn
                    width: 70
                    height: 20
                    text: "重置摄像机"
                    anchors {
                        top: parent.top
                        left: parent.left
                        leftMargin: 20
                    }
                    onClicked: {
                        argItem.cam_theta = 45
                        argItem.cam_beta  = 90

                        GLcode.rotateCamera(argItem);
                        GLcode.reset(argItem);
                    }
                }

                Button {
                    id: resetPathBtn
                    width: 70
                    height: 20
                    text: "重置路径"
                    anchors {
    //                        horizontalCenter: parent.horizontalCenter
    //                    horizontalCenterOffset: 20
                        top: parent.top
                        left: resetCameraBtn.right
                        leftMargin: 5
                    }
                    onClicked: {
                        console.log("[Info] reset all path")
                        GLcode.resetAllPath();
                    }
                }

                Button {
                    id: recordBtn
                    width: 60
                    height: 20
                    text: "打点"
                    anchors{
                        top: resetCameraBtn.bottom
                        topMargin: 5
                        left: parent.left
                        leftMargin: 20
                    }
                    onClicked: {
                        GLcode.recordPoint();
                    }
                }

                Button {
                    id: resetRecordButton
                    width: 60
                    height: 20
                    text: "重置打点"
                    anchors {
                        topMargin: 5
                        top: resetCameraBtn.bottom
                        left: recordBtn.right
                        leftMargin: 20
                    }
                    onClicked: {
                        GLcode.resetRecord();
                    }
                }
            }  // operateItem

            Item {
                id: posItem
                width: parent.width
                height: calcHeight(this)
                anchors {
                    top : operateItem.bottom
                }

                MySlider {
                    id: pitch
                    anchors {
                        top: parent.top
                        topMargin: controller.topmargin
                    }
                    width: parent.width
                    text: "pitch："
                    maxValue: 90
                    minValue: -90
        //                value   : 0
                }

                MySlider {
                    id: heading
                    anchors {
                        top: pitch.bottom
                        topMargin: controller.topmargin
                    }
                    width: parent.width
                    text: "heading:"
                    maxValue: 180
                    minValue: -180
                    value   : 0
                }

                MySlider {
                    id: roll
                    anchors {
                        top: heading.bottom
                        topMargin: controller.topmargin
                    }
                    width: parent.width
                    text: "heading:"
                    maxValue: 180
                    minValue: -180
                    value   : 0
                }
            }  // posItem

            Item {
                id: colorPanel

            }

            // Only show the scrollbars when the view is moving.
            states: State {
                name: "ShowBars"
                when: view.movingVertically
                PropertyChanges { target: verticalScrollBar; opacity: 1 }
            }

            transitions: Transition {
                NumberAnimation { properties: "opacity"; duration: 1000 }
            }
        }

        ScrollBar {
            id: verticalScrollBar
            width: 10; height: view.height-3
            anchors.right: controller.right
            opacity: 0.1
            orientation: Qt.Vertical
            position: view.visibleArea.yPosition
            pageSize: view.visibleArea.heightRatio
        }
        Button {
            id: controlBtn
            width: 18
            height: 18
            text: "<"
            Image {
                id: arrowBtnImg
                source: "qrc:/img/arrow.png"
                width:  parent.width
                height: parent.height
            }
            anchors {
                verticalCenter: parent.verticalCenter
                horizontalCenter: parent.right
            }

            onClicked: {
                if( controller.show ) {
//                    controller.x -= controller.width;
//                    controller_hide.running = true
                    controller_hide.start();
                    arrowBtnImg.rotation = 180
                    text = ">";
                } else {
                    controller_show.start();
                    text = "<";
                    arrowBtnImg.rotation = 0
                }
                controller.show = !controller.show;
            }
        }

        NumberAnimation {
            id:      controller_show
            running: false
            target:  controller
            properties: "x";
            from: -controller.width+controlBtn.width*0.5
            to: 0
            duration: 2500
            easing.type: Easing.OutQuad
        }
        NumberAnimation {
            id:      controller_hide
            running: false
            target:  controller
            properties: "x";
            from: 0;
            to: -controller.width+controlBtn.width*0.5
            duration: 2500
            easing.type: Easing.OutQuad
        }
    }

    MouseArea {
        id: mouseListener
        anchors {
            top: parent.top
            left:controller.right
            right: parent.right
            bottom: parent.bottom
        }
        property int lpx: 0
        property int lpy: 0
        property int mousex: 1
        property int mousey: 1
        onMouseXChanged: {
            if(mouseListener.pressed) {
                GLcode.mouseDraged(argItem, this, container);
                lpx = mouseListener.mouseX
            }
        }
        onMouseYChanged: {
            if(mouseListener.pressed) {
                GLcode.mouseDraged(argItem, this, container);
                lpy = mouseListener.mouseY;
            }
        }
        /** onPressed and onReleased 实现拖拽操作 */
        onPressed: {
//            console.log("pressed  ==> " + mouseListener.mouseX + " ,  " + mouseListener.mouseY)
            lpx = mouseListener.mouseX;
            lpy = mouseListener.mouseY;
        }

        onWheel: {
            argItem.cam_dis -= wheel.angleDelta.y / 120;
//
        }

        onDoubleClicked: {
            recordAPoint();
        }
    }

    /**
      * this item is just used for reserved variables
    **/
    Item {
        id: argItem
        property alias  cam_dis:      camDis.value
//        property alias  cam_theta:   camTheta.value
//        property alias  cam_beta:    camBeta.value
        property alias  cam_x:        cameraXPos.value
        property alias  cam_y:        cameraYPos.value
        property alias  cam_z:        cameraZPos.value
        property alias  ball_radius:  ballRadius.value
        property alias  point_size:   pointSize.value
        property alias  path_width:   pathWidth.value
        property alias  path_gap:     path_gap.value
        property alias  ball_alpha:   ballAlpha.value
        property alias  circle_size:  circle_size.value
        property alias  calibration:  calibrationBox.checked
        property alias  enable_path:  pathEnableBox.checked
        property bool   enable_sim:   simBox.checked
        /* 只需要航向角和俯仰角即可确定传感器方向向量(默认向量长度为球体半径, 4) */
        property alias  heading:      heading.value
        property alias  pitch:        pitch.value
        property alias  roll:         roll.value
        property double cam_theta:    0.0
        property double cam_beta:     0.0
//        property double roll:         0.0
        property double heading_offset: 0.0
        property double vector_length:  4
        property var    light_direction: [0.35, 0.35, 0.7]
        property bool   sensor_radial:  true
        property string draw_mode:      "line"

        onCam_thetaChanged: {
            camTheta.value = this.cam_theta
        }
        onCam_betaChanged: {
            camBeta.value  = this.cam_beta
        }
    }

    Canvas3D {
        id: canvas3d
        anchors.fill: parent
        focus: true

        /* 只需要航向角和俯仰角即可确定传感器方向向量(默认向量长度为球体半径, 4) */
        // 渲染节点就绪时，进行初始化时触发
        onInitializeGL: {
            GLcode.initUI(argItem);
            GLcode.onInitializeGL(canvas3d, argItem);
        }

        // 当 canvas3d 准备好绘制下一帧时触发
        onPaintGL: {
            GLcode.onPaintGL(canvas3d, argItem);
        }

        onResizeGL: {
            GLcode.onResizeGL(canvas3d)
        }
    }

    Timer {
        id: updateArgumentsTimer
        running: true
        repeat: true
        interval: 1000/60
        onTriggered: {
//            argItem.heading = dataSource.getHeading();
//            argItem.pitch   = dataSource.getPitch();
//            argItem.roll    = dataSource.getRoll();
//            argItem.vector_length = dataSource.getMagicVectorLength() !== 0 ? dataSource.getMagicVectorLength()/10000 : 4;
        }
    }

    Connections {
        target: windowContainer
        onVisibleChanged : {
            updateArgumentsTimer.running = windowContainer.visible;
            console.log("[Info] SpacePath.qml visible changed: " + windowContainer.visible);
        }
    }

    function recordAPoint() {
        GLcode.record(argItem);
    }

    /**
      * this is for height calculating,
      * while children items would be initialized after parent,
      * it should be called after everything being ok
    **/
    function calcHeight(item) {
        var height = 0 ;
//        console.log( all )
        for(var i = 0; i < item.children.length; i++) {
            if( item.children[i].visible ) {
                height += item.children[i].height;
            }
        }
//        console.log(item + "  " + height)
        return height + (item.children.length-1)* controller.topmargin;
    }

    function selectDrawMode(mode) {
        for(var cbi in drawMode.children) {
            drawMode.children[cbi].checked = false;
        }

        mode.checked      = true;
        ballAlpha.enabled = ( mode !== lineRB);
        argItem.draw_mode  = mode.text;

    }

}
