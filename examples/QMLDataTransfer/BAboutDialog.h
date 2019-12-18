#ifndef BABOUTDIALOG_H
#define BABOUTDIALOG_H

#include <QDialog>

namespace Ui {
class BAboutDialog;
}

class BAboutDialog : public QDialog
{
    Q_OBJECT

public:
    explicit BAboutDialog(QWidget *parent = nullptr);
    ~BAboutDialog();

public slots:
    void setLogo(const QPixmap &pix);
    void setDesc(const QString &desc);
    void setOwnership(const QString &desc);

    void setRichDetail(const QString &detail);
    void setDetail(const QString &detail);
    void addDetail(const QString &detail);
    void setDetailVisible(bool visible);

    void setBUIVisible(bool visible);

    void retranslateUi();
private:
    Ui::BAboutDialog *ui;
};

#endif // BABOUTDIALOG_H
