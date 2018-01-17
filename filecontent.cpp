#include "filecontent.h"
#include <QDebug>

FileContent::FileContent(QObject *parent) {

}

FileContent::~FileContent() {
    delete file;
}

QString FileContent::getFileName() {
    return this->filename;
}

void FileContent::setFileName(const QString &filename) {
    this->filename = filename;
    file = new QFile(filename);

}

QString FileContent::getContent() {
    if( content.length() == 0 ) {
        file->open(QIODevice::ReadOnly | QIODevice::Text);
        QTextStream in(file);
        content = in.readAll();
        if( content.length() == 0) {
            qDebug() << "[Warning] FileContent: file " << this->filename << "is empty" << endl;
        } else {
            qDebug() << "[Info] FileContent: reading file succeed!" << endl;
        }
    }
    return content;
}

void FileContent::clearContent() {
    content.clear();
}

