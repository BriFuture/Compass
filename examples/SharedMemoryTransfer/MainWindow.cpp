#include "MainWindow.h"

#include <QJsonDocument>

#include <QDebug>
#include <QLayout>
#define MaxSize 1024

MainWindow::MainWindow(QWidget *parent) :
    QWidget(parent)
{
    memory = new QSharedMemory("SharedMemoryTransfer", this);
    bool attached = memory->attach();
    if(!attached) {
        qWarning() << "SharedMemory attached error. tri to create one";
        bool created = memory->create(MaxSize);
        if(created) {
            init();
        } else {
            qWarning() << "SharedMemory created error. Exit.";

        }
    } else {
        init();
//        QTimer::singleShot(2000, &timer, static_cast<void (QTimer::*)(void)>(&QTimer::start));
    }
}

MainWindow::~MainWindow()
{
}

void MainWindow::readData()
{
    memory->lock();
//    buffer.setData(memory->constData(), MaxSize);
    memcpy(data.data(), memory->constData(), MaxSize);
    QByteArray tmp = data.left(data.indexOf('}') + 1);
    QJsonDocument doc = QJsonDocument::fromJson(tmp);
    QJsonObject obj = doc.object();
    heading = obj.value("heading").toDouble();
    pitch = obj.value("pitch").toDouble();
    roll = obj.value("roll").toDouble();
    length = obj.value("length").toDouble(4.0);
    displayer->getDataFeeder()->setHprData(heading, pitch, roll, length);
//    qDebug() << tmp << doc;

    memory->unlock();

}

void MainWindow::init()
{
    timer.setSingleShot(false);
    timer.setInterval(16);
    connect(&timer, &QTimer::timeout, this, &MainWindow::readData);
    displayer = new Displayer3D(this);
//    setCentralWidget(displayer->getView());
    QGridLayout *layout = new QGridLayout(this);
    layout->setMargin(0);

    bool inited = displayer->init();
    if(inited) {
        layout->addWidget(displayer->getView());
        connect(displayer->getView(), &QWebEngineView::loadFinished, &timer, static_cast<void (QTimer::*)(void)>(&QTimer::start));
//            displayer->show();
    } else {
        qWarning() << "Displayer Failed to Inited";
    }
    data.resize(MaxSize);

}
