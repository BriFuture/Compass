#include "MainWindow.h"
#include "ui_MainWindow.h"
#define REMOTE_PORT 16650

MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow)
{
    ui->setupUi(this);
}

MainWindow::~MainWindow()
{
    delete ui;
}

bool MainWindow::init()
{
    displayer = new Displayer3D(0);
    bool inited = displayer->init();
    if(inited) {
//        displayer->getView()->settings()->setAttribute( QWebEngineSettings::Accelerated2dCanvasEnabled, false);
        displayer->show();
        QObject::connect(displayer, &Displayer3D::closed, this, &QObject::deleteLater);

        m_socket.connectToHost("localhost", REMOTE_PORT);
        m_socket.write("PC:");
        QTimer::singleShot(30000, [=] {
            m_socket.write("31");
        });
        connect(displayer->getView(), &QWebEngineView::loadFinished, [=] {
            connect(&m_socket, &QTcpSocket::readyRead, this, &MainWindow::read);
        });
        m_feeder = displayer->getDataFeeder();
    }
    return inited;
}

void MainWindow::read()
{
    QByteArray tmpData = m_socket.readAll(); // format is: { "heading": 0, "pitch": 0 ...}
    QByteArrayList tmpDatas = tmpData.split('\n');
    foreach (QByteArray td, tmpDatas) {
        QJsonDocument doc = QJsonDocument::fromJson(td);
        QJsonObject obj = doc.object();
    //        qDebug() << doc;
    //   qDebug() << tmpData.data();
        ui->textEdit->append(QString(tmpData));
        double heading = obj.value("heading").toDouble();
        double pitch = obj.value("pitch").toDouble();
        double roll = obj.value("roll").toDouble();
        ui->textEdit->append(QString("H: %1, P:%2").arg(heading).arg(pitch));
        m_feeder->setHprData(heading,
                            pitch,
                            roll);
    }
}

WebDataFeeder *MainWindow::feeder() const
{
    return m_feeder;
}

void MainWindow::setFeeder(WebDataFeeder *feeder)
{
    m_feeder = feeder;
}
