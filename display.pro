TEMPLATE = app

QT += qml quick core gui  webenginewidgets websockets
CONFIG += c++11

SOURCES += main.cpp \
    data.cpp \
    WebDataFeeder.cpp \
    Feeder.cpp

RESOURCES += qml.qrc

# Additional import path used to resolve QML modules in Qt Creator's code model
QML_IMPORT_PATH =

# Default rules for deployment.
include(deployment.pri)

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

HEADERS += \
    data.h \
    WebDataFeeder.h \
    Feeder.h

RC_FILE = icon.rc
