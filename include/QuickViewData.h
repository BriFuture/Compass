#ifndef QUICKVIEWDATA_H
#define QUICKVIEWDATA_H

#include <QObject>
#include <QQuickView>
#include <QQmlContext>

class QuickViewData : public QQuickView{
    Q_OBJECT

public:
    QuickViewData(QWindow *parent = Q_NULLPTR);
    ~QuickViewData();
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

#endif // QUICKVIEWDATA_H
