import QtQuick 2.0
import QtQuick.Controls 1.4

Rectangle {
    id: container
//    height: 50
//    width: 200
//    anchors.top: yCameraContainer.bottom
//    anchors.left: parent.left
    color: "transparent"
    property string labelText: "label"
//    property var onSliderValueChanged
    property double sliderValue: 0
    property double sliderMaxValue: 0
    property double sliderMinValue: 0
    property double sliderWidth: 0
    property alias text: textInput.text
//    onSliderValueChanged:
    Label {
        id: labelShow
        anchors.leftMargin: 5
        anchors.left: parent.left
        anchors.top: parent.top
        anchors.topMargin: 5
        height: 20
        text: container.labelText
    }
    Rectangle {
        border.color: "black"
        anchors.left: labelShow.right
        anchors.leftMargin: 5
        anchors.top: parent.top
        width: 70
        height: 20
        TextInput {
            id: textInput
            font.pointSize: 16
            anchors.fill: parent
            text: sliderValue.toFixed(2)
            validator: DoubleValidator{bottom: slider.minimumValue; top: slider.maximumValue;}
        }
    }
    Slider {
        id: slider
        anchors.top: labelShow.bottom
        width: container.sliderWidth
        orientation: Qt.Horizontal
        maximumValue: container.sliderMaxValue
        minimumValue: container.sliderMinValue
        value: container.sliderValue
        onValueChanged: {
            container.sliderValue = slider.value;
        }
    }
}
