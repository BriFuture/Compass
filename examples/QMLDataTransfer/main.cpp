#include <QApplication>
#include <QSettings>
#include <QDir>
#include <QDebug>
//#include <BProgramSharer.h>

#include <QCommandLineOption>
#include <QCommandLineParser>
#include <QLockFile>

#include "MainWindow.h"
#include <iostream>

#ifdef BUILD_WITH_CMAKE
#include "qmldt_config.h"
#endif

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    QApplication::setApplicationName("QMLData3DDsiplay");
    QApplication::setApplicationDisplayName("3D Data Dsiplay");
    QApplication::setOrganizationDomain("qt.zbrifuture.cn");
    QApplication::setApplicationVersion(QString("%1.%2").arg(_QMLDT_MAJ_VER).arg(_QMLDT_MIN_VER));

    Q_INIT_RESOURCE(dc_qml);
    Q_INIT_RESOURCE(dc_res);
//    BProgramSharer bps("QML3DDisplay");
//    bps.exportProgramPath(&a);

    QCommandLineParser parser;
    parser.setApplicationDescription("Display 3D Animation For Compass Program.");
    parser.addHelpOption();
    parser.addVersionOption();

    parser.process(a);
    QLockFile lf("qmlDataTransfer.lock");
    if(lf.isLocked()) {
        std::cerr << "An instance of Data3DDisplay is running" << std::endl;
        return 1;
    }

    bool locked = lf.tryLock();
    MainWindow mw;
    if(locked) {
        mw.init();
        mw.show();
    } else {
//        qWarning() << "Not able to lock" << lf.error();
        std::cerr << "Not able to lock. Maybe An instance of Data3DDisplay is running\nerrno: "
                  << lf.error() << std::endl;
        return lf.error();
    }

    int res = a.exec();
    lf.unlock();

    return res;
}
