#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <Displayer3d.h>
#include <WebDataFeeder.h>
#include <QTcpSocket>
#include <QJsonDocument>
#include <QJsonObject>
#include <QWebEngineSettings>
namespace Ui {
class MainWindow;
}

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = 0);
    ~MainWindow();
public:
    bool init();
    WebDataFeeder *feeder() const;
    void setFeeder(WebDataFeeder *feeder);

public Q_SLOTS:
    void read();
public:
    Displayer3D *displayer;
private:
    WebDataFeeder *m_feeder;
    QTcpSocket m_socket;
private:
    Ui::MainWindow *ui;
};

#endif // MAINWINDOW_H
