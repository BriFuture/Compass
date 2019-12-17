cmake_minimum_required(VERSION 3.9)

set(DisplayCompass_MAJOR_VER 1)
set(DisplayCompass_MINOR_VER 0)
set(DisplayCompass_PATCH_VER 0)
set(DisplayCompass_VER 1.0.0)
project(DisplayCompass VERSION ${DisplayCompass_VER})

set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_INCLUDE_CURRENT_DIR ON)
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_FLAGS "-fPIC")

configure_file("./config.h.in" "./include/config.h" )
include_directories(${CMAKE_CURRENT_BINARY_DIR}/include)

find_package(Qt5 COMPONENTS Widgets Core REQUIRED)
include_directories(${Qt5Widgets_INCLUDE_DIRS})
add_definitions(${QT5Widgets_DEFINITIONS})
include_directories(${Qt5Core_INCLUDE_DIRS})
add_definitions(${QT5Core_DEFINITIONS})
find_package(Qt5 COMPONENTS Qml Quick REQUIRED)
include_directories(${Qt5Qml_INCLUDE_DIRS})
add_definitions(${QT5Qml_DEFINITIONS})
include_directories(${Qt5Quick_INCLUDE_DIRS})
add_definitions(${QT5Quick_DEFINITIONS})

include_directories(include)
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

add_definitions(-DBUILD_WITH_CMAKE)
set(RESOURCES qml.qrc)
add_library(DisplayCompass SHARED
    ${SOURCES} ${HEADERS} ${RESOURCES}
)

OPTION(BUILD_EXAMPLES "BUILD EXAMPLES" OFF)
if(BUILD_EXAMPLES)
add_subdirectory(examples/QMLDataTransfer)
endif(BUILD_EXAMPLES)

SET_TARGET_PROPERTIES(DisplayCompass PROPERTIES VERSION ${DisplayCompass_VER} SOVERSION 0)
target_compile_definitions(DisplayCompass PRIVATE DISPLAY_LIBRARY)
target_link_libraries(DisplayCompass
    PRIVATE
        Qt5::Core Qt5::Widgets Qt5::Qml Qt5::Quick
)
include(CMakePackageConfigHelpers)
write_basic_package_version_file(
    DisplayCompassConfigVersion.cmake
    VERSION ${DisplayCompass_VER}
    COMPATIBILITY AnyNewerVersion
    )
install(TARGETS DisplayCompass
    DESTINATION bin
    EXPORT DisplayCompassTargets
    ARCHIVE DESTINATION lib
    RUNTIME DESTINATION bin
)
install(FILES ${HEADERS} DESTINATION include/DisplayCompass)
configure_file(cmake/DisplayCompassConfig.cmake.in DisplayCompassConfig.cmake @ONLY)
install(FILES
    ${CMAKE_CURRENT_BINARY_DIR}/DisplayCompassConfig.cmake
    ${CMAKE_CURRENT_BINARY_DIR}/DisplayCompassConfigVersion.cmake
    DESTINATION lib/cmake/DisplayCompass
)
install(EXPORT DisplayCompassTargets
    FILE DisplayCompassTargets.cmake
    DESTINATION lib/cmake/DisplayCompass)
