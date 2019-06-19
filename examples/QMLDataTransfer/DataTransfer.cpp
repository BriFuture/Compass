#include "DataTransfer.h"
#include "Animation.h"
#include <QJsonObject>
#include <QJsonDocument>
#include <QDebug>

DataTransfer::DataTransfer(QObject *parent) : QObject(parent),
  animation(new Animation)
{
    animation->setMinimumSize(QSize(800, 600));
    QUrl url(QStringLiteral("qrc:/qml/SpacePath.qml"));
    animation->setSource(url);

    socket = new QUdpSocket(this);
    socket->open(QUdpSocket::ReadWrite);
//    socket->setSocketOption(QUdpSocket::ReuseAddressHint, 1);
    connect(socket, &QUdpSocket::readyRead, this, &DataTransfer::recv);

}

DataTransfer::~DataTransfer()
{
    delete animation;
}

void DataTransfer::start()
{
    socket->bind(QHostAddress::Any, 16650);
    animation->show();
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

    }
}

