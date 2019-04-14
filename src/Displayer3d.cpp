#include "Displayer3d.h"
#include <QWebEngineView>
#include <QWebEnginePage>
#include <QResource>
#include <QDebug>
#include <QTimer>

class Displayer3DPri {
public:
    ~Displayer3DPri() {
        if(view) {
            delete view;
        }
//        if(page) {
//            delete page;
//        }
    }

    QWebEngineView *view = 0;
    QWebEnginePage *page = 0;
};


Displayer3D::Displayer3D(QWidget *parent) : QObject(parent),
    d_ptr(new Displayer3DPri),
    m_dataFeeder(new WebDataFeeder(this))
{
    connect(m_dataFeeder, &WebDataFeeder::ready, this, &Displayer3D::load);
}

Displayer3D::~Displayer3D()
{
    delete m_dataFeeder;

    d_ptr->view->stop();
    delete d_ptr;
}

bool Displayer3D::init()
{
    /*
    resourceLoc = value;
    bool registered = QResource::registerResource(resourceLoc);
    if(!registered) {
        qWarning() << "Resource file not found: " << resourceLoc;
        return false;
    }
    */
//    m_dataFeeder = new WebDataFeeder(this);
    d_ptr->view = new QWebEngineView(qobject_cast<QWidget *>(parent()));
    d_ptr->page = new QWebEnginePage(d_ptr->view);
    d_ptr->view->setPage(d_ptr->page);
    d_ptr->view->resize(1024, 768);
    m_dataFeeder->init();
    d_ptr->view->installEventFilter(this);
//    QTimer::singleShot(1500, this, &Displayer3D::load);
    return true;
}

QWebEngineView *Displayer3D::getView() const
{
    return d_ptr->view;
}

void Displayer3D::resize(int width, int height)
{
    d_ptr->view->resize(width, height);
}

void Displayer3D::load()
{
    d_ptr->page->load(QUrl("qrc:/html/index.html"));
    qInfo() << "Index Loaded";
    //    view->load(QUrl("qrc:/html/index.html"));
}

WebDataFeeder *Displayer3D::getDataFeeder() const
{
    return m_dataFeeder;
}

bool Displayer3D::eventFilter(QObject *watched, QEvent *event)
{
    if(watched == d_ptr->view) {
        if(event->type() == QEvent::Close) {
//            this->deleteLater();
            emit closed();
            return true;
        }
    }
    return false;
}


void Displayer3D::show() {
    d_ptr->view->show();
}
