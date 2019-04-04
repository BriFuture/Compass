#define WEBVIEW

#ifndef WEBVIEW
#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include "data.h"

int old_main(int argc, char *argv[])
{
    QGuiApplication app(argc, argv);

//    qmlRegisterType<FileContent>("dis.filecontent", 1, 0, "FileContentItem");

    Data *data = new Data();
    data->show();

    return app.exec();
}
#else

#ifdef _MSC_VER
#pragma execution_character_set("utf-8")
#endif

#define VIEW
#include <QApplication>
#include <QWebEngineView>
#include <QWebEnginePage>
#include <QTimer>
#include <QSettings>
#include <QDir>
#include <QDebug>

#include "Feeder.h"

int main(int argc, char *argv[])
{
    QApplication app(argc, argv);
    QDir::setCurrent(app.applicationDirPath());
    QSettings setting("display.ini", QSettings::IniFormat);
    bool mock = setting.value("mock_data", false).toBool();
    Feeder *fe = new Feeder();
    if(mock) {
        fe->start();
//        fe->setRate(6400);
        qInfo() << "启用模拟数据";
    } else {
        setting.setValue("mock_data", false);
    }
#ifdef VIEW
    QWebEngineView *view = new QWebEngineView();
//    view->load(QUrl("http://localhost:8080/"));
    QWebEnginePage *page = new QWebEnginePage(view);
//    page->load(QUrl("http://localhost:8080"));
    page->load(QUrl("qrc:/html/index.html"));
//    view->load(QUrl("qrc:/html/index.html"));
    view->setPage(page);
    view->resize(1024, 768);
    view->show();
#endif

    int res = app.exec();

#ifdef  VIEW
    delete view;
#endif
    delete fe;

    return res;
}

#endif


