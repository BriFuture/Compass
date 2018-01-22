import QtQuick 2.0
import QtQuick.Controls 1.4

/**
 * author: BriFuture
 * date  : 2018.01.03
 * usage : custom slider which could be set by either slider or button,
        do not support modifying value from keyboard directly
**/
Rectangle {
    id: container
    color : "transparent"
    height: 50

    property int ratio : 1
    property int precision  : 1
    property alias maxValue : slider.maximumValue
    property alias minValue : slider.minimumValue
    property alias text :     name.text
    property alias value:     slider.value
    property alias stepSize:  slider.stepSize
    property double btnSize:  1.0

    Label {
        id: name
        text: "MySlider"
        font.pixelSize: 18
        anchors {
            top: container.top
            topMargin: 5
        }
    }

    Text {
        // for value showing
        id: value
        anchors {
            top : container.top
            topMargin: 5
            right: incBtn.left
            rightMargin: 15
        }
        text: "0"
        font.pixelSize: 18
    }

    Button {
        // this is for value increment
        id: incBtn
        anchors {
            top : container.top
            right: container.right
            rightMargin: 5
        }

        height: container.height * 0.36
        width : 20
        text  : "+"
        onClicked: btnClick(1)
    }

    Button {
        // this is for value decrement
        id: decBtn
        anchors {
            top: incBtn.bottom
            topMargin: container.height * 0.05
            right: container.right
            rightMargin: 5
        }
        height: incBtn.height
        width : incBtn.width
        text  : "-"
        onClicked: btnClick(-1)
    }

    Slider {
        id: slider
        anchors {
            top  : decBtn.bottom
            left : container.left
            right: container.right
        }
        onValueChanged: {
            value.text = (this.value * container.ratio).toFixed(container.precision)
        }
    }

    function btnClick(op) {
        // an bug occured when btnSize was less or equal than 0.05, because of
        // parseFloat will return a value which containes only one decimal fraction
        var v = parseFloat(value.text);
        v += op*container.btnSize;
        // in case of out of range
        if( v > container.maxValue || v < container.minValue ) {
            v -= op;
        }
        // because of slider being binded to text, just set slider will be fine
        slider.value = v;
    }
}
