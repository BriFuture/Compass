#include <QGuiApplication>
#include <QQmlApplicationEngine>

#include "data.h"


int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);

    QQmlApplicationEngine engine;
    engine.load(QUrl(QStringLiteral("qrc:/Test.qml")));
//    engine.load(QUrl(QStringLiteral("qrc:/Pitch.qml")));

//    Data *data = new Data();
//    data->view();


    return app.exec();
}

