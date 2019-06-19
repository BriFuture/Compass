#include "DataTransfer.h"
#include <QApplication>
#include <QSettings>
#include <QDir>
#include <QDebug>

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);

    QString ini = QDir::homePath() + "/compassRelative.ini";
    QSettings setting(ini, QSettings::IniFormat);
    setting.beginGroup("path");
    setting.setValue("QMLDataTransfer", a.applicationFilePath());
    setting.endGroup();

    DataTransfer dt;
    dt.start();

    return a.exec();
}
