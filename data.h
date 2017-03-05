#ifndef DATA_H
#define DATA_H

#include <QObject>
#include <QQuickView>
#include <QQuickItem>
#include <QQmlContext>
#include <QDebug>

class Data : public QObject{
    Q_OBJECT
public:
    Data();
    void view();
    double heading;

public slots:
    double getRadius();
    double getHeading();

};

#endif // DATA_H
