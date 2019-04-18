#include "MainWindow.h"
#include <QApplication>
#include <Displayer3d.h>
#include <WebDataFeeder.h>
#include <QTcpSocket>
#include <QJsonDocument>
#include <QJsonObject>
#include <QWebEngineSettings>

#include <QDebug>

#define REMOTE_PORT 8811

/** 通过串口传递数据
 */

class DataRecver:public QObject {

public:
    bool init() {
        displayer = new Displayer3D(0);
        bool inited = displayer->init();
        if(inited) {
    //        displayer->getView()->settings()->setAttribute( QWebEngineSettings::Accelerated2dCanvasEnabled, false);
            displayer->show();
            QObject::connect(displayer, &Displayer3D::closed, this, &QObject::deleteLater);

            m_socket.connectToHost("localhost", REMOTE_PORT);
            connect(displayer->getView(), &QWebEngineView::loadFinished, [=] {
                connect(&m_socket, &QTcpSocket::readyRead, this, &DataRecver::read);
            });
            m_feeder = displayer->getDataFeeder();
        }
        return inited;
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
public:
    Displayer3D *displayer;
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
    DataRecver *dr = new DataRecver();

    if(dr->init()) {
        QObject::connect(dr->displayer, &Displayer3D::closed, &a, &QApplication::quit);
        int result = a.exec();
        return result;
    }
    return 1;
}

