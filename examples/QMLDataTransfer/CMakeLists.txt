cmake_minimum_required(VERSION 3.9)

set(QMLDataTransfer_MAJOR_VER 1)
set(QMLDataTransfer_MINOR_VER 1)
set(QMLDataTransfer_PATCH_VER 0)
set(QMLDataTransfer_VER "${QMLDataTransfer_MAJOR_VER}.${QMLDataTransfer_MINOR_VER}.${QMLDataTransfer_PATCH_VER}")

project(QMLDataTransfer VERSION ${QMLDataTransfer_VER})

set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTOUIC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_INCLUDE_CURRENT_DIR ON)
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(ICON_NAME compass)
set(ICON_FOLDER ${CMAKE_CURRENT_LIST_DIR})
set(ICON_FILE ${ICON_FOLDER}/${ICON_NAME}.ico)

if(UNIX)
    set(CMAKE_CXX_FLAGS "-fPIC")
elseif(WIN32)
    if (NOT PROJECT_VERSION_TWEAK)
        set(PROJECT_VERSION_TWEAK 0)
    endif()
    string(REPLACE "/" "\\\\" ICON_FILE ${ICON_FILE})
    configure_file("${CMAKE_CURRENT_SOURCE_DIR}/cmake/windows_metafile.rc.in"
          "windows_metafile.rc"
    )
    set(RES_FILES "windows_metafile.rc" )
    set(CMAKE_RC_COMPILER_INIT windres)
    ENABLE_LANGUAGE(RC)
#    SET(CMAKE_RC_COMPILE_OBJECT "<CMAKE_RC_COMPILER> <FLAGS> -O <DEFINES> -i <SOURCE> -o <OBJECT>")
    SET(APP_RESOURCES ${RES_FILES})
    SET(OS_BUNDLE WIN32)
endif(UNIX)

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
SET(RESOURCES res.qrc)
file( GLOB UIS ${CMAKE_CURRENT_SOURCE_DIR}/*.ui )

add_definitions(-DBUILD_WITH_CMAKE)

set(CMAKE_AUTOUIC_SEARCH_PATHS ${CMAKE_CURRENT_SOURCE_DIR})
add_executable(QMLDataTransfer ${OS_BUNDLE}
    ${HEADERS} ${SOURCES}
    ${RESOURCES} ${UIS}
    ${APP_RESOURCES}
)
target_include_directories(QMLDataTransfer PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

target_link_libraries(QMLDataTransfer
    PRIVATE
        DisplayCompass
#        Builib
        Qt5::Core Qt5::Widgets Qt5::Qml Qt5::Quick
)

install(TARGETS QMLDataTransfer DESTINATION bin)
link_directories(${CMAKE_BINARY_DIR})

add_custom_command(TARGET QMLDataTransfer POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_if_different $<TARGET_FILE:DisplayCompass> $<TARGET_FILE_DIR:QMLDataTransfer>
)
