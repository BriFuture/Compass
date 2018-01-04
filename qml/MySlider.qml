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
    height: 40

    property int ratio : 1
    property alias maxValue : slider.maximumValue
    property alias minValue : slider.minimumValue
    property alias text :     name.text
    property double value:     slider.minimumValue
    property alias stepSize:  slider.stepSize

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
            top  : name.bottom
            topMargin: 6
            left : container.left
            right: container.right
        }
        property alias value: container.value
        onValueChanged: {
            value.text = this.value.toFixed(1)
        }
    }

    function btnClick(op) {
        var v = parseFloat(value.text);
        v += op;
        // in case of out of range
        if( v > container.maxValue || v < container.minValue ) {
            v -= op;
        }
        // because of slider being binded to text, just set slider will be fine
        slider.value = v;
    }
}
