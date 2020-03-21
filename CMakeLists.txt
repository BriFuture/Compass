cmake_minimum_required(VERSION 3.9)

set(DisplayCompass_MAJOR_VER 1)
set(DisplayCompass_MINOR_VER 0)
set(DisplayCompass_PATCH_VER 0)
set(DisplayCompass_VER "${DisplayCompass_MAJOR_VER}.${DisplayCompass_MINOR_VER}.${DisplayCompass_PATCH_VER}")
project(DisplayCompass VERSION ${DisplayCompass_VER})

set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_INCLUDE_CURRENT_DIR ON)
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(UNIX)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fPIC")
elseif(WIN32)

endif(UNIX)

configure_file("./config.h.in" "./include/config.h" )

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

add_definitions(-DBUILD_WITH_CMAKE)
set(CMAKE_DEBUG_POSTFIX d)

set(RESOURCES dc_qml.qrc dc_res.qrc)
add_library(DisplayCompass SHARED
    ${SOURCES} ${HEADERS} ${RESOURCES}
)

set(DisplayCompass_INCLUDE_DIRS ${CMAKE_CURRENT_SOURCE_DIR} ${CMAKE_CURRENT_SOURCE_DIR}/include)

OPTION(BUILD_Display_examples "BUILD EXAMPLES WITH DisplayCompass" ON)
if(BUILD_Display_examples)
    add_subdirectory(examples/QMLDataTransfer)
    add_dependencies(QMLDataTransfer DisplayCompass)
endif(BUILD_Display_examples)

SET_TARGET_PROPERTIES(DisplayCompass PROPERTIES VERSION ${DisplayCompass_VER} SOVERSION 0)
target_compile_definitions(DisplayCompass PRIVATE DISPLAY_LIBRARY)
target_include_directories(DisplayCompass
    PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_LIST_DIR}/include>
    $<INSTALL_INTERFACE:include/DisplayCompass>
    PRIVATE
    ${CMAKE_CURRENT_BINARY_DIR}/include
    )
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
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
    RUNTIME DESTINATION bin
)
install(FILES ${HEADERS} DESTINATION include/DisplayCompass)
install(FILES feature/libdisplayqml.prf DESTINATION include/feature)

configure_file(cmake/DisplayCompassConfig.cmake.in DisplayCompassConfig.cmake @ONLY)
install(FILES
    ${CMAKE_CURRENT_BINARY_DIR}/DisplayCompassConfig.cmake
    ${CMAKE_CURRENT_BINARY_DIR}/DisplayCompassConfigVersion.cmake
    DESTINATION lib/cmake/DisplayCompass
)
install(EXPORT DisplayCompassTargets
    FILE DisplayCompassTargets.cmake
    DESTINATION lib/cmake/DisplayCompass)
