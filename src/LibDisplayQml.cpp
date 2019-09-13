#include "LibDisplayQml.h"


LibDisplayQml::LibDisplayQml()
{

}

int LibDisplayQml::getMajorVer()
{
    return _LIBDISPLAYQML_MAJOR_VER;
}

int LibDisplayQml::getMinorVer()
{
    return _LIBDISPLAYQML_MINOR_VER;
}

int LibDisplayQml::getPatchVer()
{
    return _LIBDISPLAYQML_PATCH_VER;
}

QString LibDisplayQml::getVersion()
{
    return QString("%1.%2.%3").arg(getMajorVer()).arg(getMinorVer()).arg(getPatchVer());
}
