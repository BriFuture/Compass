#ifndef DATA_H
#define DATA_H

#include <QObject>
#include <QQuickView>
#include <QQmlContext>

class Data : public QQuickView{
    Q_OBJECT

public:
    Data(QWindow *parent = Q_NULLPTR);
    ~Data();
    bool event(QEvent *event);

private:
    double heading;
    double pitch;
    double roll;

signals:
    void dataChanged();

public slots:
    double getHeading();
    double getPitch();
    double getRoll();
    double* getData();
    double getMagicVectorLength();
};

#endif // DATA_H
