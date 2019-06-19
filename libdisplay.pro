DISPLAY_VER = 0.0.12

DEFINES += _NO_LINK_DISPLAY_LIB DISPLAY_LIBRARY
include(./libdisplay.pri)
TEMPLATE = lib
TARGET = display

QT += core gui widgets
CONFIG += c++11

DEFINES += WEBVIEW

DESTDIR = $$PWD/lib/
CONFIG(debug, debug|release) {
    TARGET = LibDisplayd
} else {
    TARGET = LibDisplay
}

HEADERS += include/display_global.h \
    include/Displayer3d.h


#message($$DEFINES)

QT += websockets
QT += webenginewidgets

RESOURCES += web.qrc

SOURCES += src/WebDataFeeder.cpp \
    src/TestFeeder.cpp

HEADERS += include/WebDataFeeder.h \
    include/TestFeeder.h

RC_FILE = icon.rc

SOURCES += \
    src/Displayer3d.cpp
