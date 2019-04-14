#ifndef FILECONTENT_H
#define FILECONTENT_H

#include <QObject>
#include <QFile>
#include <QTextStream>

class FileContent : public QObject
{
    Q_OBJECT
public:
    Q_PROPERTY(QString content READ getContent)
    Q_PROPERTY(QString filename READ getFileName WRITE setFileName)
    Q_INVOKABLE QString getContent();
    Q_INVOKABLE QString getFileName();
    FileContent(QObject *parent = 0);
    ~FileContent();
private:
    QFile   *file;
    QString content;
    QString filename;
public slots:
    void setFileName(const QString& filename);
    void clearContent();
};

#endif // FILECONTENT_H
