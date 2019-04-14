DISPLAY_VER = 0.0.12

DEFINES += _NO_LINK_DISPLAY_LIB DISPLAY_LIBRARY
include(./libdisplay.pri)
TEMPLATE = lib
TARGET = display

QT += core gui widgets
CONFIG += c++11

#DEFINES += QUICKVIEW
DEFINES += WEBVIEW

DESTDIR = $$PWD/lib/
CONFIG(debug, debug|release) {
    TARGET = LibDisplayd
} else {
    TARGET = LibDisplay
}

HEADERS += include/display_global.h \
    include/Displayer3d.h

contains(DEFINES, QUICKVIEW) {
QT += qml quick

# Additional import path used to resolve QML modules in Qt Creator's code model
#QML_IMPORT_PATH =

RESOURCES += qml.qrc

SOURCES += data.cpp
HEADERS += data.h

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
} # contains(DEFINES, QUICKVIEW)
contains(DEFINES, WEBVIEW) {
#message($$DEFINES)

QT += websockets
QT += webenginewidgets

RESOURCES += web.qrc

SOURCES += src/WebDataFeeder.cpp \
    src/TestFeeder.cpp

HEADERS += include/WebDataFeeder.h \
    include/TestFeeder.h
} #contains(DEFINES, WEBVIEW)

RC_FILE = icon.rc

SOURCES += \
    src/Displayer3d.cpp
