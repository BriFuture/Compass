#ifndef ANIMATION_H
#define ANIMATION_H

#include <QObject>
#include <QQuickView>
#include <QQmlContext>

#include "display_global.h"

class AnimationDataObject : public QObject {
    Q_OBJECT
    Q_PROPERTY(double heading READ getHeading NOTIFY dataChanged)
    Q_PROPERTY(double pitch READ getPitch NOTIFY dataChanged)
    Q_PROPERTY(double roll READ getRoll NOTIFY dataChanged)
    Q_PROPERTY(double vectorLength READ getLength NOTIFY dataChanged)

signals:
    void dataChanged();
//    void dataChanged(const MagParam &params);
public Q_SLOTS:
    double getHeading() {
        return m_heading;
    }

    double getPitch() {
        return m_pitch;
    }

    double getRoll() {
        return m_roll;
    }

    double getLength() {
        return m_length;
    }

    double getMx() { return mx; }
    double getMy() { return my; }
    double getMz() { return mz; }

    double getAx() { return ax; }
    double getAy() { return ay; }
    double getAz() { return az; }

    double getWx() { return wx; }
    double getWy() { return wy; }
    double getWz() { return wz; }

public:
    double m_heading;
    double m_pitch;
    double m_roll;
    double m_length;

    double mx;
    double my;
    double mz;

    double wx;
    double wy;
    double wz;

    double ax;
    double ay;
    double az;
};

class DISPLAY_DLL_EXPORT Animation : public QQuickView
{
    Q_OBJECT
public:
    explicit Animation(QWindow *parent = 0);
    ~Animation();

public slots:
    void setParam(const double heading, const double pitch, const double roll, const double length);

    AnimationDataObject *getDataObject() {
        return ado;
    }

signals:
    void toRecord(bool isCSource = false);
    void removeRecordPoint(int iSet);
    void threeDPropertyChanged(bool spacePath);

    void stateChanged(bool render);

protected:
    void onWindowStateChange(Qt::WindowState windowState);
    void hideEvent(QHideEvent *) override;

    AnimationDataObject *ado;

};

#endif // DATA_H
