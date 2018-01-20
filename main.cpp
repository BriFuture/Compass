#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include "filecontent.h"
#include "data.h"


int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);

    qmlRegisterType<FileContent>("dis.filecontent", 1, 0, "FileContentItem");

    Data *data = new Data();
//    data->show();

    return app.exec();
}

