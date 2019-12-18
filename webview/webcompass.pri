####################
# Webview version of 3D Program Library
# See more examples under directory `example/`
# Author: BriFuture
# Date: 2019/05/02
####################
CONFIG += c++11
QT += printsupport
QT += websockets webenginewidgets

!contains(DEFINES, WEBCOMPASS_LIBRARY) {
LIBS += -L"$$PWD/lib"
CONFIG(debug, debug|release) {
    LIBS += -l"WebCompassd"
} else {
    LIBS += -l"WebCompass"
}# CONFIG(debug, debug|release)
}

INCLUDEPATH += $$PWD/include

CONFIG += debug_and_release
DEPENDPATH += .

MOC_DIR = ./qt/moc
RCC_DIR = ./qt/rcc/src
UI_DIR = ./qt/ui
UI_HEADERS_DIR = ./qt/ui/include
UI_SOURCES_DIR = ./qt/ui/src
