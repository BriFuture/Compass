import QtQuick 2.5
import QtQuick.Window 2.2
import "DataSource.js" as DataSource

/**
 * @Deprecated
 * 不再使用
 */
Window {
    visible: true
    width: 800
    height: 600
    title: qsTr("Display compress")
    id: container

//    onActiveChanged: {
//        console.log("width: " + container.width/2);
//        console.log("height: " + container.height/2)
//    }

    MouseArea {
        id: mouseArea
        anchors.fill: parent
        property bool flag: false;
        onClicked: {
            console.log("Mouse clicked!");
            flag = !flag;
        }
    }

    Item {
        id: compass_item
        anchors.centerIn: parent
        width: 300
        height: 280
        Image {
            anchors.centerIn: parent  // 居中显示
            width: compass_item.width
            height: compass_item.height
            id: compass_base_img
            source: "img/compass_base.png"

//          rotation: 30   // 顺时针旋转 30 度
        }
        Image {
            anchors.centerIn: parent   // 居中显示
            width: compass_item.width
            height: compass_item.height
            id: compass_pointer_img
            source: "img/compass_pointer.png"
            /*
             * 白色箭头对应设备的方向
             * 当指针的白色箭头正对 N （北）时，旋转角为 0
             * 旋转角为 90 时，白色箭头正对 E （东）
             * 旋转角为 180 时，白色箭头正对 S （南）
             * 旋转角为 270 时，白色箭头正对 W （西）
            */
//            rotation: DataSource.getData()[0]     // 顺时针旋转
            // 未实现绑定，无法更新，通过定时器触发时更新旋转角
        }

        // 控制 compass_item 的旋转和缩放

        transform:
            // 旋转
            Rotation {
                id: compass_item_rotation
                origin.x: container.width/2
                origin.y: container.height/2
                axis {x: 0; y: 0; z: 0}
                angle: 0
            }

            //  缩放
            Scale {
                id: compass_item_scale
                origin {x: container.width/2; y: container.height/2}
                xScale: 1
                yScale: 1
            }
        // 提供接口，将 rotation 对象供外部调用
        property Rotation item_rotation: compass_item_rotation

        transitions: [
            Transition {
                NumberAnimation {target: compass_item_rotation; property: "angle"; duration: 500;}
            }
        ]

    }

    /*
     * 设置一个定时器，每隔 500ms 就从数据源中读取数据，修正图像
    */
    Timer {
        id: updateTimer
        interval: 500
        running: true
        repeat: true

        onTriggered: {
//            console.log("Timer is triggered! ")
            updateCompass();
        }
    }


    //  测试图片
    Image {
        anchors.centerIn: parent   // 居中显示
        id: compass_pointer_fb_img
        source: "img/compass_pointer.png"
        visible: false
    }

    /**
      * 更新指南针图像，综合航向角，俯仰角和翻滚角
    */
    function updateCompass() {
//        var data = DataSource.getData()
//        compass_item.item_rotation.angle += 0.5
//        console.log(DataSource.getData())
//        compass_pointer_img.rotation = data[0]    // 修改指向
//        console.log(compass_pointer_img.rotation)
        /*
          * 更新翻滚角的画面时，会将俯仰角的数据覆盖，无法分步更新数据
        */
        /*
        // 俯仰角，以 x 轴为轴旋转
        compass_item_rotation.axis.x = 1
        compass_item_rotation.axis.y = 0
        compass_item_rotation.angle = 10
        // 翻滚角，以 y 轴为轴旋转
        compass_item_rotation.axis.x = 0
        compass_item_rotation.axis.y = 1
        compass_item_rotation.angle = 0
        */
        var data = DataSource.getData();
        compass_pointer_img.rotation = data[0];   // 修改指南针的指针指向

        var a = data[1];
        var b = data[2];
        var Sa = Math.sin(a);   // Sin(a)
        var Ca = Math.cos(a);   // Cos(a)
        var Sb = Math.sin(b);   // Sin(b)
        var Cb = Math.cos(b);   // Cos(b)
        // 旋转轴为 q 分量分别为 qx qy qz, qz = 0
        var qx = Sa;
        var qy = -Sb;
        // 旋转后的 Z 轴长度
        var _Z = Math.sqrt(2+ 2 * Ca * Cb);
        // gama 为旋转角
        var gama = Math.acos((Ca+Cb)/ _Z)
        // 旋转
        compass_item_rotation.axis.x = qx
        compass_item_rotation.axis.y = qy
        compass_item_rotation.angle = gama
    }

}


