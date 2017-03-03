import QtQuick 2.0

Item {

}

//    Rectangle {
//        color: "lightblue"
////        id: inputItem
//        width: 200
//        height: 60

//        Flow {   // 流式管理器
//            id: inputMgr
//            anchors.fill: parent
//            anchors.margins: 6
//            spacing: 15
//            Text {
//                text: "Input Pitch: "
//                font.pixelSize: 16
//                color: "black"
//            }

//            TextInput {
//                id: pitchInput
//                width: 40
//                font.pixelSize: 16
//                color: "black"
//                // 输入的数字在 -90 到 90 之间
//                validator: DoubleValidator{bottom: -90.0; top: 90.0}
//                text: "0"            // 默认俯仰角为 0
//                focus: true
//            }

//            Text {
//                text: "Input Roll:  "
//                font.pixelSize: 16
//                color: "black"
//            }

//            TextInput {
//                id: rollInput
//                width: 40
//                font.pixelSize: 16
//                color: "black"
//                // 输入的数字在 0 到 360 之间
//                validator: DoubleValidator{bottom: 0.0; top: 360.0}
//                text: "0"            // 默认俯仰角为 0
//                focus: true
//            }


//        }
//        Button {

//            anchors.left: inputMgr.right
//            anchors.leftMargin: 8
//            anchors.top: parent.top
//            anchors.topMargin: 10
//            color: "blue"
//            btntext: "input"
//            property real pitch: 0
//            property real roll: 0
//            onButtonClicked: {
//                console.log("Button clicked!")
//                // pitch 绝对值不能超过 90
//                pitch = parseFloat(pitchInput.text)
//                if(Math.abs(pitch) > 180) {
//                    pitch = pitch / Math.abs(pitch) * 180;
//                }
//                pitchInput.text = pitch

//                // roll 值在 [0, 360) 之间
//                roll = parseFloat(rollInput.text)
//                if(roll < 0) {
//                    roll = 0
//                } else if (roll > 360) {
//                    roll = 360
//                }
//                rollInput.text = roll
//                // 重新绘制
//                pitchCanvas.requestPaint()
//                // 旋转图像
//                rotateRoll(roll)
//                // 更新显示文字
//                displayText.text = "俯仰角为：" + pitch + "\n横滚角：" + roll
//            }
//        }
//    }
