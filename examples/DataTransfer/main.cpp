#include "MainWindow.h"
#include <QApplication>
#include <Displayer3d.h>
#include <WebDataFeeder.h>
#include <QTcpSocket>
#include <QJsonDocument>
#include <QJsonObject>

#define REMOTE_PORT 8811

class DataRecver:public QObject {

public:
    void init() {
        m_socket.connectToHost("localhost", REMOTE_PORT);
        connect(&m_socket, &QTcpSocket::readyRead, this, &DataRecver::read);
    }
    WebDataFeeder *feeder() const;
    void setFeeder(WebDataFeeder *feeder);

public Q_SLOTS:
    void read() {
        QByteArray tmpData = m_socket.readAll(); // format is: { "heading": 0, "pitch": 0 ...}
        QJsonDocument doc = QJsonDocument::fromJson(tmpData);
        QJsonObject obj = doc.object();
//        qDebug() << doc;
        m_feeder->setHprData(obj.value("heading").toDouble(),
                             obj.value("pitch").toDouble(),
                             obj.value("roll").toDouble());
    }

private:
    WebDataFeeder *m_feeder;
    QTcpSocket m_socket;
};


WebDataFeeder *DataRecver::feeder() const
{
    return m_feeder;
}

void DataRecver::setFeeder(WebDataFeeder *feeder)
{
    m_feeder = feeder;
}

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
//    MainWindow w;
//    w.show();
    DataRecver *dr = new DataRecver();

//    /*
    Displayer3D *displayer = new Displayer3D(0);
    bool inited = displayer->init();
    if(inited) {
        displayer->show();
    }
    dr->setFeeder(displayer->getDataFeeder());

    QObject::connect(displayer, &Displayer3D::closed, dr, &QObject::deleteLater);
    QObject::connect(displayer, &Displayer3D::closed, &a, &QApplication::quit);
//*/
    dr->init();
    int result = a.exec();
//    delete displayer;
    return result;
}

