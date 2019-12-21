#include "MainWindow.h"
#include "ui_MainWindow.h"
#include <QDebug>

MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow)
{
    ui->setupUi(this);
    setWindowTitle("QML 3D Display");

    about = new BAboutDialog(this);
    about->setDesc(tr("QML Program For 3D Display"));
    about->setOwnership("Made By BriFuture");
    about->setLogo(QPixmap(":/compass.ico"));
    about->setDetail("Press 'Restart 3D View' action from 'file' menu to restart whole 3d model.\n\n\n"
                     "Made By BriFuture.\n\n"
                     "Build With QML & QQuick2 Framework.\n\n"
                     "Version: v1.0.4");

    dt = new DataTransfer(this);
    connect(ui->actionAbout, &QAction::triggered, about, &QDialog::show);
    connect(ui->actionRestart3DView, &QAction::triggered, dt, &DataTransfer::refreshAnimation);
    connect(ui->actionExit, &QAction::triggered, this, &QMainWindow::close);
}

MainWindow::~MainWindow()
{

    delete ui;
}

void MainWindow::init() {
    dt->refreshAnimation();
    dt->start();

    Animation *a = dt->getAnimationView();
    animationContainer = QWidget::createWindowContainer(a, this);
    animationContainer->resize(a->size());
    ui->centralwidget->layout()->addWidget(animationContainer);
    resize(a->size());
}

void MainWindow::closeEvent(QCloseEvent *event) {
    dt->stop();
    delete dt->getAnimationView();
}
