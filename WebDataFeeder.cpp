#include "WebDataFeeder.h"
const int WebDataFeeder::Port = 4900;
#include <QJsonDocument>

WebDataFeeder::WebDataFeeder(QObject *parent) : QObject(parent)
{
    hprData.insert("type", QJsonValue("feedHPR"));
    action.insert("type", QJsonValue("action"));
}

WebDataFeeder::~WebDataFeeder()
{
    if(m_server)
        m_server->close();
    qDeleteAll(m_clients.begin(), m_clients.end());
}

void WebDataFeeder::init()
{
    m_server = new QWebSocketServer("localhost", QWebSocketServer::NonSecureMode, this);
    if(m_server->listen(QHostAddress::Any, Port)) {
        qInfo() << "WebSocket Server listening on port: " << Port;
        connect(m_server, &QWebSocketServer::newConnection, this, &WebDataFeeder::onNewConnection);
//        connect(m_server, &QWebSocketServer::sslErrors, this, &WebDataFeeder::onSslErrors);
    }
}


void WebDataFeeder::onNewConnection()
{
    QWebSocket *pSocket = m_server->nextPendingConnection();

    qDebug() << "Client connected:" << pSocket->peerName() << pSocket->origin();

    connect(pSocket, &QWebSocket::textMessageReceived, this, &WebDataFeeder::processTextMessage);
    connect(pSocket, &QWebSocket::binaryMessageReceived, this, &WebDataFeeder::processBinaryMessage);
    connect(pSocket, &QWebSocket::disconnected, this, &WebDataFeeder::socketDisconnected);
    //connect(pSocket, &QWebSocket::pong, this, &SslEchoServer::processPong);
//    m_clients << pSocket;
    m_curClient = pSocket;
}

void WebDataFeeder::processTextMessage(QString message)
{
    Q_UNUSED(message)
//    QWebSocket *pClient = qobject_cast<QWebSocket *>(sender());
//    if (pClient)
//    {
//        pClient->sendTextMessage(QString("this is server: %1").arg(message));
//    }
}

void WebDataFeeder::processBinaryMessage(QByteArray message)
{
    QWebSocket *pClient = qobject_cast<QWebSocket *>(sender());
    if (pClient)
    {
        pClient->sendBinaryMessage(message);
    }
}

void WebDataFeeder::socketDisconnected()
{
    m_curClient = 0;
    qDebug() << "Client disconnected";
//    QWebSocket *pClient = qobject_cast<QWebSocket *>(sender());
//    if (pClient)
//    {
//        m_clients.removeAll(pClient);
//        pClient->deleteLater();
//    }
}

QJsonObject WebDataFeeder::getHprData() const
{
    return hprData;
}

void WebDataFeeder::setHprData(double heading, double pitch, double roll)
{
    hprData.insert("heading", QJsonValue(heading));
    hprData.insert("pitch", QJsonValue(pitch));
    hprData.insert("roll", QJsonValue(roll));
    if(m_curClient)
        m_curClient->sendTextMessage(QJsonDocument(hprData).toJson());
//    foreach(auto sock, m_clients) {
//        sock->sendTextMessage(QJsonDocument(hprData).toJson());
//    }
}

void WebDataFeeder::setAction(bool record, bool resetRecord, bool resetPath)
{
    action.insert("idx", QJsonValue(idx));
    action.insert("record", QJsonValue(record));
    action.insert("resetRecord", QJsonValue(resetRecord));
    action.insert("resetPath", QJsonValue(resetPath));
    if(m_curClient)
        m_curClient->sendTextMessage(QJsonDocument(action).toJson());
//    foreach(auto sock, m_clients) {
//        sock->sendTextMessage(QJsonDocument(action).toJson());
//    }

}
