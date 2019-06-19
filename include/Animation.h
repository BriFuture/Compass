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

    friend class Animation;
signals:
    void dataChanged();
//    void dataChanged(const MagParam &params);
public:
    Q_INVOKABLE double getHeading() {
        return m_heading;
    }

    Q_INVOKABLE double getPitch() {
        return m_pitch;
    }

    Q_INVOKABLE double getRoll() {
        return m_roll;
    }

    Q_INVOKABLE double getLength() {
        return m_length;
    }

private:
    double m_heading;
    double m_pitch;
    double m_roll;
    double m_length;

};

class DISPLAY_DLL_EXPORT Animation : public QQuickView
{
    Q_OBJECT
public:
    explicit Animation(QWindow *parent = 0);

public slots:
    void setParam(const double heading, const double pitch, const double roll, const double length);
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
