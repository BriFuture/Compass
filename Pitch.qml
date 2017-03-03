import QtQuick 2.0
import QtQuick.Window 2.2

import "DataSource.js" as DataSource

Window {
    visible: true
    width: 900
    height: 600
    title: qsTr("Display compress(Pitch)")
    id: container

    /* 矩形，用于设置背景色 */
    Rectangle {
        z: -10
        id: canvasArea
        anchors {
            fill: parent
            centerIn: parent
        }
        color: "gray"
    }

    Text {
        id: displayText
        anchors.verticalCenter: parent.verticalCenter
        font.pointSize: 24
        text: "俯仰角为：" + 0 + "\n横滚角：" + 0
    }

    Item {
        id: pitchRoll
        anchors {
            centerIn: parent
            fill: parent
        }

        // 画布，用于绘制俯仰仪
        Canvas {
            id: pitchCanvas
            anchors {
                centerIn: parent
                margins: 10
                fill: parent
            }
            z:1
            contextType: "2d"
            // 设置俯仰角的圆的半径
            property real radius: 105
            property string rollCircleImg : "img/compass_roll_circle.png"   // 白色基线图片
            property string baseOuterImg: "img/compass_base_2.png"          // 指南针底部黑框
            property real pitch: 0
            property real roll: 0
            visible: true
            onPaint: {
                var ctx = getContext("2d")
                repaintCanvas(ctx)
            }
            Component.onCompleted: {
                loadImage(rollCircleImg)
                loadImage(baseOuterImg)
            }

            onImageLoaded: requestPaint()
        }

        Item {
            visible: false
            transform:
                Scale {
                    id: compass_item_scale
                    origin {x: container.width/2; y: container.height/2}
                    xScale: 1.1
                    yScale: 1.1
                }
            anchors.centerIn: parent
            Image {
                id: roll_circle
                source: "img/compass_roll_circle.png"
                z: 0
                anchors.centerIn: parent
            }

            // 指南针底部黑框
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
            refresh(data[1], data[2])
        }
    }

    /**************************  javascript functions  **********************************/

    /*
     * 绘制图形
     * ctx 画布上下文
    */
    function repaintCanvas(ctx) {
//        console.log("俯仰角" + pitchInput.text)
        var pitch = pitchCanvas.pitch
        var roll = pitchCanvas.roll
        var ox = pitchCanvas.width/2  // 画布中心
        var oy = pitchCanvas.height/2 // 画布中心
        /** 颜色 **/
        var color_gray = "#513928"
        var color_blue = "#558db9"
        var color_orange = "rgba(255, 122, 0, 0.75)"
        /** 线的参数 **/
        var longline = 30       // 长刻度线的长度
        var shortline = 15      // 短刻度线的长度
        var lineheight = 2      // 线宽
        var linegap = pitchCanvas.radius / 4.5       // 两条长刻度线之间的距离
        var degrees = 5         // 相邻长线和短线之间的刻度间隔
        var mainLines = 4       // 每一边的主要长刻度线数

        ctx.lineWidth = 1
        // 覆盖上一次画布画出的内容
//        ctx.fillStyle = "white"
//        ctx.arc(ox, oy, pitchCanvas, 0, Math.PI * 2)
//        ctx.fill()
        ctx.strokeStyle = "#f0f0f0"

        /* 绘制图片 */
        ctx.drawImage(pitchCanvas.rollCircleImg, ox, oy)
        ctx.drawImage(pitchCanvas.baseOuterImg, ox, oy + 193.5)
        // 绘制圆形
        fillRound(ctx, ox, oy, pitch, {color_blue: color_blue, color_gray: color_gray, degrees: degrees, mainLines: mainLines})

        /* 绘制中心圆点 */
        ctx.beginPath()
        ctx.strokeStyle = "red"
        ctx.fillStyle = "red"
        ctx.arc(ox, oy, 2, 0, Math.PI*2)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        /*
         * 绘制刻度，在圆内仅显示 4 个 x 10' x 2边 个刻度
         * 移动时修改刻度示数，数字为白色
        */
        ctx.beginPath()
        ctx.strokeStyle = "white"
        ctx.fillStyle = "white"
        ctx.linewidth = 1
        var addon = {showText: true, text: "0", base: pitch, mainLines: mainLines}
        ctx.fontWeight = "bold"
        for(var i = 1; i <= mainLines; i++) {
            // 圆水平的直径为界限，画出下半部分的刻度
            addon.text = getDegree(- i * 2 * degrees + addon.base)
            drawLine(ctx, ox+0, oy+i*linegap, longline, lineheight, addon)
            addon.text = getDegree(- i * 2 * degrees + addon.base + degrees)
            drawLine(ctx, ox+0, oy+(i-0.5)*linegap, shortline, lineheight, addon)
            // 圆水平的直径为界限，画出上半部分的刻度
            addon.text = getDegree(i * 2 * degrees + addon.base)
            drawLine(ctx, ox+0, oy-(i*linegap), longline, lineheight, addon)
            addon.text = getDegree(i * 2 * degrees + addon.base - degrees)
            drawLine(ctx, ox+0, oy-((i-0.5)*linegap), shortline, lineheight, addon)
        }
        // 在圆心旁边标出现在的 pitch 示数
        ctx.fillText(pitch, ox + 7, oy + 6.5)
        ctx.fill()
//        ctx.stroke()

        /*
         * 用 color_orange 绘制圆的水平方向直径
         * 然后用 color_orange 绘制顶部的三角形
         * 作为基准（不移动，不转动）
        */
        ctx.beginPath()
        ctx.strokeStyle = color_orange
        ctx.fillStyle = color_orange
        ctx.linewidth = 1
        drawLine(ctx, ox + pitchCanvas.radius / 2.2, oy-lineheight*0.9, pitchCanvas.radius / 2.2, lineheight*1.8)
        drawLine(ctx, ox - pitchCanvas.radius / 2.2, oy-lineheight*0.9, pitchCanvas.radius / 2.2, lineheight*1.8)
        ctx.fill()
        ctx.stroke()
        // 绘制三角形
        ctx.lineWidth = 6
        drawTriangle(ctx, ox, oy - pitchCanvas.radius + 5, 30, 40);

    }

    /*
     *
     * 画出矩形，或者画出刻度线
     * ctx          画布上下文
     * x            绘制位置（相对画布左上角）,向右为正,默认为 0，不用进行修改
     * y            绘制位置（相对画布左上角），向下为正
     * longline     绘制的长度
     * lineheight   绘制线的高度
     * addon        附加参数，比如是否需要绘出数字
     */
    function drawLine(ctx, x, y, linelength, lineheight, addon) {
        // 矩形沿 x 负方向再平移 linelength/2，使矩形中心位于原点
        ctx.rect(x - linelength/2, y, linelength, lineheight)
        if(addon && addon.showText) {
//            console.log(addon.text)
            ctx.fillText(addon.text, x + linelength/2 + 5, y + 5.5)
        }
    }

    /*
     * 绘制等腰三角形，该三角形位于，以底（base）为边，以高（height）为长的矩形中
     * 等腰三角形的位移基点在两条腰连接的顶点
     * ctx          画布上下文
     * x            绘制位置（相对画布左上角）,向右为正,默认为 0，不用进行修改
     * y            绘制位置（相对画布左上角），向下为正
     * base         底边长度
     * height       高的长度
    */
    function drawTriangle(ctx, x, y, base, height) {
        ctx.beginPath()
        // 两线相交时，边角为圆角
        ctx.lineJoin="round";

        ctx.moveTo(x, y)
        ctx.lineTo(x-base/2, y+height)  // 绘制三角形的腰
        ctx.lineTo(x+base/2, y+height)  // 绘制底边
        ctx.closePath()                 // 绘制三角形的腰

//        ctx.fill()
        ctx.stroke()
    }

    /*
     * 用蓝色和褐色涂满圆圈
     * ctx          画布上下文
     * x            绘制位置（相对画布左上角），向右为正，默认为 0，不用进行修改
     * y            绘制位置（相对画布左上角），向下为正
     * pitch        俯仰角
     * addon        附加参数
    */
    function fillRound(ctx, x, y, pitch, addon) {
        // 通过数据得出俯仰角
        var arg = countArg(pitch, addon)
//        var baseColor = addon.color_gray, coverColor = addon.color_blue
//        if( Math.abs(pitch) > 90 ) {
//            baseColor = addon.color_blue
//            coverColor = addon.color_gray
//        }

        /* 开始绘制图形 首先用 baseColor 绘制一个大圆 */
//        ctx.beginPath()
//        ctx.fillStyle = baseColor   //褐色
//        ctx.arc(x, y, pitchCanvas.radius, 0, Math.PI*2)     // 以画布中心为圆心
//        ctx.closePath()
//        ctx.fill()
//        ctx.stroke()

        /* 再用 coverColor 绘制环及其封闭图形 */
//        ctx.fillStyle = coverColor
//        ctx.beginPath();
//        ctx.arc(x, y, pitchCanvas.radius, arg.start, arg.end, true) // 以画布中心为圆心，逆时针旋转
////        ctx.closePath();
//        ctx.fill()
//        ctx.stroke()

        if(!arg.all) {
            /* 绘制上半部分 */
            ctx.beginPath()
            ctx.fillStyle = arg.up
            ctx.arc(x, y, pitchCanvas.radius, arg.start, arg.end, true)  // 以画布中心为圆心，逆时针旋转
            ctx.fill()
            ctx.stroke()

            /* 绘制下半部分 */
            ctx.beginPath()
            ctx.fillStyle = arg.down
            ctx.arc(x, y, pitchCanvas.radius, arg.start, arg.end, false)  // 以画布中心为圆心，顺时针旋转
            ctx.fill()
            ctx.stroke()
        } else {
            // 整个部分都是一种颜色，用 arg.up 返回的颜色进行填充
            ctx.beginPath()
            ctx.fillStyle = arg.up
            ctx.arc(x, y, pitchCanvas.radius, 0, Math.PI * 2, true)  // 以画布中心为圆心，逆时针旋转
            ctx.fill()
            ctx.stroke()
        }

    }

    /*
     * 通过俯仰角 pitch 和 addon 计算出蓝褐区域分界线的开始角度和结束角度
     * 返回上半部分和下半部分的颜色以及角度
     * pitch  俯仰角
     * addon  附加参数
    */
    function countArg(pitch, addon) {
        var arg = {start: 0, end: Math.PI, up: addon.color_blue, down: addon.color_gray, all: false}
        // 表盘上半部或者下半部的总度数
        var half_Degree = (addon.mainLines * 2 + 1) * addon.degrees
        var  deg = 0, start = 0
//        console.log("pitch "+ pitch + "  half " + half_Degree)

        if( (pitch + half_Degree) > 180 || (pitch - half_Degree) < - 180 ) {    // 圆内出现 180 度线时，上半部颜色为 gray，下半部为 blue
//            deg = (pitch > 0) ? 180 - pitch : 180 + pitch
            if(pitch > 0) {
                deg = 180 - pitch
                arg.start = - Math.asin(deg/half_Degree)    // 分界线在上半部分
            } else {
                deg = 180 + pitch
                arg.start = Math.asin(deg/half_Degree)      // 分界线在下半部分
            }
            arg.up = addon.color_gray
            arg.down = addon.color_blue
            arg.end = Math.PI - arg.start
        } else if( ((pitch + half_Degree) > 0 && pitch < 0) || ((pitch - half_Degree) < 0 && pitch > 0)) {   // 圆内出现 0 度线时，上半部分为 blue，下半部分为 gray
//            console.log("part up blue")
            if(pitch > 0) {
                arg.start = Math.asin(pitch/half_Degree)    // 分界线在下半部分
            } else {
                arg.start = Math.asin(pitch/half_Degree)  // 分界线在上半部分
            }
            arg.up = addon.color_blue
            arg.down = addon.color_gray
            arg.end = Math.PI - arg.start
        } else if (pitch > 0) {  // 此时整个圆全部蓝色
//            console.log("all blue")
            arg.all = true
            arg.up = addon.color_blue
        } else if(pitch < 0) {  // 整个圆全部褐色
            arg.all = true
            arg.up = addon.color_gray
        }

        return arg
    }

    /*
     * 返回刻度盘上的刻度
    */
    function getDegree(degree) {
        if(degree > 180) {
            degree = degree - 360
        } else if (degree < -180) {
            degree = degree + 360
        }

        return degree
    }

    /*
     * @Depracted  直接通过俯仰角计算角度过于复杂，颜色无法正确分配
     * 通过俯仰角 pitch 计算出蓝色区域的开始角度和结束角度
     * pitch  俯仰角
    */
    function countAngle1(pitch) {
//        var angle = [0, 0]  // angle[0] 为起始角度，angle[1] 为结束角度

        var startAngle = 0, endAngle = 0
        var length = 0
        if(Math.abs(pitch) < 90) {
            length = Math.abs(pitch) / 90 * pitchCanvas.radius
        } else {
            length = (Math.abs(pitch) - 90 ) / 90 * pitchCanvas.radius
        }

        startAngle = Math.asin(length / pitchCanvas.radius)
//        console.log(startAngle + " == " + startAngle*Math.PI)
        if(pitch > 90) {                //  90 ~ 180
            startAngle = -startAngle
        } else if (pitch > 0) {         //  0 ~ 90
            startAngle = startAngle
        } else if (pitch > -90) {       //  -90 ~ 0
            startAngle = -startAngle
        } else {                        //  -180 ~ -90
            startAngle = startAngle
        }

        endAngle = Math.PI - startAngle

        return [startAngle, endAngle]
    }

    /*
     * 根据 pitch 和 roll 角度刷新图像
     * pitch  俯仰角
     * roll   横滚角
    */
    function refresh(pitch, roll) {
        // 更新数据
        pitchCanvas.pitch = pitch
        pitchCanvas.roll = roll
        // 旋转图像
        roll_circle.rotation = roll
        pitchCanvas.rotation = roll
        // 重新绘制 Canvas
        pitchCanvas.requestPaint()
        // 更新显示文字
        displayText.text = "俯仰角为：" + pitch + "\n横滚角：" + roll
    }

    /*
     * 用 ctx 将图片绘制出来
     * ctx          画布上下文
     * x            绘制位置（相对画布左上角），向右为正
     * y            绘制位置（相对画布左上角），向下为正
    */
    function drawImage(ctx, path, x, y) {
        ctx.drawImage(path, x, y)
    }


}
