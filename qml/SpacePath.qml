import QtQuick 2.0
import QtCanvas3D 1.1
import QtQuick.Controls 2.0

import "SpacePath.js" as GLcode

Item {
    signal pointRecord

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
        property int margintop: 10
        property int marginleft: 30
        property bool show: true

        width: 215
        height: parent.height
        color: Qt.rgba(0.68, 0.68, 0.68, 0.5)

        Flickable {
            id: view
            width: parent.width-8
            height: parent.height
            contentWidth:  parent.width-8
            contentHeight: container.height
            property bool ready : false
            property bool started: false
            property bool spacePath: false

            Rectangle {
                id: cameraItem
                color: controller.color
                border.color: Qt.rgba(0.68, 0.68, 0.68, 1)
                border.width: 2
                width:  parent.width
                height: childrenRect.height
                anchors {
                    top: parent.top
                    topMargin: controller.margintop * 0.5
                    left: parent.left
                }

                Item {
                    id: cameraItem0
                    width: parent.width
                    height: childrenRect.height

                    MySlider {
                        id: camTheta
                        objectName: "cam_theta"
                        anchors.top: parent.top
                        width: parent.width
                        text: "摄像机θ角："
                        maxValue: 180.0
                        minValue: 0.0
                        value: 70
                        onValueChanged: {
                            onCameraRotate()
                        }
                    }

                    MySlider {
                        id: camBeta
                        objectName: "cam_beta"
                        anchors.top: camTheta.bottom
                        width: parent.width
                        text: "摄像机β角："
                        maxValue: 180.0
                        minValue: -180.0
                        value: 50
                        onValueChanged: {
                            onCameraRotate()
                        }

                    }

                    MySlider {
                        id: camDis
                        objectName: "cam_dis"
                        anchors.top: camBeta.bottom
                        width: parent.width
                        text: "摄像机距原点："
                        maxValue: 100.0
                        minValue: 5
                        value: 18.0
                        onValueChanged: {
                            onCameraRotate()
                        }
                    }
                }  // cameraItem 0

                Item {
                    id: cameraItem1
                    width: parent.width
                    height: childrenRect.height
                    visible: false

                    MySlider {
                        id: cameraXPos
                        anchors.top: cameraItem1.top
                        enabled: false
                        width: parent.width
                        text: "摄像机X："
                        maxValue: 150.0
                        minValue: -150.0
                    }

                    MySlider {
                        id: cameraYPos
                        anchors.top: cameraXPos.bottom
                        enabled: false
                        width: parent.width
                        text: "摄像机Y："
                        maxValue: 150.0
                        minValue: -150.0
                    }

                    MySlider {
                        id: cameraZPos
                        anchors.top: cameraYPos.bottom
                        enabled: false
                        width: parent.width
                        text: "摄像机Z："
                        maxValue: 150.0
                        minValue: -150.0
                    }
                }  // cameraItem 1
            }   // cameraItem

            Rectangle {
                id: canvasSetting
                color: controller.color
                border.color: Qt.rgba(0.68, 0.68, 0.68, 1)
                border.width: 2
                width: parent.width
                height: childrenRect.height
                anchors {
                    top: cameraItem.bottom
                    topMargin: controller.margintop
                    left: parent.left
                }

                MySlider {
                    id: ballRadius
                    anchors.top: canvasSetting.top
                    width: parent.width
                    text: "参考球半径："
                    maxValue: 80000
                    minValue: 10000
                    value: 40000
                    stepSize: 1000
//                    decimal: 4
                    onValueChanged: {
                        if( view.ready ) {
                            GLcode.sphere.setSize( getValue() / 10000 );
                        }
                        if( GLcode.refCircle ) {
                            GLcode.refCircle.setDis( getValue() / 10000 );
                        }
                    }
                }

                MySlider {
                    id: ballAlpha
                    anchors.top: ballRadius.bottom
                    width: parent.width
                    text:  "球面透明度"
                    maxValue: 100
                    minValue: 1
                    value: 25
                    stepSize: 5
                    decimal: 2
                    onValueChanged: {
                        if( view.ready ) {
                            GLcode.sphere.alpha = getValue();
                        }
                    }
                }

                MySlider {
                    id: pointSize
                    anchors.top: ballAlpha.bottom
                    width: parent.width
                    text: "指示器大小："
                    maxValue: 100
                    minValue: 1
                    value: 10
                    decimal: 2

                    onValueChanged: {
                        if( view.ready ) {
                            GLcode.sensorPoint.setScale( getValue() );
                        }
                    }
                }

                MySlider {
                    id: pathWidth
                    anchors.top: pointSize.bottom
                    width: parent.width
                    text: "轨迹宽度："
                    maxValue: 50
                    minValue: 1
                    value: 3
                    decimal: 1
                    enabled: pathEnableBox.checked

                    onValueChanged: {
                        if( view.ready ) {
                            GLcode.sensorPath.setSize( getValue() );
                        }
                    }
                }

//                MySlider {
//                    id: pathGap
//                    anchors.top: pathWidth.bottom
//                    width: parent.width
//                    text: "路径间隔："
//                    maxValue: 2
//                    minValue: 1
//                    value: 1
//                    enabled:  pathEnableBox.checked
//                    onValueChanged: {
//                        if( view.ready ) {
//                            GLcode.sensorPath.setGap( value );
//                        }
//                    }
//                }

//                MySlider {
//                    id: circleSize
//                    anchors.top: pathGap.bottom
//                    width: parent.width
//                    text: "参考圆圈大小："
//                    maxValue: 100
//                    minValue: 1
//                    value: 50
//                    stepSize: 5
//                    decimal : 2
//                    enabled:  calibrationBox.checked
//                    onValueChanged: {
//                        if( GLcode.refCircle !== undefined ) {
//                            GLcode.refCircle.setScale( getValue() );
//                        }
//                    }
//                }

                MySlider {
                    id: craftSize
                    anchors.top: pathWidth.bottom
                    width: parent.width
                    text: "模拟器大小:"
                    maxValue: 100
                    minValue: 1
                    value   : 60
                    decimal : 2
                    enabled : simBox.checked
                    onValueChanged: {
                        if( GLcode.craft !== undefined ) {
                            GLcode.craft.setScale( getValue() );
                        }
                    }

                }
            }  // canvasSetting

            Rectangle {
                id: drawMode
                color: controller.color
                border.color: Qt.rgba(0.68, 0.68, 0.68, 1)
                border.width: 2
                width: parent.width
                height: childrenRect.height
                anchors {
                    top: canvasSetting.bottom
                    topMargin: controller.margintop
                    left: parent.left
                }
//                ExclusiveGroup {
//                    id: drawModeGroup
//                }

                RadioButton {
                    id: lineRB
                    anchors {
                        top: parent.top
                        left: parent.left
                        leftMargin: controller.marginleft
                    }

//                    checkable: true
                    text: "line"
//                    exclusiveGroup: drawModeGroup
                    onClicked: {
                        GLcode.sphere.drawMode = GLcode.Ball.MODE_LINE;
                    }
                }

                RadioButton {
                    id: surfaceRB
                    anchors {
                        top: lineRB.bottom
                        left: parent.left
                        leftMargin: controller.marginleft
                    }

                    text: "surface"
                    checked:  true
//                    checkable: true
//                    exclusiveGroup: drawModeGroup
                    onClicked: {
                        GLcode.sphere.drawMode = GLcode.Ball.MODE_SURFACE;
                    }
                }

                RadioButton {
                    id: lessLineRB
                    anchors {
                        top: surfaceRB.bottom
                        left: parent.left
                        leftMargin: controller.marginleft
                    }
                    text: "lessLine"

//                    checkable: true
//                    exclusiveGroup: drawModeGroup
                    onClicked: {
                        GLcode.sphere.drawMode = GLcode.Ball.MODE_LESSLINE;
                    }
                }

            }   // drawMode

            Rectangle {
                id: checkBoxItem
                color: controller.color
                border.color: Qt.rgba(0.68, 0.68, 0.68, 1)
                border.width: 2
                width: parent.width
                property int bheight: 25
                height: childrenRect.height
                anchors {
                    top: drawMode.bottom
                    topMargin: controller.margintop
                    left: parent.left
                }

                CheckBox {
                    id: pathEnableBox
                    text  : "绘制路径"

                    anchors {
                        top: parent.top
                        left: parent.left
                        leftMargin: controller.marginleft
                    }
                    checked: true
                    onCheckedChanged: {
                        GLcode.sensorPath.visible = checked;
                        pathWidth.enabled   = checked;
                    }
                }

                CheckBox {
                    id: simBox
                    text: "绘制模拟器"

                    anchors {
                        top: pathEnableBox.bottom
                        left: parent.left
                        topMargin: 5
                        leftMargin: controller.marginleft
                    }
                    checked: false
                    onCheckedChanged: {
                        // on windows platform, read craft.obj file will cost a lot
                        // of time, in case of re-add craft, set enabled to false
                        enabled = false;
                        GLcode.addCraft( { size: craftSize.getValue() });
                        enabled = true;
                        if( GLcode.craft ) {
                            GLcode.craft.visible = checked;
                        }
                    }
                }

                CheckBox {
                    id: axisBox
                    text: "球坐标系"
                    checked: true

                    anchors {
                        top: simBox.bottom
                        topMargin: 5
                        left: parent.left
                        leftMargin: controller.marginleft
                    }
                    onCheckedChanged: {
                        cameraItem0.visible = checked;
                        cameraItem1.visible = !checked;
                    }
                }

                CheckBox {
                    id: calibrationBox
                    text: "显示修正圆圈"
                    checked: false

                    anchors {
                        top: axisBox.bottom
                        topMargin: 5
                        left: parent.left
                        leftMargin: controller.marginleft
                    }
                    onCheckedChanged: {
//                        argItem.calibration = checked;
                        GLcode.addRefCircle( { size: pointSize.getValue() * 0.9 } );
                        GLcode.refCircle.visible = checked;
                        GLcode.recordPoint.visible = checked;

                    }
                }
            }  // checkBoxItem

            Rectangle {
                id: operateItem
                color: controller.color
                border.color: Qt.rgba(0.68, 0.68, 0.68, 1)
                border.width: 2
                width: parent.width
                height: childrenRect.height + controller.margintop
                anchors {
                    top: checkBoxItem.bottom
                    topMargin: controller.margintop
                    left: parent.left
                }

                Button {
                    id: resetCameraBtn
                    width: 100
                    height: 20
                    text: "重置摄像机"
                    anchors {
                        top: parent.top
                        topMargin: 3
                        left: parent.left
                        leftMargin: controller.marginleft
                    }
                    onClicked: resetCamera()
                }

                Button {
                    id: resetPathBtn
                    width: 100
                    height: 20
                    text: "重置轨迹"
                    anchors {
                        top: resetCameraBtn.bottom
                        topMargin: 5
                        left: parent.left
                        leftMargin: controller.marginleft
                    }
                    onClicked: {
                        console.log("[Info] Reset all path.")
                        GLcode.sensorPath.resetAllPath();
                    }
                }

                Button {
                    id: recordBtn
                    width: 100
                    height: 20
                    text: "打点"
                    anchors{
                        top: resetPathBtn.bottom
                        topMargin: 5
                        left: parent.left
                        leftMargin: controller.marginleft
                    }
                    onClicked: {
                        recordAPoint();
                    }
                }

                Button {
                    id: resetRecordButton
                    width: 100
                    height: 20
                    text: "重置打点"
                    anchors {
                        top: recordBtn.bottom
                        topMargin: 5
                        left: parent.left
                        leftMargin: controller.marginleft
                    }
                    onClicked: {
                        GLcode.recordPoint.reset();
                    }
                }
            }  // end of operateItem

            Rectangle {
                id: posItem
                color: controller.color
                border.color: Qt.rgba(0.68, 0.68, 0.68, 1)
                border.width: 2
                width: parent.width
                height: childrenRect.height
                anchors {
                    top : operateItem.bottom
                    topMargin: controller.margintop
                    left: parent.left
                }
                property var posChanged: function() {

                    if( view.ready ) {
                        GLcode.sensorPoint.setParam( {  dis:   4,
                                                        pitch: pitch.value,
                                                        heading: heading.value,
                                                        roll: roll.value } );
                    }
                }

                Text {
                    id: pitchHint
                    anchors.top: parent.top
                    width: parent.width
                    text: "pitch: "
                    font.family: "Helvetica"
                    font.pointSize: 18
                }
                Text {
                    id: pitch
                    anchors {
                        right: parent.right
                        top: parent.top
                    }
                    font.family: "Helvetica"
                    font.pointSize: 24
                    color: "red"
                    width: parent.width / 2
                    text: "0.0"
                }

                Text {
                    id: headingHint
                    anchors.top: pitch.bottom
                    width: parent.width
                    text: "heading: "
                    font.family: "Helvetica"
                    font.pointSize: 18
                }
                Text {
                    id: heading
                    anchors {
                        right: parent.right
                        top: pitch.bottom
                    }
                    font.family: "Helvetica"
                    font.pointSize: 24
                    color: "red"
                    width: parent.width / 2
                    text: "0.0"
                }

                Text {
                    id: rollHint
                    anchors.top: heading.bottom
                    width: parent.width
                    text: "roll:"
                    font.family: "Helvetica"
                    font.pointSize: 18
                }
                Text {
                    id: roll
                    anchors {
                        right: parent.right
                        top: heading.bottom
                    }
                    font.family: "Helvetica"
                    font.pointSize: 24
                    color: "red"
                    width: parent.width / 2
                    text: "0.0"
                }

            }  // posItem


            // Only show the scrollbars when the view is moving.
            states: State {
                name: "ShowBars"
                when: view.movingVertically
                PropertyChanges { target: verticalScrollBar;
                    opacity: 1
                }
                Component.onCompleted: {
                    view.contentHeight = calcHeight( view.contentItem );  // use contentItem to set contentHeight
                }
            }

            transitions: Transition {
                NumberAnimation { properties: "opacity"; duration: 1000 }
            }

            ScrollBar.vertical: ScrollBar {
                id: verticalScrollBar
                parent: view.parent
                width: 10
                height: view.height-3
                opacity: 0.3
//                orientation: Qt.Vertical
//                anchors.right: controller.right
//                position: view.visibleArea.yPosition
    //            pageSize: view.visibleArea.heightRatio
            }
        }

        Button {
            id: controlBtn
            width: 18
            height: 18
            text: "<"
            Image {
                id: arrowBtnImg
                source: "qrc:/res/img/arrow.png"
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
            if( pressed ) {
                var xoffset = (mouseX - lpx) * 2 * 360 / width;
                var dbeta       = 540 + camBeta.value - xoffset; // - indicates that drag direction is oppsite with movement
                camBeta.value   = dbeta % 360 - 180;
                onCameraRotate();
                lpx = mouseX;
            }
        }
        onMouseYChanged: {
            if( pressed ) {
                var yoffset = (mouseY - lpy) * 4 * 180 / height;
                camTheta.value -= yoffset;
                onCameraRotate();
                lpy = mouseY;
            }
        }
        /** onPressed and onReleased 实现拖拽操作 */
        onPressed: {
//            console.log("pressed  ==> " + mouseListener.mouseX + " ,  " + mouseListener.mouseY)
            lpx = mouseX;
            lpy = mouseY;
        }

        onWheel: {
            camDis.value -= wheel.angleDelta.y / 120;
        }

        onDoubleClicked: {
            recordAPoint();
        }
    }

    Canvas3D {
        id: canvas3d
        anchors.fill: parent
        focus: true
//        renderOnDemand: true
//        property var  callbacks : []
//        property var  addCallback: function( callback, type ) {
//            if( callbacks[type] === undefined ) {
//                callbacks[type] = [];
//            }
//            callbacks[type].push( callback );
//        }
//        property var onCall: function( type, params ) {
//            if( callbacks[type] === undefined ) {
//                return;
//            }
//            for( var i = 0; i < callbacks[type].length; i++ ) {
//                callbacks[type][i](params);
//            }
//        }

        // 渲染节点就绪时，进行初始化时触发
        onInitializeGL: {
            GLcode.initializeGL(canvas3d);
            view.ready = true;
            onCameraRotate();
//            simBox.checked = true;

        }

        // 当 canvas3d 准备好绘制下一帧时触发
        onPaintGL: {
            GLcode.paintGL(canvas3d);
        }

        onResizeGL: {
            GLcode.resizeGL(canvas3d)
        }
    }

    Connections {
        target: dataSource
        onDataChanged: {
//            console.log("dataSource heading changed:  " + dataSource.getHeading() + view.ready);
            pitch.text   = dataSource.getPitch();
            heading.text = dataSource.getHeading();
            roll.text    = dataSource.getRoll();

            if( view.ready ) {
                var dis = dataSource.getLength()/10000;
                if( view.spacePath ) {
                    dis = ballRadius.value / 10000;
                }

                GLcode.sensorPoint.setParam( {
                    dis:     dis,
                    pitch:   dataSource.getPitch(),
                    heading: dataSource.getHeading(),
                    roll:    dataSource.getRoll()
                } );
                if(!view.started) {
                    view.started = true;
                    resetCamera();
                }
            }
        }

    }

    Connections {
        target: window

        onStateChanged: {
            canvas3d.renderOnDemand = !render;
//            if( window.visibility == window.Hidden || window.visibility == window.Minimized ) {
//                // it can decrease resource consuming when not minimized or hidden
//                console.log("[Info] windos state changed:  now hidden or minimized");
//                canvas3d.renderOnDemand = true;
//            } else {
////                console.log("[Info] windos state changed:  now visible");
//                canvas3d.renderOnDemand = false;
//            }
        }
        onRemoveRecordPoint: {
            console.log(iSet)
            GLcode.recordPoint.remove( iSet );
        }
        onToRecord: {
            if( isCSource ) {
                GLcode.recordPoint.record();
            }
        }
        onThreeDPropertyChanged: {
            view.spacePath = spacePath;
        }
    }

    Timer {
        id: garbageCollect
        interval: 5000
        running: true
        repeat: true
        onTriggered: {
            GLcode.gc();
        }
    }

    Timer {
        interval: 2000
        running: true
        repeat: false
        onTriggered: {
            simBox.checked = true;
        }
    }

    // this function is called by C++ layer and connects JS layer
    function recordAPoint() {
//        pointRecord()
        window.toRecord();
        GLcode.recordPoint.record();
    }

    /**
      * this is for height calculating,
      * while children items would be initialized after parent,
      * it should be called after everything being ok
    **/
    function calcHeight(item, margin) {
        var height  = 0;
        var clength = 0;
        for(var i = 0; i < item.children.length; i++) {
            if( item.children[i].visible ) {
                height += item.children[i].height;
                clength ++;
            }
        }

        if( margin === undefined ) {
            margin = controller.margintop;
        }

        return height + clength * margin;
    }

    function onCameraRotate() {
        if( !view.ready ) {
            return;
        }

        GLcode.camera.rotate( camTheta.getValue(), camBeta.getValue(), camDis.getValue() );
        cameraXPos.value = GLcode.camera.pos[0];
        cameraYPos.value = GLcode.camera.pos[1];
        cameraZPos.value = GLcode.camera.pos[2];
    }

    function resetCamera() {
        var p ;
        if( calibrationBox.checked ) {
            p = { theta: 90 - GLcode.sensorPoint.pitch, phi: 0 };
        }
        else {
            p = { theta: 45, phi: 180 };
        }
        GLcode.sensorPoint.reset();
        GLcode.sensorPath.resetAllPath();
        camTheta.value = p.theta;
        camBeta.value  = p.phi;
        onCameraRotate()
        GLcode.camera.reset(p);
    }

}
