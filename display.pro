TEMPLATE = app
TARGET = display
QT += core gui widgets
CONFIG += c++11

#DEFINES += QUICKVIEW
DEFINES += WEBVIEW
INCLUDEPATH += include
## Default rules for deployment.
#include(deployment.pri)

contains(DEFINES, QUICKVIEW) {
QT += qml quick

# Additional import path used to resolve QML modules in Qt Creator's code model
#QML_IMPORT_PATH =
VERSION = 1.0.0.0
RESOURCES += qml.qrc

SOURCES += src/QuickViewData.cpp
HEADERS += include/QuickViewData.h

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
message($$DEFINES)

QT += websockets
QT += webenginewidgets

RESOURCES += web.qrc
VERSION = 1.0.0.1

SOURCES += src/WebDataFeeder.cpp \
    src/TestFeeder.cpp \
    src/Displayer3d.cpp

HEADERS += include/WebDataFeeder.h \
    include/TestFeeder.h \
    include/Displayer3d.h
} #contains(DEFINES, WEBVIEW)

SOURCES += main.cpp

RC_FILE = icon.rc
