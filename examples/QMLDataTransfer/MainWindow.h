#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <DataTransfer.h>
#include <BAboutDialog.h>

namespace Ui {
class MainWindow;
}

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = 0);
    ~MainWindow();

public slots:
    void init();

private:
    Ui::MainWindow *ui = nullptr;
    QWidget *animationContainer = nullptr;
    BAboutDialog *about = nullptr;
    DataTransfer *dt = nullptr;
};

#endif // MAINWINDOW_H
