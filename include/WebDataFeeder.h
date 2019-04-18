#ifndef WEBDATAFEEDER_H
#define WEBDATAFEEDER_H

#include <QObject>
#include <QWebSocketServer>
#include <QWebSocket>
#include <QTimer>
#include <QJsonObject>

#include "display_global.h"

class DataProcessInterface {
public:
    virtual void process(QString &msg) = 0;
};

class DISPLAY_DLL_EXPORT WebDataFeeder : public QObject
{
    Q_OBJECT
public:
    static const int Port;
    explicit WebDataFeeder(QObject *parent = 0);
    ~WebDataFeeder();

    QJsonObject getHprData() const;
    void setHprData(double heading, double pitch, double roll, double length = 4.0);
    void setAction(bool record, bool resetRecord = false, bool resetPath = false);

    DataProcessInterface *getProcessor() const;
    void setProcessor(DataProcessInterface *value);

Q_SIGNALS:
    void ready();

public Q_SLOTS:
    void init();
private Q_SLOTS:
    void onNewConnection();
    void processTextMessage(QString message);
    void processBinaryMessage(QByteArray message);
    void socketDisconnected();

private:
    QWebSocketServer *m_server = 0;
//    QWebSocket *m_webSocket = 0;
    QList<QWebSocket *> m_clients;
    QWebSocket *m_curClient = 0;

    DataProcessInterface *processor = 0;

    QJsonObject hprData;
    QJsonObject action;
    int idx = 0;
};

#endif // WEBDATAFEEDER_H
