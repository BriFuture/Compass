DISPLAY_VER = 0.0.12

DEFINES += WEBCOMPASS_LIBRARY
include(./webcompass.pri)
TEMPLATE = lib
TARGET = display

QT += core gui widgets
CONFIG += c++11

DEFINES += WEBVIEW

DESTDIR = $$PWD/lib/
CONFIG(debug, debug|release) {
    TARGET = WebCompassd
} else {
    TARGET = WebCompass
}

INCLUDEPATH += $$PWD/include
DEPENDPATH += .

HEADERS += include/display_global.h \
    include/Displayer3d.h

SOURCES += \
    src/Displayer3d.cpp

SOURCES += src/WebDataFeeder.cpp \
    src/TestFeeder.cpp

HEADERS += include/WebDataFeeder.h \
    include/TestFeeder.h

#message($$DEFINES)

RESOURCES += wc_web.qrc

RC_FILE = icon.rc


