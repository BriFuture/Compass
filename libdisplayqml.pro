DISPLAY_VER = 0.1.12

DEFINES += _NO_LINK_DISPLAY_LIB DISPLAY_LIBRARY
include(./libdisplayqml.pri)
TEMPLATE = lib

QT += core gui widgets
CONFIG += c++11


DESTDIR = $$PWD/lib/
CONFIG(debug, debug|release) {
    TARGET = QmlLibDisplayd
} else {
    TARGET = QmlLibDisplay
}

HEADERS += include/display_global.h \
    include/Animation.h

# Additional import path used to resolve QML modules in Qt Creator's code model
#QML_IMPORT_PATH =

RESOURCES += qml.qrc

SOURCES += \
    src/Animation.cpp
HEADERS +=

DISTFILES += \
    qml/Button.qml \
    qml/Pitch.qml \
    qml/MySlider.qml \
    qml/DataSource.js \
    qml/gl-matrix.js \
    qml/SpacePath.js \
    qml/Compass.qml \
    qml/ScrollBar.qml \
    qml/SpacePath.qml \
    qml/OBJLoader.js \
    qml/SPVertexCode.vsh \
    qml/SPFragCode.fsh

RC_FILE = icon.rc
