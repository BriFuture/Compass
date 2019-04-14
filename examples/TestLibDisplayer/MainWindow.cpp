#include "MainWindow.h"
#include "ui_MainWindow.h"
#include <QLayout>
#include <QDebug>

MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow),
    displayer(new Displayer3D(this))
{
    setWindowTitle("TestLibDisplayer");
    ui->setupUi(this);
    bool inited = displayer->init();
    if(inited) {
        QWebEngineView *view = displayer->getView();
        if(view!= 0) {
            ui->groupBox->layout()->addWidget(view);
        }
        displayer->show();
    }
}

MainWindow::~MainWindow()
{
    delete ui;
}
