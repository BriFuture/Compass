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

    ScrollView {
        id: controller
        width: 200
        height: parent.height
        z: 100
        visible : true
        frameVisible: true
        property int topmargin: 10
        anchors {
            top:  container.top
        }
        Rectangle {
            width: parent.width
            height: parent.height
            Item {
                id: cameraItem0
                width: parent.width
                implicitHeight: calcHeight(this, 2*controller.topmargin)
    //            on
                MySlider {
                    id: camTheta
                    anchors {
                        top: parent.top
                        topMargin: controller.topmargin
                    }

                    width: controller.width
                    text: "摄像机θ角："
                    maxValue: 180.0
                    minValue: 0.0
                    onValueChanged: {
                        argItem.cam_theta = this.value;
                        GLcode.rotateCamera();
                    }
                }

                MySlider {
                    id: camBeta
                    anchors {
                        top: camTheta.bottom
                        topMargin: controller.topmargin
                    }
                    width: controller.width
                    text: "摄像机β角："
                    maxValue: 180.0
                    minValue: -180.0
                    onValueChanged: {
                        argItem.cam_beta = this.value;
                        GLcode.rotateCamera();
                    }
                }

                MySlider {
                    id: camDis
                    anchors {
                        top: camBeta.bottom
                        topMargin: controller.topmargin
                    }
                    width: controller.width
                    text: "摄像机距原点："
                    maxValue: 30.0
                    minValue: 0.5
                    onValueChanged: GLcode.rotateCamera();
                }
            }

            Item {
                id: cameraItem1
                width: parent.width
                height: calcHeight(this, 2*controller.topmargin)
                visible: false

                MySlider {
                    id: cameraXPos
                    anchors {
                        top: cameraItem1.top
                        topMargin: controller.topmargin
                    }
                    enabled: false
                    width: controller.width
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
                    width: controller.width
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
                    width: controller.width
                    text: "摄像机Z："
                    maxValue: 30.0
                    minValue: -30.0
                }
            }

            Item {
                id: canvasSetting
                width: parent.width
    //            implicitHeight: ballRadius.height + lineWidth.height + pointSize.height + pathWidth.height + 4*controller.topmargin
                height: calcHeight(this)
                anchors {
                    top: cameraItem0.bottom
                    topMargin: controller.topmargin
                }

                MySlider {
                    id: ballRadius
                    anchors {
                        top: canvasSetting.top
                        topMargin: controller.topmargin
                    }
                    width: controller.width
                    text: "参考球半径："
                    maxValue: 30
                    minValue: 3
                }

                MySlider {
                    id: lineWidth
                    anchors {
                        top: ballRadius.bottom
                        topMargin: controller.topmargin
                    }
                    width: controller.width
                    text: "线宽："
                    maxValue: 10
                    minValue: 1
                    stepSize: 0.5
                }

                MySlider {
                    id: pointSize
                    anchors {
                        top: lineWidth.bottom
                        topMargin: controller.topmargin
                    }
                    width: controller.width
                    text: "指示器大小："
                    maxValue: 10
                    minValue: 1
                    stepSize: 0.2
                }

                MySlider {
                    id: pathWidth
                    anchors {
                        top: pointSize.bottom
                        topMargin: controller.topmargin
                    }
                    width: controller.width
                    text: "轨迹宽度："
                    maxValue: 50
                    minValue: 1
                    stepSize: 1.0
                }

                MySlider {
                    id: ballAlpha
                    anchors {
                        top: pathWidth.bottom
                        topMargin: controller.topmargin
                    }
                    width: controller.width
                    text:  "球面透明度"
                    maxValue: 1.0
                    minValue: 0.1
                }
            }

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
                    onClicked: GLcode.selectDrawMode(this)
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
                    onClicked: GLcode.selectDrawMode(this)
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
                    onClicked: GLcode.selectDrawMode(this)
                }

                RadioButton {
                    id: caliRB
                    anchors {
                        top: lineRB.bottom
                        left: lessLineRB.right
                        leftMargin: 50
                    }
                    width: 20
                    height: 20
                    text: "calibration"
                    onClicked: GLcode.selectDrawMode(this)
                }
            }

            Item {
                id: checkBoxItem
                width: parent.width
                property int bheight: 15
                height: 2 * bheight
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
                    id: pathModeBox
                    height: parent.bheight
                    text: "实线路径"
                    anchors {
                        left: pathEnableBox.right
                        leftMargin: 30
                    }
                    checked: argItem.path_real_line
                    onCheckedChanged: {
                        argItem.path_real_line = checked;
                    }
                }

                CheckBox {
                    id: cubeBox
                    height: parent.bheight
                    text: "绘制模拟器"
                    anchors {
                        top: pathEnableBox.bottom
                        topMargin: 5
                        left: parent.left
                        leftMargin: 15
                    }
                    checked: argItem.enable_cube
                    onCheckedChanged: {
                        argItem.enable_cube = checked;
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
                        left: pathModeBox.left
//                        leftMargin: 20
                    }
                    onCheckedChanged: {
                        cameraItem0.visible = checked;
                        cameraItem1.visible = !checked;
                    }
                }
            }

            Item {
                id: operateItem
                width: parent.width
                height: 50
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
//                        horizontalCenter: parent.horizontalCenter
    //                    horizontalCenterOffset: 20
                        top: parent.top
                        left: parent.left
                        leftMargin: 20
                    }
                    onClicked: {
                        argItem.cam_theta = 45
                        argItem.cam_beta  = 90

                        GLcode.rotateCamera();
                        GLcode.reset();
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
                        console.log("click reset path")
                        GLcode.sensorPath.resetAllPath();
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
                        GLcode.refCircle.record();
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
                        GLcode.refCircle.reset();
                    }
                }
            }

            Item {
            id: posItem
            anchors {
                top : operateItem.bottom
            }

            MySlider {
                id: pitch
                anchors {
                    top: parent.top
                    topMargin: controller.topmargin
                }
                width: controller.width
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
                width: controller.width
                text: "heading:"
                maxValue: 360
                minValue: 0
                value   : 0
            }
        }

        }
    }

    MouseArea {
        id: mouseListener
        anchors {
            fill: parent
        }
        property int lpx: 0
        property int lpy: 0
        property int mousex: 1
        property int mousey: 1
        onMouseXChanged: {
            if(mouseListener.pressed) {
                GLcode.mouseDraged();
                lpx = mouseListener.mouseX
            }
        }
        onMouseYChanged: {
            if(mouseListener.pressed) {
                GLcode.mouseDraged();
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
//            if( argItem.cam_dis < dis.minValue ) {
//                argItem.cam_dis = dis.minValue;
//            }
//            if( argItem.cam_dis > dis.maxValue ) {
//                argItem.cam_dis = dis.maxValue;
//            }
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
        property alias  cam_dis:     camDis.value
//        property alias  cam_theta:   camTheta.value
//        property alias  cam_beta:    camBeta.value
        property alias  cam_x:       cameraXPos.value
        property alias  cam_y:       cameraYPos.value
        property alias  cam_z:       cameraZPos.value
        property alias  ball_radius: ballRadius.value
        property alias  line_width:  lineWidth.value
        property alias  point_size:  pointSize.value
        property alias  path_width:  pathWidth.value
        property alias  ball_alpha:  ballAlpha.value
        /* 只需要航向角和俯仰角即可确定传感器方向向量(默认向量长度为球体半径, 4) */
        property alias  heading: heading.value
        property alias  pitch:   pitch.value
        property double cam_theta:   0.0
        property double cam_beta:    0.0
        property double roll: 0
        property double heading_offset: 0
        property double vector_length:  4
        property bool   enable_path:    false
        property bool   path_real_line: true
        property bool   enable_cube:    true
        property var    light_direction: [0.35, 0.35, 0.7]
        property string drawMode: "line"

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
            GLcode.initUI();
            GLcode.initializeGL(canvas3d);
        }

        // 当 canvas3d 准备好绘制下一帧时触发
        onPaintGL: {
            GLcode.paintGL(canvas3d, argItem);
        }

        onResizeGL: {
            GLcode.resizeGL(canvas3d)
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
        }
    }

    function recordAPoint() {
        GLcode.refCircle.record();
    }

    /**
      * this is for height calculating,
      * while children items would be initialized after parent,
      * it should be called after everything being ok
    **/
    function calcHeight(item) {
        var height = 0 ;
        for(var i = 0; i < item.children.length; i++) {
            height += item.children[i].height;
        }
//        console.log(item + "  " + height)
        return height + (item.children.length-1)* controller.topmargin;
    }


}
