#include "MainWindow.h"
#include <QApplication>


/** 通过串口传递数据
 */




int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    MainWindow *mw = new MainWindow();

    if(mw->init()) {
        mw->show();
        QObject::connect(mw->displayer, &Displayer3D::closed, &a, &QApplication::quit);
        int result = a.exec();
        return result;
    }
    return 1;
}

