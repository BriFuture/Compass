#ifndef DATA_H
#define DATA_H

#include <QObject>
#include <QQuickView>
#include <QQuickItem>
#include <QQmlContext>
#include <QDebug>
#include <QIcon>

class Data : public QObject{
    Q_OBJECT
public:
    Data();
    void view();
    void view3D();
    double heading;

public slots:
    double getRadius();
    double getHeading();

};

#endif // DATA_H
