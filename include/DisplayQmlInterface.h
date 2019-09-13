#ifndef DISPLAYQMLINTERFACE_H
#define DISPLAYQMLINTERFACE_H

#include <QtPlugin>

QT_BEGIN_NAMESPACE
class QObject;
QT_END_NAMESPACE

#include "AnimationDataObject.h"

class AnimationInterface
{
public:
    virtual ~AnimationInterface() {}

    virtual void setParam(double heading, double pitch, double roll, double length) = 0;
    virtual AnimationDataObject *getDataObject() const = 0;
    virtual QObject *getObject() = 0;
};

QT_BEGIN_NAMESPACE
#define AnimationInterface_iid "cn.zbrifuture.Qt.libdisplayqml.Animation"

Q_DECLARE_INTERFACE(AnimationInterface, AnimationInterface_iid)
QT_END_NAMESPACE

#endif // DISPLAYQMLINTERFACE_H
