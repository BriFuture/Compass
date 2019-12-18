QT += printsupport
QT += qml quick

!contains(DEFINES, DISPLAY_LIBRARY) {
LIBS += -L"$$PWD/lib"

CONFIG(debug, debug|release) {
    LIBS += -l"QmlCompassd"
} else {
    LIBS += -l"QmlCompass"
}# CONFIG(debug, debug|release)
}

CONFIG += debug_and_release
