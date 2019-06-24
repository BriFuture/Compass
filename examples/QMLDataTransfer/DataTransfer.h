#ifndef DATATRANSFER_H
#define DATATRANSFER_H

#include <QObject>
#include <QUdpSocket>

class Animation;

class DataTransfer : public QObject
{
    Q_OBJECT
public:
    explicit DataTransfer(QObject *parent = 0);
    ~DataTransfer();

signals:

public slots:
    void start(int port = 0);
protected slots:
    void recv();

private:
    Animation *animation = 0;
    QUdpSocket *socket;
};

#endif // DATATRANSFER_H
