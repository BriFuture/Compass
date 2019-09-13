#ifndef BCDISPLAYER3D_H
#define BCDISPLAYER3D_H

#ifdef _MSC_VER
#pragma once
#endif

#include <QObject>
#include <QEvent>
#include <QWebEngineView>

#include "WebDataFeeder.h"
#include <display_global.h>

class Displayer3DPri;

class DISPLAY_DLL_EXPORT Displayer3D : public QObject
{
    Q_OBJECT
public:
    explicit Displayer3D(QWidget *parent = 0);
    ~Displayer3D();
    bool init();
    QWebEngineView *getView() const;
    WebDataFeeder *getDataFeeder() const;
    // QObject interface
Q_SIGNALS:
    void closed();

public:
    bool eventFilter(QObject *watched, QEvent *event) override;

public Q_SLOTS:
    void show();

    void resize(int width, int height);

protected Q_SLOTS:
    void load();

private:
    QString resourceLoc;
    Displayer3DPri *d_ptr = 0;
    WebDataFeeder *m_dataFeeder = 0;

};

#endif // BCDISPLAYER3D_H
