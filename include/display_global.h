#ifndef DISPLAY_GLOBAL_H
#define DISPLAY_GLOBAL_H

#include <QtCore/qglobal.h>

#if defined(DISPLAY_LIBRARY)
#  define DISPLAY_DLL_EXPORT Q_DECL_EXPORT
#else
#  define DISPLAY_DLL_EXPORT Q_DECL_IMPORT
#endif

#endif // DISPLAY_GLOBAL_H
