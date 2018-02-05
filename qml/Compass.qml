import QtQuick 2.0

//import "DataSource.js" as DataSource

Item {
    visible: true
    width: 800
    height: 600
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
        anchors.bottom: parent.bottom
        font.pointSize: 16
        text:  "航向角(heading)：" + 0 + "\n俯仰角(pitch)：" + 0 + "\n横滚角(roll)：" + 0
    }

    /* 航向角相关内容 */
    Item {
        id: headingItem
        height: container.height
        width:  container.width/2

        property real headingAngle: 0

        Image {
            id: compass_heading_img
            anchors.centerIn: parent
            width: getScaledSize(449)
            height: getScaledSize(449)
            smooth: true
            source: "/img/heading.png"
            rotation: -headingItem.headingAngle
        }

        SmoothedAnimation {
           id: aroundAnimation
           target: headingItem
           properties:"headingAngle"
           duration: 100
           maximumEasingTime : 100
        }

        Canvas {
            visible: true
            id: headingCanvas
            anchors {
                centerIn: parent
                fill: parent
            }
            onPaint: {
                var ctx = getContext("2d");
                h_repaintCanvas(ctx);
            }
        }

        property var args: {
            // 画布中心
            "ox": headingItem.width/2,
            "oy": headingItem.height/2,
            /* 颜色 */
            "color_red": "rgba(255, 0, 0, 0.75)",
            "heading": headingItem.headingAngle,
            "heading_img_height": compass_heading_img.height
        }
    }

    /* 横滚角，倾斜角相关内容 */
    Item {
        id: pitchRoll
        height: container.height
        width:  container.width/2
        anchors {
//            centerIn: parent
//            fill: parent
            left: headingItem.right
        }
        // const real,标准半径为 145
        property real stdradius: 148
        //  设置俯仰角的圆的半径
        property real radius: stdradius / 1000 * container.width

        property string rollCircleImg : "/img/compass_roll_circle.png"   // 白色基线图片
        property string baseOuterImg: "/img/compass_pr_base.png"          // 指南针底部黑框
        property real pitch: 0
        property real lastPitch: 0
//        property bool pitchUp: false
        property real roll: 0
        property var args : {
            "pitch": pitchRoll.pitch,
            "roll": pitchRoll.roll,
            // 画布中心
            "ox": pitchRoll.width/2,
            "oy": pitchRoll.height/2,
            /* 颜色 */
            "color_gray": "#513928",
            "color_blue": "#558db9",
            "color_orange": "rgba(255, 122, 0, 0.8)",
            "color_red": Qt.rgba(1, 0, 0, 0.5),
            /** 线的参数 **/
            "longline": getScaledSize(30),       // 长刻度线的长度
            "shortline": getScaledSize(15),      // 短刻度线的长度
            "lineheight": getScaledSize(2),      // 线宽
            "mainLines": 3,                           // 每一边的长刻度线数
            "linegap": pitchRoll.radius / 3.5,        // 两条长刻度线之间的距离
            "degrees": 5,                             // 相邻长线和短线之间的刻度间隔
            "heading": headingItem.headingAngle,
            "heading_img_height": compass_heading_img.height
        }

        // 画布，用于绘制俯仰仪，动态变化
        Canvas {
            id: pitchCanvas
            anchors {
                centerIn: parent
                fill: parent
            }
            rotation: pitchRoll.roll
//            z:1
            contextType: "2d"
            visible: true
            onPaint: {
                var ctx = getContext("2d")
                repaintCanvas(ctx)
            }
        }


        SmoothedAnimation {
            id: rollAnimation
            target: pitchCanvas
            property: "roll"
            duration: 100
            maximumEasingTime : 100

        }

        /* 绘制俯仰仪基线 */
        Canvas {
            id: pitchStaticCanvas
            anchors {
                centerIn: parent
                fill: parent
            }
            z:3
            contextType: "2d"
            visible: true
            onPaint: {
                var ctx = getContext("2d")
                drawBaseLine(ctx)
            }
        }

        Item {
            visible: true
            anchors {
                horizontalCenter: parent.horizontalCenter
                verticalCenter: parent.verticalCenter
                verticalCenterOffset: 0
                horizontalCenterOffset: 0
            }

            Image {
                id: roll_circle
                source: pitchRoll.rollCircleImg
                z: 0
                // 原始图片内圆标准距离为 295 px 外圆标准距离为 449px
                width: getScaledSize(449)
                height: getScaledSize(449)
                anchors {
                    horizontalCenter: parent.horizontalCenter
                    verticalCenter: parent.verticalCenter
                }
                rotation: pitchRoll.roll
            }

            // 指南针底部黑框
            Image {
                source: pitchRoll.baseOuterImg
                id: baseOuterImg
                z: 101
                // 原始图片高度 86 宽度 361
                width: getScaledSize(455)
                height: getScaledSize(455)

                anchors {
                    horizontalCenter: parent.horizontalCenter
                    verticalCenter: parent.verticalCenter
                    verticalCenterOffset: getScaledSize(2.5)
                }
            }

        }
    }

    Connections {
        target: dataSource
        onDataChanged: {
            console.log("dataSource heading changed:  " + dataSource.getHeading());
            var data = [0, 0, 0];
            data[0] = dataSource.getHeading();
            data[1] = dataSource.getPitch();
            data[2] = dataSource.getRoll();
//            data[0] = data[0] % 360;
//            data[1] = data[1] % 181;
//            data[2] = data[2] % 360;
            refresh(data[0], data[1], data[2]);
        }
    }

    Connections {
        target: window
        onWindowStateChanged: {
            if( window.visibility == window.Hidden || window.visibility == window.Minimized ) {
                // it can decrease resource consuming when not minimized or hidden
                console.log("[Info] windos state changed:  now hidden or minimized");
            } else {
            }
        }
    }

    /**************************  javascript functions for pitch&roll  **********************************/

    /*
     * 绘制图形
     * @param  ctx 画布上下文
    */
    function repaintCanvas(ctx) {
        var args = pitchRoll.args;
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#f0f0f0";

        /* 绘制图片，位移复杂 */
//        ctx.drawImage(pitchRoll.rollCircleImg, ox, oy)
//        ctx.drawImage(pitchRoll.baseOuterImg, ox, oy + 193.5)
        ctx.clearRect(args.ox - pitchRoll.radius, args.oy - pitchRoll.radius, 2*pitchRoll.radius, 2*pitchRoll.radius);
        // 绘制圆形
        fillRound(ctx, args.ox, args.oy, args.pitch, args)

        /*
         * 绘制刻度，在圆内仅显示 4 个 x 10' x 2边 个刻度
         * 移动时修改刻度示数，数字为白色
        */
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.linewidth = 1;
        var addon = {showText: true, text: "0", mainLines: args.mainLines, txtoffset: args.longline/2 + getScaledSize(5)};
//        ctx.fontWeight = "bold";
        ctx.font = getFontSize(10, 5)  + "px sans-serif bold";
        addon.text = getDegree(0, args.pitch);
        drawLine(ctx, args.ox+0, moveLineOnY(0, false), args.longline, args.lineheight, addon);
        for(var i = 1; i <= args.mainLines + 1; i++) {
            ctx.font = getFontSize(10, 5)  + "px sans-serif bold";
            // 圆水平的直径为界限，画出下半部分的长刻度
            addon.text = getDegree(- i * 2 * args.degrees, args.pitch);
            drawLine(ctx, args.ox+0, moveLineOnY(i, false), args.longline, args.lineheight, addon);
            // 圆水平的直径为界限，画出上半部分的长刻度
            addon.text = getDegree(i * 2 * args.degrees, args.pitch);
            drawLine(ctx, args.ox+0, moveLineOnY(i, true), args.longline, args.lineheight, addon);
            ctx.font = getFontSize(8, 4)  + "px sans-serif bold";
            // 圆水平的直径为界限，画出下半部分的短刻度
            addon.text = getDegree(- i * 2 * args.degrees + args.degrees, args.pitch);
            drawLine(ctx, args.ox+0, moveLineOnY(i-0.5, false), args.shortline, args.lineheight, addon);
            // 圆水平的直径为界限，画出上半部分的短刻度
            addon.text = getDegree(i * 2 * args.degrees - args.degrees, args.pitch);
            drawLine(ctx, args.ox+0, moveLineOnY(i-0.5, true), args.shortline, args.lineheight, addon);
        }

        ctx.fill();
//        ctx.stroke()
        /* 绘制中心圆点 */
        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.fillStyle = "red";
        ctx.arc(args.ox, args.oy, getScaledSize(1.2), 0, Math.PI*2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    /**
      * 计算出 Y 轴方向的偏移
      * @param  line    线的位置
      * @param  up      上半部分或下半部分
      * @param  off     偏移量
      */
    function moveLineOnY(line, up) {
        var args = pitchRoll.args;
        var off = 0;
//        if(pitchRoll.lastPitch !== args.pitch) {
//            /**
//              * 如果当前的 pitch 值大于之前的 pitch 值，认为俯仰仪在上升
//              * 但当 pitch 值从 179 跨越 180 变成 -179 时，此时应该是上升，但是得到的布尔值却是 false
//            **/
//            pitchRoll.pitchUp = (args.pitch > pitchRoll.lastPitch) ? true : false;
//            pitchRoll.lastPitch = args.pitch;
//        }
        off = args.pitch % (args.degrees * 2) / (args.degrees * 2);

        off = off * args.linegap ;
        var y;
        if(up) {
            y = args.oy - line * args.linegap;
        } else {
            y = args.oy + line * args.linegap;
        }
//        console.log("y: " +y + "  off: " + off);
//        if( pitchRoll.pitchUp ) {
//            y = y + off;
//        } else {
//            y = y - off;
//            console.log("down " + y)
//        }

        return y + off;
    }

    /*
     * 绘制俯仰仪基线
     * @param  ctx    画布上下文
    */
    function drawBaseLine(ctx) {
        var args = pitchRoll.args;
        /*
         * 用 color_orange 绘制圆的水平方向直径
         * 然后用 color_orange 绘制顶部的三角形
         * 作为基准（不移动，不转动）
        */
        ctx.clearRect(args.ox - pitchRoll.radius, args.oy - pitchRoll.radius, 2*pitchRoll.radius, 2*pitchRoll.radius);
        ctx.beginPath()
        ctx.strokeStyle = args.color_orange
        ctx.fillStyle = args.color_orange
        ctx.linewidth = 1
        var height = args.lineheight*2.4
        var length = pitchRoll.radius/2.5
        drawLine(ctx, args.ox + length + getScaledSize(30), args.oy-height/2, length, height)
        drawLine(ctx, args.ox - length - getScaledSize(30), args.oy-height/2, length, height)
        ctx.fill()
//        ctx.stroke()
        // 绘制三角形
        drawTriangle(ctx, args.ox, args.oy - pitchRoll.radius + getScaledSize(5), getScaledSize(30), getScaledSize(40));

        // 在圆心旁边标出现在的 pitch 示数
        ctx.fillStyle = "red"
        ctx.font = getFontSize(16, 8) + "px sans-serif"
        ctx.fillText(args.pitch.toFixed(2), args.ox + getScaledSize(6.5), args.oy + getScaledSize(6.5))
    }

    /**
     *
     * 画出矩形，或者画出刻度线
     * @param  ctx          画布上下文
     * @param  x            绘制位置（相对画布左上角）,向右为正,默认为 0，不用进行修改
     * @param  y            绘制位置（相对画布左上角），向下为正
     * @param  longline     绘制的长度
     * @param  lineheight   绘制线的高度
     * @param  addon        附加参数，比如是否需要绘出数字
     */
    function drawLine(ctx, x, y, linelength, lineheight, addon) {
        // 矩形沿 x 负方向再平移 linelength/2，使矩形中心位于原点
        ctx.rect(x - linelength/2, y - lineheight /2, linelength, lineheight)
        if(addon && addon.showText) {
//            console.log(addon.text)
            ctx.fillText(addon.text, x + addon.txtoffset, y + getScaledSize(5.5))
        }
    }

    /**
     * 绘制等腰三角形，该三角形位于，以底（base）为边，以高（height）为长的矩形中
     * 等腰三角形的位移基点在两条腰连接的顶点
     * @param  ctx          画布上下文
     * @param  x            绘制位置（相对画布左上角）,向右为正,默认为 0，不用进行修改
     * @param  y            绘制位置（相对画布左上角），向下为正
     * @param  base         底边长度
     * @param  height       高的长度
    */
    function drawTriangle(ctx, x, y, base, height) {
        ctx.beginPath()
        // 两线相交时，边角为圆角
        ctx.lineJoin="round";
        ctx.lineWidth = (4.5/pitchRoll.stdradius)*pitchRoll.radius

        ctx.moveTo(x, y)
        ctx.lineTo(x-base/2, y+height)  // 绘制三角形的腰
        ctx.lineTo(x+base/2, y+height)  // 绘制底边
        ctx.closePath()                 // 绘制三角形的腰

//        ctx.fill()
        ctx.stroke()
    }

    /**
     * 用蓝色和褐色涂满圆圈
     * @param  ctx          画布上下文
     * @param  x            绘制位置（相对画布左上角），向右为正，默认为 0，不用进行修改
     * @param  y            绘制位置（相对画布左上角），向下为正
     * @param  pitch        俯仰角
     * @param  addon        附加参数
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
//        ctx.arc(x, y, pitchRoll.radius, 0, Math.PI*2)     // 以画布中心为圆心
//        ctx.closePath()
//        ctx.fill()
//        ctx.stroke()

        /* 再用 coverColor 绘制环及其封闭图形 */
//        ctx.fillStyle = coverColor
//        ctx.beginPath();
//        ctx.arc(x, y, pitchRoll.radius, arg.start, arg.end, true) // 以画布中心为圆心，逆时针旋转
////        ctx.closePath();
//        ctx.fill()
//        ctx.stroke()

        if(!arg.all) {
            /* 绘制上半部分 */
            ctx.beginPath()
            ctx.fillStyle = arg.up
            ctx.arc(x, y, pitchRoll.radius, arg.start, arg.end, true)  // 以画布中心为圆心，逆时针旋转
            ctx.fill()
            ctx.stroke()

            /* 绘制下半部分 */
            ctx.beginPath()
            ctx.fillStyle = arg.down
            ctx.arc(x, y, pitchRoll.radius, arg.start, arg.end, false)  // 以画布中心为圆心，顺时针旋转
            ctx.fill()
            ctx.stroke()
        } else {
            // 整个部分都是一种颜色，用 arg.up 返回的颜色进行填充
            ctx.beginPath()
            ctx.fillStyle = arg.up
            ctx.arc(x, y, pitchRoll.radius, 0, Math.PI * 2, true)  // 以画布中心为圆心，逆时针旋转
            ctx.fill()
            ctx.stroke()
        }

    }

    /*
     * 通过俯仰角 pitch 和 addon 计算出蓝褐区域分界线的开始角度和结束角度
     * 返回上半部分和下半部分的颜色以及角度
     * @param  pitch  俯仰角
     * @param  addon  附加参数
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
     * degree       刻度实际的数值
     * base         当前的 pitch 值
    */
    function getDegree(degree, base) {
        degree += base - base % 10;
        if(degree > 180) {
            degree = degree - 360
        } else if (degree < -180) {
            degree = degree + 360
        }

        return degree.toFixed(2)
    }

    /*
     * 返回字体大小，按照图形等比例的缩放大小
     * 或者直接返回 minsize
     * size     大小
    */
    function getFontSize(size, minsize) {
        var s = getScaledSize(size)
        if(s > minsize) {
            return s
        }
        console.log("minsize:" + minsize)
        return minsize
    }

    /*
     * 等比例缩放尺寸
     * size     期望的原始尺寸
    */
    function getScaledSize(size) {
        return size / pitchRoll.stdradius * pitchRoll.radius
    }

    /*
     * 根据 heading, pitch 和 roll 角度刷新图像
     * @param  heading  航向角
     * @param  pitch  俯仰角
     * @param  roll   横滚角
    */
    function refresh(heading, pitch, roll) {
        headingItem.headingAngle = heading;
//        compass_heading_img.rotation = -heading;
        // 更新数据
        pitchRoll.pitch = pitch;
        pitchRoll.roll = roll;
        // 重新绘制 Canvas
        pitchCanvas.requestPaint();
        pitchStaticCanvas.requestPaint();
        headingCanvas.requestPaint();
        // 更新显示文字
        displayText.text = "航向角(heading)：" + heading.toFixed(2) +
                "\n俯仰角(pitch)：" + pitch.toFixed(2) +
                "\n横滚角(roll)：" + roll.toFixed(2);

    }

    /*
     * @Deprecated 不用画布画出图像
     * 用 ctx 将图片绘制出来
     * @param  ctx          画布上下文
     * @param  x            绘制位置（相对画布左上角），向右为正
     * @param  y            绘制位置（相对画布左上角），向下为正
    */
    function drawImage(ctx, path, x, y) {
        ctx.drawImage(path, x, y);
    }


    /***************  js functions for heading  ************************/

    function h_repaintCanvas(ctx) {
        var args = headingItem.args;
        var base = getScaledSize(24);
        var height = getScaledSize(50);
        var yoffset = - (pitchRoll.radius - getScaledSize(25));
        ctx.fillStyle = args.color_red;
        ctx.strokeStyle = args.color_red;
        ctx.lineWidth = getScaledSize(3);
        ctx.clearRect(args.ox - pitchRoll.radius, args.oy - pitchRoll.radius - getScaledSize(30), 2*pitchRoll.radius, 2*pitchRoll.radius);
        ctx.beginPath();
        // 线连接处用圆角
        ctx.lineJoin="round"
        ctx.moveTo(args.ox-base/2, args.oy + yoffset);
        ctx.lineTo(args.ox+base/2, args.oy + yoffset);
        ctx.lineTo(args.ox,    args.oy + yoffset - height);
        ctx.closePath();
//        ctx.fill();
        ctx.stroke();

        // 在圆心旁边标出现在的 heading 示数
        ctx.fillStyle = "red";
        ctx.font = getFontSize(16, 8) + "px sans-serif";

        ctx.fillText(args.heading.toFixed(2), args.ox - getScaledSize(16), args.oy );

    }
}
