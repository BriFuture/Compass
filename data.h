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
    Q_INVOKABLE double getHeading();
    Q_INVOKABLE double getPitch();
    Q_INVOKABLE double getRoll();
    Q_INVOKABLE double getMagicVectorLength();

private:
    double heading;
    double pitch;
    double roll;

signals:
    void dataChanged();

public slots:

    void changeData();
};

#endif // DATA_H
