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
#include <QApplication>
#include <QWebEngineView>
#include <QWebEnginePage>
int main(int argc, char *argv[])
{
    QApplication app(argc, argv);

    QWebEngineView *view = new QWebEngineView();
//    view->load(QUrl("http://localhost:8080/"));
    QWebEnginePage *page = new QWebEnginePage(view);
//    page->load(QUrl("http://localhost:8080"));
    page->load(QUrl("qrc:/html/index.html"));
//    view->load(QUrl("qrc:/html/index.html"));
    view->setPage(page);
    view->resize(1024, 768);
    view->show();

    int res = app.exec();
    delete view;
    return res;
}

#endif


