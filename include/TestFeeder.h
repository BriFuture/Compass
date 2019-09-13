#ifndef FEEDER_H
#define FEEDER_H

#include <QObject>
#include <QTimer>
#include "WebDataFeeder.h"
#ifdef RAND_MAX
#undef RAND_MAX
#endif

#define RAND_MAX 180


class TestFeeder : public QObject
{
    Q_OBJECT
public:
    explicit TestFeeder(WebDataFeeder *feeder, QObject *parent = 0);
    bool auto_action = false;
    int getRate() const;
    void setRate(int value);

signals:

public slots:
    void start();
    void stop();
    void simulate();
private:
    int rate = 4800;
    double heading = 0.0;
    double pitch = 0.0;
    double roll = 0.0;
    WebDataFeeder *wdf;
    QTimer timer;
    int counter = 0;
};

#endif // FEEDER_H
