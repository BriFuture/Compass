#include "Feeder.h"
#include <QThread>
Feeder::Feeder(QObject *parent) : QObject(parent)
{

}

void Feeder::simulate()
{
    heading += qrand() / rate;
    pitch += qrand() / rate;
    roll += qrand() / rate;
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
        pitch = 90;
    }
    wdf.setHprData(heading, pitch, roll);
    QThread::msleep(1);
    if(auto_action) {
        counter += 1;
        if(counter == 50) {
            wdf.setAction(true, true, true);
            QThread::msleep(1);
            counter = 0;
        }
        if(counter % 10 == 0) {
            wdf.setAction(true, false, false);
            QThread::msleep(1);
        }
    }
}

int Feeder::getRate() const
{
    return rate;
}

void Feeder::setRate(int value)
{
    if(value < 0){
        return;
    }
    rate = value;
}
void Feeder::start()
{
    wdf.init();
//     avoid crash
//    QThread::msleep(100);

    timer.setInterval(300);

    connect(&timer, &QTimer::timeout, this, &Feeder::simulate);
//    timer.start();
    QTimer::singleShot(1500, &timer, SLOT(start()));
}
