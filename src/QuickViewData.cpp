#include "QuickViewData.h"
#include <QQmlApplicationEngine>
#include <QDebug>
#include <QSettings>
#include <QtGlobal>
#include <QTimer>

QuickViewData::QuickViewData(QWindow *parent) : QQuickView( parent ) {
    heading = 0;
    pitch = 0;
    roll = 0;
    qDebug() << "[Info] Start to Show!" ;

    this->rootContext()->setContextProperty("dataSource", this);
    this->rootContext()->setContextProperty("window", this);
    QIcon icon = QIcon(QStringLiteral(":/img/compass.ico"));
    this->setIcon(icon);
    // 设置窗口缩放时，根对象也会随之缩放
    this->setResizeMode(QQuickView::SizeRootObjectToView);
    this->setTitle("Compass heading pitch & roll");

    // using a cfg file to change mode dynamically
    QSettings setting( "compass.ini", QSettings::IniFormat, this );
    int mode = setting.value( "mode", 0 ).toInt();

    QUrl source;
    switch (mode) {
    case 1:
        source = QUrl( "qrc:/qml/Compass.qml" );
        break;
    case 0:
    default:
        source = QUrl( "qrc:/qml/SpacePath.qml" );
        break;
    }
    this->setSource( source );

    int interval = setting.value( "interval", 500 ).toInt();
    QTimer *timer = new QTimer( this );
    connect( timer, &QTimer::timeout, this, &QuickViewData::changeData );
    timer->setInterval( interval );
//    timer->start( 100 );
}

QuickViewData::~QuickViewData() {
}

bool QuickViewData::event(QEvent *event) {
    if( event->type() == QEvent::Close ) {
        // on my deepin system, the program always quit with segment fault
        // so it is used to tell Qt to delete itself without error
        this->deleteLater();
        return false;
    }
    return QQuickView::event( event );
}

double QuickViewData::getHeading() {
    return heading;
}

double QuickViewData::getPitch() {
    return pitch;
}

double QuickViewData::getMagicVectorLength() {
    return 10000*(4);
}

double QuickViewData::getRoll() {
    return roll;
}

void QuickViewData::changeData() {
    double weight = 0.00003;
    pitch   += 0.2274 + qrand() * weight;
    heading += 0.5252 + qrand() * weight;
    roll    += 1.3417 + qrand() * weight;
    emit dataChanged();
}

