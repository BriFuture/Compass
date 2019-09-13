#include "MainWindow.h"
#include <QApplication>

/**
  * 利用共享内存区域实现进程间通信，转发数据；
  * 本程序只会读取共享内存的数据，不会写入数据。
  * 注意：运行本程序前，先运行 SharedMemoryDataGenerator 向共享内存中写入数据。
*/
int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    MainWindow w;
    w.setWindowTitle("Displayer3D");
    w.setMinimumSize(1080, 726);
    w.show();

    return a.exec();
}
