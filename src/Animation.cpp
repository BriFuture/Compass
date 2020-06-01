#include "Animation.h"
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QDebug>
#include <QSettings>
#include <QtGlobal>
#include <QTimer>

#include "Animation.h"
#include <QQmlContext>

/*!
 * \class Animation
 * \author BriFuture
 * \date 2018.09.06
 *
 * \brief  封装好的 QML 动画管理器。
 * 简化与 QML 代码的交互
 *
 * QQuickView，QWindow 不是 QWidget 的子类，因此无法直接将该对象放入
 * mdi 子窗口中，若要将动画界面置入 mdi 子窗口中，有两种方法：
 *
 * 1. 将 Animation 继承 QQuickWidget，QQuickWidget 是 QWidget 的子类，
 *   因此可以作为 mdi 的子窗口。但 QWidget 和 QWindow 的接口有些区别，若修改
 *   Animation 的继承关系，则需要对 onWindowStateChange 方法做一定修改。
 * 2. 使用 QWidget::createWindowContainer 静态方法将 Animation 对象放入
 *   一个 QWidget 对象中，然后可以将该 QWidget 对象置入 mdi 子窗口。
 *
 * 但是上述方法存在一个已知的问题，要把 QWindow（及其子类）放入 mdi 子窗口中，
 * 会出现层叠顺序混乱的问题，导致界面绘制时显示异常。
 */
Animation::Animation(QWindow *parent) : QQuickView(parent),
    ado(new AnimationDataObject)
{
    QQmlContext *context = rootContext();
    context->setContextProperty( "dataSource", ado );
    context->setContextProperty( "window",     this );
    context->setContextProperty("qtVersion", qVersion());
    setResizeMode( SizeRootObjectToView );     // 设置窗口缩放时，根对象也会随之缩放
    connect(this, &QQuickView::windowStateChanged, this, &Animation::onWindowStateChange );
}

Animation::~Animation()
{
    delete ado;
}

QObject *Animation::getObject()
{
    return this;
}

void Animation::setSource(const QUrl &source)
{
    if(source.isEmpty()) {
        _source = QUrl("qrc:/DisplayCompass/qml/SpacePath.qml");
        QQuickView::setSource(_source);
    } else {
        QQuickView::setSource(source);
        _source = source;
    }
}

void Animation::restart()
{
    engine()->clearComponentCache();
    QQuickView::setSource(_source);
}


/*!
 * \brief 将数据传递给 QML 组件
 */
void Animation::setParam(const double heading, const double pitch, const double roll, const double length)
{
    ado->m_heading = heading;
    ado->m_pitch   = pitch;
    ado->m_roll    = roll;
    ado->m_length  = length;
    ado->dataChanged();
}


/*!
 * \brief 在窗口状态改变时发出相应信号，通知 QML 组件可以不进行绘制
 */
void Animation::onWindowStateChange(Qt::WindowState windowState)
{
    if( windowState == Qt::WindowMinimized )
        stateChanged( false );
    else
        stateChanged( true );
}


/*!
 * \brief  窗口隐藏事件
 */
void Animation::hideEvent(QHideEvent *)
{
    stateChanged( false );
}

#ifdef BUILD_WITH_CMAKE
#include "config.h"
#endif
#include <QResource>

void LibDisplayCompass::init(const QString &path, const QString &root)
{
    QString location3D = QString("%1/%2").arg(path).arg(Resource3DFile);
    QString locationQml = QString("%1/%2").arg(path).arg(ResourceQml3DFile);
    QResource::registerResource(location3D, root);
    QResource::registerResource(locationQml, root);
}

int LibDisplayCompass::getMajorVer()
{
    return _LIBDISPLAYQML_MAJOR_VER;
}

int LibDisplayCompass::getMinorVer()
{
    return _LIBDISPLAYQML_MINOR_VER;
}

int LibDisplayCompass::getPatchVer()
{
    return _LIBDISPLAYQML_PATCH_VER;
}

QString LibDisplayCompass::getVersion()
{
    return QString("%1.%2.%3").arg(getMajorVer()).arg(getMinorVer()).arg(getPatchVer());
}

