TEMPLATE = app

QT += qml quick core gui
CONFIG += c++11

SOURCES += main.cpp \
    data.cpp

RESOURCES += qml.qrc

# Additional import path used to resolve QML modules in Qt Creator's code model
QML_IMPORT_PATH =

# Default rules for deployment.
include(deployment.pri)

DISTFILES +=

HEADERS += \
    data.h

RC_FILE = icon.rc
