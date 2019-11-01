#ifndef DATATRANSFER_H
#define DATATRANSFER_H

#include <QObject>
#include <QUdpSocket>
#include "Animation.h"

class DataTransfer : public QObject
{
    Q_OBJECT
public:
    explicit DataTransfer(QObject *parent = 0);
    ~DataTransfer();
    inline Animation *getAnimationView() const { return animation; }
signals:

public slots:
    void start(int port = 0);
    void stop();
    void refreshAnimation();
protected:
protected slots:
    void recv();

private:
    Animation *animation = nullptr;
    QUdpSocket *socket = nullptr;
};

#endif // DATATRANSFER_H
