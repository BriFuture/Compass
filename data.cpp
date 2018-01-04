#include "data.h"
#include <QPixmap>
#include <QQmlApplicationEngine>
#include <time.h>
#include <QDebug>
#include <QTimer>

Data::Data() {
    heading = 0;
    pitch = 0;
    roll = 0;
    srand((unsigned) time(NULL));
}

Data::~Data() {
    delete compassview;
}


void Data::view() {
    compassview = new QQuickView;
    compassview->rootContext()->setContextProperty("dataSource", this);
    compassview->rootContext()->setContextProperty("windowContainer", compassview);
    compassview->setSource(QUrl(QStringLiteral("qrc:/qml/Compass.qml")));
    // 设置窗口图标
    QIcon icon = QIcon(QStringLiteral(":/img/compass.ico"));
    compassview->setIcon(icon);
    // 设置窗口缩放时，根对象也会随之缩放
    compassview->setResizeMode(QQuickView::SizeRootObjectToView);
    compassview->setTitle("Compass heading pitch & roll");
    compassview->show();
}

void Data::view3D() {
    compassview = new QQuickView;
    compassview->rootContext()->setContextProperty("dataSource", this);
    compassview->rootContext()->setContextProperty("windowContainer", compassview);
//    compassview->setSource(QUrl(QStringLiteral("qrc:/qml/SpacePathHUD.qml")));
    compassview->setSource(QUrl(QStringLiteral("qrc:/qml/SpacePath.qml")));
    // 设置窗口图标
    QIcon icon = QIcon(QStringLiteral(":/img/compass.ico"));
    compassview->setIcon(icon);
//    compassview->set
    // 设置窗口缩放时，根对象也会随之缩放
    compassview->setResizeMode(QQuickView::SizeRootObjectToView);
    compassview->setTitle("Space State");
    compassview->show();
}



double Data::getRadius() {
    emit headingChanged();
    return 125.0;
}

double Data::getHeading() {
    heading +=  0.5252;
//    return heading;
    return 0;
}

double Data::getPitch() {
    pitch += 0.2274;
//    qDebug() << rand()*052;
//    return pitch;
    return 0;
}

double Data::getMagicVectorLength() {
    return 10000*(4);
}

double Data::getRoll() {
    roll += 2.3417;
    return roll;
}

double* Data::getData() {
    double *d = new double[3];
    return  d;
}

