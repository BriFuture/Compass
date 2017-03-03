import QtQuick 2.0
Item {
    width: 100; height: 100
    visible: true
    Rectangle {
        anchors.fill: parent
        objectName: "rect"
    }

    Rectangle {
        id: rect
        signal buttonClicked

        color: "red"
        width: 180
        height: 140

        MouseArea {
            anchors.fill: parent
            onClicked: rect.buttonClicked()
        }

        Text {
            id: btnText
            anchors.centerIn: parent
            color: "black"
            z: 100
            text: rect.btntext
        }
        property string btntext: "Button"

    }
}
