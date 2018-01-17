#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QtQml>
#include "data.h"
#include "filecontent.h"


int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);

    qmlRegisterType<FileContent>("cn.zbrifuture.qt.filecontent", 1, 0, "FileContentItem");
    Data *data = new Data();
//    data->show();

    return app.exec();
}

