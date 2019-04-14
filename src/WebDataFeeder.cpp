#include <WebDataFeeder.h>
#include <QJsonDocument>
const int WebDataFeeder::Port = 4900;

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
    if(m_server != 0) {
        return;
    }
    m_server = new QWebSocketServer("localhost", QWebSocketServer::NonSecureMode, this);
    if(m_server->listen(QHostAddress::Any, Port)) {
        connect(m_server, &QWebSocketServer::newConnection, this, &WebDataFeeder::onNewConnection);
        qInfo() << "[WebDataFeeder] Server listening on port: " << Port;
//        connect(m_server, &QWebSocketServer::sslErrors, this, &WebDataFeeder::onSslErrors);
    }
    // 延迟一秒，防止 WebSocketServer 没有准备好
    QTimer::singleShot(1000, this, &WebDataFeeder::ready);
//    emit ready();
}


void WebDataFeeder::onNewConnection()
{
    qDebug() << "[WebDataFeeder] Client connected:" ;
    QWebSocket *pSocket = m_server->nextPendingConnection();

    qDebug() << "[WebDataFeeder] Client connected:" << pSocket;

    connect(pSocket, &QWebSocket::textMessageReceived, this, &WebDataFeeder::processTextMessage);
    connect(pSocket, &QWebSocket::binaryMessageReceived, this, &WebDataFeeder::processBinaryMessage);
    connect(pSocket, &QWebSocket::disconnected, this, &WebDataFeeder::socketDisconnected);
    //connect(pSocket, &QWebSocket::pong, this, &SslEchoServer::processPong);
//    m_clients << pSocket;
    m_curClient = pSocket;
}

void WebDataFeeder::processTextMessage(QString message)
{
    if(processor) {
        processor->process(message);
    }
//    Q_UNUSED(message)
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
    qDebug() << "[WebDataFeeder] Client disconnected";
//    QWebSocket *pClient = qobject_cast<QWebSocket *>(sender());
//    if (pClient)
//    {
//        m_clients.removeAll(pClient);
//        pClient->deleteLater();
//    }
}

DataProcessInterface *WebDataFeeder::getProcessor() const
{
    return processor;
}

void WebDataFeeder::setProcessor(DataProcessInterface *value)
{
    processor = value;
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
    if(m_curClient) {
//        qDebug() << "[WebDataFeeder] Send msg" << hprData;
        m_curClient->sendTextMessage(QJsonDocument(hprData).toJson());
//        qDebug() << "[WebDataFeeder] After Send msg" << hprData;
    }
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
