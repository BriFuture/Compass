#ifndef ANIMATIONDATAOBJECT_H
#define ANIMATIONDATAOBJECT_H

#include <QObject>

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
    inline double getHeading() {
        return m_heading;
    }

    inline double getPitch() {
        return m_pitch;
    }

    inline double getRoll() {
        return m_roll;
    }

    inline double getLength() {
        return m_length;
    }

    inline double getMx() { return mx; }
    inline double getMy() { return my; }
    inline double getMz() { return mz; }

    inline double getAx() { return ax; }
    inline double getAy() { return ay; }
    inline double getAz() { return az; }

    inline double getWx() { return wx; }
    inline double getWy() { return wy; }
    inline double getWz() { return wz; }

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


#endif // ANIMATIONDATAOBJECT_H
