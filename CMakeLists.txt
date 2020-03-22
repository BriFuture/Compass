cmake_minimum_required(VERSION 3.9)

set(DisplayCompass_MAJOR_VER 1)
set(DisplayCompass_MINOR_VER 0)
set(DisplayCompass_PATCH_VER 0)
set(DisplayCompass_VER "${DisplayCompass_MAJOR_VER}.${DisplayCompass_MINOR_VER}.${DisplayCompass_PATCH_VER}")
project(DisplayCompass VERSION ${DisplayCompass_VER})

init_qt()

if(UNIX)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fPIC")
elseif(WIN32)

endif(UNIX)

configure_file("./config.h.in" "./include/config.h" )

find_package(Qt5 COMPONENTS Widgets Qml Quick REQUIRED)

set(DisplayCompass_INCLUDE_DIRS ${CMAKE_CURRENT_SOURCE_DIR}/include)
include_directories(${DisplayCompass_INCLUDE_DIRS})
set(HEADERS
    include/display_global.h
    include/Animation.h
    include/LibDisplayQml.h
    include/AnimationDataObject.h
    include/DisplayQmlInterface.h
    )

set(SOURCES
    src/Animation.cpp
    src/LibDisplayQml.cpp
)

set(RESOURCES dc_qml.qrc dc_res.qrc)
add_library(DisplayCompass SHARED
    ${SOURCES} ${HEADERS} ${RESOURCES}
)

set(DisplayCompass_INCLUDE_DIRS ${CMAKE_CURRENT_SOURCE_DIR} ${CMAKE_CURRENT_SOURCE_DIR}/include)

SET_TARGET_PROPERTIES(DisplayCompass PROPERTIES VERSION ${DisplayCompass_VER} SOVERSION 0)
target_compile_definitions(DisplayCompass PRIVATE DISPLAY_LIBRARY BUILD_WITH_CMAKE)
target_include_directories(DisplayCompass
    PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_LIST_DIR}/include>
    $<INSTALL_INTERFACE:$<INSTALL_PREFIX>/include/DisplayCompass>
    PRIVATE
    ${CMAKE_CURRENT_BINARY_DIR}/include
    )
target_link_libraries(DisplayCompass
    PUBLIC
        Qt5::Widgets Qt5::Qml Qt5::Quick
)


install(FILES ${HEADERS} DESTINATION include/DisplayCompass)
install(FILES feature/libdisplayqml.prf DESTINATION include/feature)
set(packages "find_package(Qt5 COMPONENTS Widgets Qml Quick REQUIRED)")
export_targets(DisplayCompass ${DisplayCompass_VER})

OPTION(BUILD_EXAMPLE_DisplayCompass "BUILD EXAMPLES WITH DisplayCompass" ON)
if(BUILD_EXAMPLE_DisplayCompass)
    add_subdirectory(examples/QMLDataTransfer)
    add_dependencies(QMLDataTransfer DisplayCompass)
endif(BUILD_EXAMPLE_DisplayCompass)
