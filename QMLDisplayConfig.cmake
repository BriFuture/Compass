cmake_minimum_required(VERSION 3.9)
get_filename_component(QMLDisplay_DIR "${CMAKE_CURRENT_LIST_DIR}/.." PATH)

set(QMLDisplay_INCLUDE_DIRS
    ${QMLDisplay_DIR}/include
    )

find_package(Qt5 COMPONENTS 
    Quick QuickWidgets
    REQUIRED
    HINTS
        ${QT_LIBARY_HINTS}
    )
include_directories(${Qt5Quick_INCLUDE_DIRS})
add_definitions(${QT5Quick_DEFINITIONS})
include_directories(${Qt5QuickWidgets_INCLUDE_DIRS})
add_definitions(${QT5QuickWidgets_DEFINITIONS})