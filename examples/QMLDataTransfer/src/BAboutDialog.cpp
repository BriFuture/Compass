#include "BAboutDialog.h"
#include "ui_BAboutDialog.h"
//#include "BUILib.h"

BAboutDialog::BAboutDialog(QWidget *parent) :
    QDialog(parent),
    ui(new Ui::BAboutDialog)
{
    ui->setupUi(this);
    setWindowFlags(Qt::Window | Qt::WindowTitleHint | Qt::WindowCloseButtonHint | Qt::CustomizeWindowHint);
    setWindowModality(Qt::WindowModal);
    setFixedSize(size());
    ui->buiLogo->setPixmap(QPixmap(":/res/logo/logo.jpg"));
    connect(ui->okBtn, &QPushButton::clicked, this, &QDialog::close);
    ui->buiDesc->setText(tr("Support By \nBUI Library Version: %1. \n"
                            "Qt Framework Version: 5.7.0").arg("0.1.20"));
}

BAboutDialog::~BAboutDialog()
{
    delete ui;
}

void BAboutDialog::setLogo(const QPixmap &pix)
{
    ui->logo->setPixmap(pix);
}

void BAboutDialog::setDesc(const QString &desc)
{
    ui->programDescLabel->setText(desc);
}

void BAboutDialog::setOwnership(const QString &desc)
{
    ui->ownerLabel->setText(desc);
}

void BAboutDialog::setRichDetail(const QString &detail)
{
    ui->details->insertHtml(detail);
}

void BAboutDialog::setDetail(const QString &detail)
{
    ui->details->setText(detail);
}

void BAboutDialog::addDetail(const QString &detail)
{
    ui->details->append(detail);
}

void BAboutDialog::setDetailVisible(bool visible)
{
    ui->details->setVisible(visible);
    adjustSize();
    setFixedSize(size());
}

void BAboutDialog::setBUIVisible(bool visible)
{
    ui->buiLogo->setVisible(visible);
    ui->buiDesc->setVisible(visible);
    adjustSize();
    setFixedSize(size());
}

void BAboutDialog::retranslateUi()
{
    ui->buiDesc->setText(tr("Support By \n%1").arg("BUILib"));
}
