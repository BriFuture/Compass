#include "DataGenerator.h"

#ifdef RAND_MAX
#undef RAND_MAX
#endif

#define RAND_MAX 180

#define rate 4800

#define MemorySize 1024

DataGenerator::DataGenerator(QObject *parent) : QObject(parent)
{
    memory.setKey("SharedMemoryTransfer");
    bool created = memory.create(MemorySize);
    if(!created) {
        qWarning() << "SharedMemory created error. Try to attach";
        bool attached = memory.attach();
        if(attached) {
            init();
        } else {
            qWarning() << "SharedMemory attached error.";
        }
    } else {
        qInfo() << "SharedMemory created.";
        init();
    }
}

void DataGenerator::onGen()
{
    heading += double(qrand()) / rate;
    pitch += double(qrand()) / rate;
    roll  += double(qrand()) / rate;
    if(heading > 359.9) {
        heading = 0.0;
    } else if(heading < 0.1) {
        heading = 360;
    }
    if(roll > 359.9) {
        roll = 0.0;
    } else if(roll < 0.1) {
        roll = 360;
    }
    if(pitch > 89.9) {
        pitch = -90.0;
    } else if(pitch < -89.9) {
        pitch = 90.0;
    }
    QString data = QString("{ \"heading\": %1, \"pitch\": %2, \"roll\": %3 }")
            .arg(heading).arg(pitch).arg(roll);
    QByteArray bytedata = data.toLatin1();
    qDebug() << bytedata.left(150);
    memory.lock();
    // bytedata.length 会导致上一次的数据不会被完全清除
//    memcpy(memory.data(), bytedata.data(), bytedata.length());
    memcpy(memory.data(), bytedata.data(), MemorySize);
    memory.unlock();
}

void DataGenerator::init()
{
    timer.setSingleShot(false);
    connect(&timer, &QTimer::timeout, this, &DataGenerator::onGen);
    timer.start(100);
}
