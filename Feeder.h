#ifndef FEEDER_H
#define FEEDER_H

#include <QObject>
#include "WebDataFeeder.h"

#ifdef RAND_MAX
#undef RAND_MAX
#endif

#define RAND_MAX 180


class Feeder : public QObject
{
    Q_OBJECT
public:
    explicit Feeder(QObject *parent = 0);
    bool auto_action = false;
    int getRate() const;
    void setRate(int value);

signals:

public slots:
    void start();
    void simulate();
private:
    int rate = 4800;
    double heading = 0.0;
    double pitch = 0.0;
    double roll = 0.0;
    WebDataFeeder wdf;
    QTimer timer;
    int counter = 0;
};

#endif // FEEDER_H
