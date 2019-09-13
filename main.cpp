#ifdef QUICKVIEW
#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include "QuickViewData.h"

int main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);

//    qmlRegisterType<FileContent>("dis.filecontent", 1, 0, "FileContentItem");

    QuickViewData *data = new QuickViewData();
    data->show();

    return app.exec();
}
#endif
// ifdef QUICKVIEW
#ifdef WEBVIEW
#ifdef _MSC_VER
#pragma execution_character_set("utf-8")
#endif

#include <QApplication>
#include <QTimer>
#include <QSettings>
#include <QDir>
#include <QDebug>

#include "TestFeeder.h"
#include "Displayer3d.h"

int main(int argc, char *argv[])
{
    QApplication app(argc, argv);
    QDir::setCurrent(app.applicationDirPath());
    QSettings setting("display.ini", QSettings::IniFormat);
    bool mock = setting.value("mock_data", false).toBool();
    Displayer3D displayer;
    TestFeeder *fe = new TestFeeder(displayer.getDataFeeder());
    if(mock) {
        fe->start();
//        fe->setRate(6400);
        qInfo() << "启用模拟数据";
    } else {
        setting.setValue("mock_data", false);
    }
    displayer.init();
    displayer.show();
    QObject::connect(&displayer, &Displayer3D::closed, fe, &TestFeeder::stop);
    QObject::connect(&displayer, &Displayer3D::closed, &app, &QApplication::quit);
    int res = app.exec();

    delete fe;

    return res;
}

#endif


