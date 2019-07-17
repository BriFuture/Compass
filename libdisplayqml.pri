CONFIG += c++11
QT += printsupport
QT += qml quick

contains(DEFINES, _NO_LINK_DISPLAY_LIB) {
} else {
LIBS += -L"$$PWD/lib"

CONFIG(debug, debug|release) {
    LIBS += -l"QmlLibDisplayd"
    DEFINES += _DISPLAY_DEBUG
} else {
    LIBS += -l"QmlLibDisplay"
    DEFINES += _DISPLAY_RELEASE
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
