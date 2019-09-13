#ifndef DATAGENERATOR_H
#define DATAGENERATOR_H

#include <QObject>
#include <QSharedMemory>
#include <QDebug>
#include <QTimer>
#include <QBuffer>

class DataGenerator: public QObject
{
    Q_OBJECT
public:
    explicit DataGenerator(QObject *parent = 0);
public Q_SLOTS:

    void onGen();
protected:
    void init();
private:
    QSharedMemory memory;
    QTimer timer;
    double heading = 0.0;
    double pitch = 0.0;
    double roll = 0.0;
};


#endif // DATAGENERATOR_H
