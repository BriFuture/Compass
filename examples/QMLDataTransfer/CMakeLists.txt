cmake_minimum_required(VERSION 3.9)

set(QMLDataTransfer_MAJOR_VER 1)
set(QMLDataTransfer_MINOR_VER 1)
set(QMLDataTransfer_PATCH_VER 0)
set(QMLDataTransfer_VER "${QMLDataTransfer_MAJOR_VER}.${QMLDataTransfer_MINOR_VER}.${QMLDataTransfer_PATCH_VER}")

set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTOUIC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_INCLUDE_CURRENT_DIR ON)
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

project(QMLDataTransfer VERSION ${QMLDataTransfer_VER})

# Basic Information
set(COMPANY "ZBriFuture")
set(COPYRIGHT "Copyright (c) 2019 Bright Future. All rights reserved.")
set(IDENTIFIER "cn.zbrifuture.qt")

# Set PROJECT_VERSION_PATCH and PROJECT_VERSION_TWEAK to 0 if not present
if (NOT PROJECT_VERSION_PATCH)
    set(PROJECT_VERSION_PATCH 0)
endif()
if (NOT PROJECT_VERSION_TWEAK)
    set(PROJECT_VERSION_TWEAK 0)
endif()

# Set App Icon If support
set(ICON_NAME compass)
set(ICON_FOLDER ${CMAKE_CURRENT_LIST_DIR})
set(ICON_FILE ${ICON_FOLDER}/${ICON_NAME}.ico)

if(UNIX)
    set(CMAKE_CXX_FLAGS "-fPIC")
elseif(WIN32)
    SET(OS_BUNDLE WIN32)

    # replace / to \\
    string(REPLACE "/" "\\\\" ICON_FILE ${ICON_FILE})

    configure_file("${CMAKE_CURRENT_LIST_DIR}/cmake/windows_metafile.rc.in"
          "qmldatatransfer_resource.rc"
    )
    set(APP_RESOURCES "${CMAKE_CURRENT_BINARY_DIR}/qmldatatransfer_resource.rc" )
    set(CMAKE_RC_COMPILER_INIT windres)
    ENABLE_LANGUAGE(RC)
#    SET(CMAKE_RC_COMPILE_OBJECT "<CMAKE_RC_COMPILER> <FLAGS> -O coff <DEFINES> -i <SOURCE> -o <OBJECT>")
endif(UNIX)

configure_file("./config.h.in" "./include/qmldt_config.h" )
include_directories(${CMAKE_CURRENT_BINARY_DIR}/include)
add_definitions(-DBUILD_WITH_CMAKE)

# include DisplayCompass library
if(NOT Display_BUILD_EXAMPLES)
find_package(DisplayCompass REQUIRED)
endif(NOT Display_BUILD_EXAMPLES)
include_directories(${DisplayCompass_INCLUDE_DIRS})

#find_package(Builib REQUIRED)
#include_directories(${Builib_INCLUDE_DIRS})
include_directories(${CMAKE_CURRENT_LIST_DIR}/src)

set(HEADERS
    src/DataTransfer.h
    src/MainWindow.h
    src/BAboutDialog.h
    )
set(SOURCES
    src/main.cpp
    src/DataTransfer.cpp
    src/MainWindow.cpp
    src/BAboutDialog.cpp
    )

SET(UIS src/BAboutDialog.ui src/MainWindow.ui)
SET(RESOURCES res.qrc)

#set(CMAKE_AUTOUIC_SEARCH_PATHS ${CMAKE_CURRENT_SOURCE_DIR}/src)
#link_directories(${CMAKE_BINARY_DIR})

## executable binary
add_executable(QMLDataTransfer ${OS_BUNDLE}
    ${HEADERS} ${SOURCES}
    ${RESOURCES} ${UIS}
    ${APP_RESOURCES}
)

#target_include_directories(QMLDataTransfer PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

target_link_libraries(QMLDataTransfer
    PRIVATE
        DisplayCompass
        Qt5::Core Qt5::Widgets Qt5::Qml Qt5::Quick
)

#qt5_use_modules(QMLDataTransfer Core Widgets Qml Quick)
install(TARGETS QMLDataTransfer DESTINATION bin)

# COPY .dll files
add_custom_command(TARGET QMLDataTransfer POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_if_different $<TARGET_FILE:DisplayCompass> $<TARGET_FILE_DIR:QMLDataTransfer>
)
