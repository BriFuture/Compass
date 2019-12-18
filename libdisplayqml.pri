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

CONFIG += debug_and_release
