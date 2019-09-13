#ifndef ANIMATION_H
#define ANIMATION_H

#include <QObject>
#include <QQuickView>

QT_BEGIN_NAMESPACE
class QQmlContext;
QT_END_NAMESPACE
#include "display_global.h"

#include "AnimationDataObject.h"
#include "DisplayQmlInterface.h"

class DISPLAY_DLL_EXPORT Animation : public QQuickView,
        public AnimationInterface
{
    Q_OBJECT

    Q_PLUGIN_METADATA(IID "cn.zbrifuture.Qt.libdisplayqml.Animation" FILE "res/libdisplayqml.json")
    Q_INTERFACES(AnimationInterface)
public:
    explicit Animation(QWindow *parent = 0);
    ~Animation();

public slots:
    void setParam(double heading, double pitch, double roll, double length) override;

    AnimationDataObject *getDataObject() const override  {
        return ado;
    }

    QObject *getObject();

signals:
    void toRecord(bool isCSource = false);
    void removeRecordPoint(int iSet);
    void threeDPropertyChanged(bool spacePath);

    void stateChanged(bool render);

protected:
    void onWindowStateChange(Qt::WindowState windowState);
    void hideEvent(QHideEvent *) override;

    AnimationDataObject *ado = nullptr;

};

#endif // DATA_H
