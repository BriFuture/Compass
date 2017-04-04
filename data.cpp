#include "data.h"
#include <QPixmap>
#include <QQmlApplicationEngine>

Data::Data() {
    heading = 0;
}


void Data::view() {
    QQuickView *compassview = new QQuickView;
    compassview->setSource(QUrl(QStringLiteral("qrc:/qml/Compass.qml")));
//    compassview->setSource(QUrl(QStringLiteral("qrc:/ThreeD.qml")));
//    compassview->rootContext()->setContextProperty("dataRadius", this);
    QQmlContext *context = compassview->rootContext();
    context->setContextProperty("dataSource", this);
    // 设置窗口图标
    QIcon icon = QIcon(QStringLiteral(":/img/compass.ico"));
    compassview->setIcon(icon);
//    compassview->set
    // 设置窗口缩放时，根对象也会随之缩放
    compassview->setResizeMode(QQuickView::SizeRootObjectToView);
    compassview->setTitle("Compass heading pitch & roll");
    compassview->show();

//        QQmlApplicationEngine engine;
//        engine.load(QUrl(QStringLiteral("qrc:/Test.qml")));
}

void Data::view3D() {
    QQuickView *compassview = new QQuickView;

    compassview->setSource(QUrl(QStringLiteral("qrc:/qml/SpacePath.qml")));
//    compassview->rootContext()->setContextProperty("dataRadius", this);
    QQmlContext *context = compassview->rootContext();
    context->setContextProperty("dataSource", this);
    // 设置窗口图标
    QIcon icon = QIcon(QStringLiteral(":/img/compass.ico"));
    compassview->setIcon(icon);
//    compassview->set
    // 设置窗口缩放时，根对象也会随之缩放
    compassview->setResizeMode(QQuickView::SizeRootObjectToView);
    compassview->setTitle("3D Viewer");
    compassview->show();
}

double Data::getRadius() {
    return 125.0;
}

double Data::getHeading() {
    return heading++;
}

double Data::getPitch() {
    return heading++;
}

double Data::getRoll() {
    return heading++;
}

double* Data::getData() {
    double *d = new double[3];
    return  d;
}

