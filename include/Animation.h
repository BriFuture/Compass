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

    Q_PLUGIN_METADATA(IID "cn.zbrifuture.Qt.libdisplayqml.Animation" FILE "libdisplayqml.json")
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
    void setSource(const QUrl &source = QUrl());

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


class DISPLAY_DLL_EXPORT  LibDisplayCompass
{
public:
    static void init(const QString &path = QString("."), const QString &root = QString());
    static int getMajorVer();
    static int getMinorVer();
    static int getPatchVer();
    static QString getVersion();
};
#endif // DATA_H
