import QtQuick 2.6
import QtQuick.Window 2.2
//import QtQuick.Controls 1.4
//import QtQuick.Layouts 1.3
import QtQml 2.2

Item{
    id: container
    visible: true
    width: 800
    height: 600

    Timer{
        id:timer
        interval : 500;
        repeat : true;
        running : true;
        triggeredOnStart : true
        onTriggered: {

            //  dataSource 传递数据
            console.log(dataSource.getHeading())
            rotateHeading(dataSource.getHeading())
        }
    }

    MouseArea {
        id:mousearea
        anchors.fill: parent
        onDoubleClicked: {
            winscreen.showMaximized();
            mycanvas.requestPaint();
        }
      //  onDoubleClicked:{aroundAnimation.to=30;aroundAnimation.running=true}
    }
    Item {
        id: heading
        anchors {
            fill:parent
            centerIn: parent
        }

        property real headingAngle: 0

        Image {
            id: compass_heading_img
            anchors.centerIn: parent
            smooth:true
            source: "img/compass.png"
//            transformOriginPoint: point(winscreen.width/2,winscreen.height/2)
//            transformOrigin: winscreen.Center
        }

        PropertyAnimation{
           id: aroundAnimation
           target: heading_img
           properties:"rotation"
           duration:100
        }

        Canvas {
            visible: true
            id: mycanvas
            anchors {
                centerIn: parent
                fill: parent
            }
            onPaint: {
                var ctx = getContext("2d");
                repaintCanvas(ctx)

            }

    }


    }

    /*************** js functions ************************/

    function getArgs() {
        return {
            color_red: Qt.rgba(1, 0, 0, 0.5) ,
            ox: heading.width / 2 ,
            oy: heading.height / 2 ,
            heading: heading.headingAngle,
            heading_img_height: compass_heading_img.height

        }
    }

    function repaintCanvas(ctx) {
        var args = getArgs()
        ctx.fillStyle = args.color_red
        ctx.lineWidth=3
        ctx.beginPath()
        // 线连接处用圆角
        ctx.lineJoin="round"
        ctx.moveTo(args.ox-10, args.oy-args.heading_img_height/2+60);
        ctx.lineTo(args.ox+10, args.oy-args.heading_img_height/2+60);
        ctx.lineTo(args.ox,    args.oy-args.heading_img_height/2+110);
        ctx.closePath();
        ctx.fill();
    }

    function rotateHeading(heading) {
        heading_img.rotation = heading
    }

    /******* 测试使用 *********/
//    Label {
//        id: angleshow
//        z:6
//        color:"red"
//        opacity:0.5
//        font.family:"Helvetica [Cronyx]"
//        text:"ad"
//        anchors.centerIn: parent
//     //   text:"0"
//        fontSizeMode: Text.Fit; minimumPixelSize: 10; font.pixelSize: 20
//        style: Text.Sunken
//    }

//     GroupBox {
//        visible: false;
//        title: "输入转动角度"
//        anchors.right:image.left
//        anchors.top:parent.top
//        anchors.topMargin: 30
//        ColumnLayout {
//            anchors.fill: parent
//            TextField {
//                id:textfield
//                width:50
//                focus:true
//        //       text://addWidgets.getCurrentData()
////                text:"0"
//                placeholderText: "-360.0-360.0";
//                validator:DoubleValidator{bottom:-360.0;top:360.0;decimals:8;
//                notation:DoubleValidator.StandardNotation}
//                Layout.fillWidth: true; z: 1
//            }
//            Button {
//                id:button;text : "确定";
//                onClicked:{
//                    angleshow.text=addWidgets.getCurrentData()
//                    aroundAnimation.to=-Number(addWidgets.getCurrentData());
//                    aroundAnimation.running=true;
//                    textfield.remove(0,20);
//                    emitangle();
//                }
//            }
//        }
//    }

}






