import QtQuick 2.0
import "DataSource.js" as DataSource
Item {
    visible: true
    width: 900
    height: 600
    /* 矩形，用于设置背景色 */
    Rectangle {
        id: canvasArea
        anchors {
            fill: parent
            centerIn: parent
        }
        color: "gray"
    }

    // 画布，用于绘制俯仰仪
    Canvas {
        id: pitchCanvas
        anchors {
            centerIn: parent
            margins: 10
            fill: parent
        }
        contextType: "2d"
        // 设置俯仰角的圆的半径
        property real radius: 155
        property string baselineImg : "img/pitch_baseline.png"   // 白色基线图片
        property real pitch: 0
        property real roll: 0
        visible: true
        onPaint: {
            var ctx = getContext("2d")
//            console.log(DataSource.getData())

            repaintCanvas(ctx)
        }
    }

    /* 绘制图形 */
    function repaintCanvas(ctx) {
//        console.log("俯仰角" + pitchInput.text)
        var pitch = pitchCanvas.pitch
        var roll = pitchCanvas.roll
        ctx.lineWidth = 1

        ctx.strokeStyle = "black"

        /* 开始绘制图形 首先绘制一个褐色的大圆*/
        ctx.beginPath()
        ctx.fillStyle = '#513928'   //褐色
//      ctx.rect(0, 0, 120, 120)
//      ctx.moveTo(530,300)
        // 以画布中心为圆心
        ctx.arc(pitchCanvas.width/2, pitchCanvas.height/2, pitchCanvas.radius, 0, Math.PI*2)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        /* 开始绘制蓝色区域 */
        ctx.fillStyle = "#558db9"
        ctx.beginPath();
        // 通过数据得出俯仰角
        var angle = countAngle(pitch)
        // 以画布中心为圆心
        ctx.arc(pitchCanvas.width/2, pitchCanvas.height/2, pitchCanvas.radius, angle[0], angle[1], true)
        ctx.closePath();
        ctx.fill()
        ctx.stroke()

        /* 绘制圆心 */
        ctx.beginPath()
        ctx.strokeStyle = "red"
        ctx.fillStyle = "red"
        ctx.arc(pitchCanvas.width/2, pitchCanvas.height/2, 3, 0, Math.PI*2)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        // 打印俯仰角度
        /* 在旋转画布 pitchCanvas 时，显示的文字也会旋转 */
//        ctx.beginPath()
//        ctx.fillStyle = "gray"
//        ctx.rect(0, 450, 200, 200)
//        ctx.fill()

//        ctx.beginPath()
//        ctx.font = "30px sans-serif"
//        ctx.text(("俯仰角为：" + pitch), 0, 520)
//        ctx.text(("横滚角为：" + roll), 0, 555)
//        ctx.fill()
//        ctx.stroke()

    }
    /*
      * 通过俯仰角 pitch 计算出蓝色区域的开始角度和结束角度
      */
    function countAngle(pitch) {
//        var angle = [0, 0]  // angle[0] 为起始角度，angle[1] 为结束角度

        var startAngle = 0, endAngle = 0
        var length = Math.abs(pitch) / 90 * pitchCanvas.radius
        startAngle = Math.asin(length / pitchCanvas.radius)
//        console.log(startAngle + " == " + startAngle*Math.PI)
        if(pitch < 0) {
            startAngle = -startAngle
        }
        endAngle = Math.PI - startAngle

        return [startAngle, endAngle]
    }

    /* 旋转外圈和俯仰角部分的圆 */
    function rotateRoll(roll) {
//        console.log("roll")
        roll_circle.rotation = roll
        pitchCanvas.rotation = roll
    }

    /* 根据 pitch 和 roll 角度刷新图像 */
    function refresh(pitch, roll) {
        // 更新数据
        pitchCanvas.pitch = pitch
        pitchCanvas.roll = roll
        // 重新绘制 Canvas
        pitchCanvas.requestPaint()
        // 旋转图像
        rotateRoll(roll)
        // 更新显示文字
        displayText.text = "俯仰角为：" + pitch + "\n横滚角：" + roll
    }

    Text {
        id: displayText
        anchors.verticalCenter: parent.verticalCenter
        font.pointSize: 24
        text: "俯仰角为：" + 0 + "\n横滚角：" + 0
    }

    Item {
        anchors.centerIn: parent
        Image {
            source: pitchCanvas.baselineImg
            z: 100
            anchors.centerIn: parent
        }
        Image {
            id: roll_circle
            source: "img/compass_roll_circle.png"
            z: 0
            anchors.centerIn: parent
        }
        // 作为指南针的基线（不移动不转动）
        Image {
            source: "img/compass_base_1.png"
            z: 101
            anchors {
                horizontalCenter: parent.horizontalCenter
                verticalCenter: parent.verticalCenter
                verticalCenterOffset: -67.5
                horizontalCenterOffset: 3.5
            }
        }
        Image {
            source: "img/compass_base_2.png"
            z: 101
            anchors {
                horizontalCenter: parent.horizontalCenter
                verticalCenter: parent.verticalCenter
                verticalCenterOffset: 193.5
            }
        }

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
            var data = DataSource.getData();
            refresh(data[1] * 3, data[2] * 0.1)
        }
    }
}
