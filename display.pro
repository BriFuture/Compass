TEMPLATE = app

QT += qml quick core gui
CONFIG += c++11

SOURCES += main.cpp \
    data.cpp \
    filecontent.cpp

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
    qml/SpacePath.js \
    qml/Compass.qml \
    qml/ScrollBar.qml \
    qml/SpacePath.qml

HEADERS += \
    data.h \
    filecontent.h

RC_FILE = icon.rc
