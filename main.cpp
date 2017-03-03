#include <QGuiApplication>
#include <QQmlApplicationEngine>
//#include "test.h"

void run() {
    QQmlApplicationEngine engine;
    engine.load(QUrl(QStringLiteral("qrc:/Pitch.qml")));
}

int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);

    QQmlApplicationEngine engine;
//    engine.load(QUrl(QStringLiteral("qrc:/main.qml")));
    engine.load(QUrl(QStringLiteral("qrc:/Pitch.qml")));


    return app.exec();
}

