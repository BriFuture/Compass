#include <QGuiApplication>
#include <QQmlApplicationEngine>

#include "data.h"


int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);

    Data *data = new Data();
//    data->show();

    return app.exec();
}

