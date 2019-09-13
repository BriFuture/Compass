#include <QCoreApplication>
#include "DataGenerator.h"


int main(int argc, char *argv[])
{
    QCoreApplication a(argc, argv);

    DataGenerator dg;

    return a.exec();
}
