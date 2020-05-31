#ifndef LIBDISPLAYQML_H
#define LIBDISPLAYQML_H

#include <QString>
#include "display_global.h"

class  LibDisplayQml
{
public:
    LibDisplayQml();
    static int getMajorVer();
    static int getMinorVer();
    static int getPatchVer();
    static QString getVersion();
};

#endif // LIBDISPLAYQML_H
