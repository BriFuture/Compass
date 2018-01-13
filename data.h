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

private:
    QQuickView *compassview;
public:
    Data();
    ~Data();
    void view();
    void view3D();
    double heading;
    double pitch;
    double roll;

signals:
    void headingChanged();

public slots:
    void show();
    double getRadius();
    double getHeading();
    double getPitch();
    double getRoll();
    double* getData();
    double getMagicVectorLength();
};

#endif // DATA_H
