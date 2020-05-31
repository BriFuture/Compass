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
set(Res3DFile "dc3d_res.rcc")
set(ResQml3DFile "dc3d_qml.rcc")
configure_file("./config.h.in" "./include/config.h" )

add_library(DisplayCompass SHARED
    ${SOURCES} ${HEADERS}
#    ${RESOURCES}
)

set(DisplayCompass_INCLUDE_DIRS ${CMAKE_CURRENT_SOURCE_DIR} ${CMAKE_CURRENT_SOURCE_DIR}/include)

SET_TARGET_PROPERTIES(DisplayCompass
    PROPERTIES
        VERSION ${DisplayCompass_VER} SOVERSION 0
        ARCHIVE_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/lib"
        LIBRARY_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/lib"
        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin"
)
target_compile_definitions(DisplayCompass PRIVATE DISPLAY_LIBRARY BUILD_WITH_CMAKE)
target_include_directories(DisplayCompass
    PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_LIST_DIR}/include>
    $<INSTALL_INTERFACE:$<INSTALL_PREFIX>/include/DisplayCompass>
    PRIVATE
    ${CMAKE_CURRENT_BINARY_DIR}/
    ${CMAKE_CURRENT_BINARY_DIR}/include
    )
target_link_libraries(DisplayCompass
    PUBLIC
        Qt5::Widgets Qt5::Qml Qt5::Quick
)
configure_file("res/libdisplayqml.json" "libdisplayqml.json" @ONLY)

install(FILES ${HEADERS} DESTINATION include/DisplayCompass)
install(FILES feature/libdisplayqml.prf DESTINATION include/feature)
set(packages "find_package(Qt5 COMPONENTS Widgets Qml Quick REQUIRED)")
export_targets(DisplayCompass ${DisplayCompass_VER})

OPTION(BUILD_EXAMPLE_DisplayCompass "BUILD EXAMPLES WITH DisplayCompass" ON)
if(BUILD_EXAMPLE_DisplayCompass)
    add_subdirectory(examples/QMLDataTransfer)
    add_dependencies(QMLDataTransfer DisplayCompass)
endif(BUILD_EXAMPLE_DisplayCompass)



qt5_add_binary_resources(DCRes3D "dc_res.qrc"
    OPTIONS --compress 9
    DESTINATION "${CMAKE_BINARY_DIR}/bin/${Res3DFile}")
qt5_add_binary_resources(DCRes3DQml "dc_qml.qrc"
    OPTIONS --compress 9
    DESTINATION "${CMAKE_BINARY_DIR}/bin/${ResQml3DFile}")
install(FILES "${CMAKE_BINARY_DIR}/bin/${Res3DFile}" DESTINATION bin)
install(FILES "${CMAKE_BINARY_DIR}/bin/${ResQml3DFile}" DESTINATION bin)
