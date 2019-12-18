#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <Displayer3d.h>
#include <WebDataFeeder.h>
#include <QSharedMemory>
#include <QTimer>
#include <QBuffer>


class MainWindow : public QWidget
{
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = 0);
    ~MainWindow();
protected Q_SLOTS:
    void readData();
    void init();
private:
    Displayer3D *displayer = 0;
    QSharedMemory *memory = 0;
    QTimer timer;
    QByteArray data;
    QBuffer buffer;

    double heading = 0.0;
    double pitch = 0.0;
    double roll = 0.0;
    double length = 4.0;
};

#endif // MAINWINDOW_H
