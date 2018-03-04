import QtQuick 2.0
import QtQuick.Controls 2.0

/**
 * author: BriFuture
 * date  : 2018.01.03
 * usage : custom slider which could be set by either slider or button,
        do not support modifying value from keyboard directly
**/
Rectangle {
    id: container
    color : "transparent"
    height: 72

    property real maxValue :  100
    property real minValue :  1
    property int  stepSize:   1
    property int  decimal:   0
    property int  ratio:      Math.pow( 10, decimal )
//    property string suffix
    property alias value:     spinBox.value
    property alias text :     desc.text
    property var   getValue: function() {
        return value / ratio
    }
    property var callback;

    Label {
        id: desc
        text: "MySlider"
        font.pixelSize: 14
        anchors {
            top: parent.top
            topMargin: 5
        }
    }

    SpinBox {
        id: spinBox

        height: 20
        anchors {
            top: desc.bottom
            topMargin: 5
            left: parent.left
            leftMargin: 5
        }

        from:  container.minValue
        to:    container.maxValue
        stepSize: container.stepSize
//        value: realValue * ratio
//        property real realValue : value / ratio

        validator: DoubleValidator {
            bottom: Math.min( spinBox.from, spinBox.to )
            top:    Math.max( spinBox.from, spinBox.to )
        }

        textFromValue: function(value, locale) {
            var t = Number( value / ratio ).toLocaleString( locale, 'f', decimal );
            return t;
        }

        valueFromText: function(text, locale) {
            var v = parseFloat( text );
//            console.log("text: ", v)
            return v;
        }
    }

    Slider {
        id: slider
        wheelEnabled: false
        signal moving();
        anchors {
            top: spinBox.bottom
            topMargin: -5
            left : container.left
            right: container.right
        }

        from:  container.minValue
        to:    container.maxValue
        value: spinBox.value
        stepSize: container.stepSize
        onValueChanged: {
            spinBox.value = value
        }

//        onMoving:
//        handle.radius: 12
    }   
}
