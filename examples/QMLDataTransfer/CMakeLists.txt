cmake_minimum_required(VERSION 3.9)

set(QMLDataTransfer_MAJOR_VER 1)
set(QMLDataTransfer_MINOR_VER 1)
set(QMLDataTransfer_PATCH_VER 0)
set(QMLDataTransfer_VER 1.1.0)

project(QMLDataTransfer VERSION ${QMLDataTransfer_VER})

set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTOUIC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_INCLUDE_CURRENT_DIR ON)
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_FLAGS "-fPIC")

configure_file("./config.h.in" "./include/qmldt_config.h" )
include_directories(${CMAKE_CURRENT_BINARY_DIR}/include)

if(NOT Display_BUILD_EXAMPLES)
find_package(DisplayCompass REQUIRED)
endif(NOT Display_BUILD_EXAMPLES)
include_directories(${DisplayCompass_INCLUDE_DIRS})

#find_package(Builib REQUIRED)
#include_directories(${Builib_INCLUDE_DIRS})

set(HEADERS
    DataTransfer.h
    MainWindow.h
    BAboutDialog.h
    )
set(SOURCES
    main.cpp
    DataTransfer.cpp
    MainWindow.cpp
    BAboutDialog.cpp
    )
set(RESOURCES res.qrc)
file( GLOB UIS ${CMAKE_CURRENT_SOURCE_DIR}/*.ui )

add_definitions(-DBUILD_WITH_CMAKE)

set(CMAKE_AUTOUIC_SEARCH_PATHS ${CMAKE_CURRENT_SOURCE_DIR})
add_executable(QMLDataTransfer ${HEADERS} ${SOURCES} ${RESOURCES} ${UIS})
target_include_directories(QMLDataTransfer PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

target_link_libraries(QMLDataTransfer
    PRIVATE
        DisplayCompass Builib
        Qt5::Core Qt5::Widgets Qt5::Qml Qt5::Quick
)

install(TARGETS QMLDataTransfer DESTINATION bin)
