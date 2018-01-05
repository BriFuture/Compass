#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QFile>
#include <QTextStream>
#include "data.h"


int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);

    // using a cfg file to change mode dynamically
    QFile *file = new QFile("compass.cfg");
    int mode = 0;
    if( !file->exists() ) {
        file->open(QIODevice::WriteOnly | QIODevice::Text);
        QTextStream out(file);
        out << mode << endl;
//        file->write(modeArr.append(mode));
    } else {
        file->open(QIODevice::ReadOnly | QIODevice::Text);
        QTextStream in(file);
        mode = in.readLine().toInt();
    }

    Data *data = new Data();
    switch (mode) {
    case 1:
        data->view();
        break;
    case 0:
    default:
        data->view3D();
        break;
    }

    return app.exec();
}

