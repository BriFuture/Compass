#include "DataTransfer.h"
#include <QJsonObject>
#include <QJsonDocument>
#include <QDebug>
#include <QQmlEngine>

DataTransfer::DataTransfer(QObject *parent) : QObject(parent),
  animation(new Animation)
{    
    socket = new QUdpSocket(this);
    socket->open(QUdpSocket::ReadWrite);
    connect(socket, &QUdpSocket::readyRead, this, &DataTransfer::recv);

    animation->setMinimumSize(QSize(800, 600));
}

DataTransfer::~DataTransfer()
{
//    stop();
//    qDebug() << "DT: Before delete animation";
//    animation->destroy();
//    qDebug() << "DT: After delete animation";
}

void DataTransfer::start(int port)
{
    if(port == 0)
        port = 16656;
    socket->bind(QHostAddress::LocalHost, port, QUdpSocket::ReuseAddressHint);
    //    animation->show();
}

void DataTransfer::stop()
{
    socket->close();
    disconnect(socket, &QUdpSocket::readyRead, this, &DataTransfer::recv);
}

void DataTransfer::refreshAnimation()
{
    animation->engine()->clearComponentCache();
    QUrl url(QStringLiteral("qrc:/DisplayCompass/qml/SpacePath.qml"));
    animation->setSource(url);
}

void DataTransfer::recv()
{
    // format is: { "heading": 0, "pitch": 0 ...}
    QByteArray datagram;
    while(socket->hasPendingDatagrams()) {
        int size = socket->pendingDatagramSize();
        datagram.resize(size);
        socket->readDatagram(datagram.data(), size);
//        qDebug() << "recv" << datagram;
        QJsonDocument doc = QJsonDocument::fromJson(datagram);
        QJsonObject obj = doc.object();
//        qDebug() << doc;
        QString type = obj.value("type").toString();
        if(type == "data") {
            double heading = obj.value("heading").toDouble();
            double pitch = obj.value("pitch").toDouble();
            double roll = obj.value("roll").toDouble();
            double length = obj.value("length").toDouble() * 10000;

            animation->setParam(heading, pitch, roll, length);
        } else if(type == "point") {
            QString action = obj.value("action").toString();
            if(action == "remove") {
                int i = obj.value("index").toInt();
                animation->removeRecordPoint(i);
            } else if(action == "record") {
                animation->toRecord();
            }
        } else if(type == "state") {
            QString title = obj.value("title").toString();
            bool threed = obj.value("threeD").toBool();
            animation->setTitle(title);
            animation->threeDPropertyChanged(threed);
        }
//        else if(type == "curve_data") {
//            BcCurve::Data d;
//            d.x = obj.value("x").toDouble();
//            d.y = obj.value("y").toDouble();
//            d.z = obj.value("z").toDouble();
//            ui_curve->showDataOnPlot(d);
//        }

    }
}
