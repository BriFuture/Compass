## 基于 QtQuick 制作的罗盘动画
------

显示罗盘动画的一部分代码，包含 qml 绘图和 QtCanvas3D api

### 使用 Vue 进行开发

直接使用 QtQuick 开发这款程序不如使用 Vue 开发来的方便（尤其是开发 3D 的时候）。我将 3D 程序的核心 JS 文件移植到了 Vue 项目中 (submodule compassvue)，可以使用浏览器很方便的开发 3D 程序（界面尚未开发完成），对 SpacePath.js 文件及依赖文件的改动都会导致 devserver 的重新加载。

现在可以直接在浏览器中预览 3D 程序的效果：[点击链接](https://brifuture.github.io/blog-code-example/19-01to03/compassvue-demo/index.html)

### 存在的问题

在着色器代码 `SPVertexCode.vsh` 或 `SPFragCode.fsh` 文件中存在一个可能的问题 [详见 WebGL: Fixing "INVALID_OPERATION: drawArrays: attribs not setup correctly"](http://www.mjbshaw.com/2013/03/webgl-fixing-invalidoperation.html)，这是我在移植 `Craft.js` 功能的时候发现的一个 Bug，发生原因再 `attributes.texture` 没有正确的获取到 Buffer 中的数据，但是在 QQuick 引擎中运行现有的代码不会出现这个问题。


### Qt C++ 部分
- main.cpp
<br>
前期使用 QQmlApplicationEngine 加载 qml 文件，但是在实际项目中需要能够通过调用某个类的函数对 qml 文件进行加载。因此使用 main() 函数入口中的 data 对象，对 qml 文件进行加载。增加了简单的配置文件，选择显示的方式时不需要再对程序重新编译。

- data.cpp
<br>
使用该类的 view() 方法和 view3D() 方法，通过实例化 QQuickView ，调用 setSource() 方法，加载 qml 文件。

### Qt Quick 部分

使用 QML + JavaScript 进行动画演示。最新修改的版本对自定义滑块和 3D 部分的 QML 文件全部重写，去掉冗余的部分。

* 2D 
    2D 部分动画使用的是简单的旋转。

* 3D
    3D 部分使用的是 QtCanvas3D 和 WebGL 进行绘制。
    - 为了优化性能，所有模型视图矩阵根据需要更新（之前是在 paintGL 中实时更新）。
    - 增加了 SpacePath.js 中的注释
    - 矩阵相关的操作使用的是 [gl-matrix][1] 类库。
    - 由于需要加载飞行器的 OBJ 模型，使用了 [webgl-obj-loader][2]。

### Qt WebEngine 部分

最新的程序采用了 QWebEngineView 进行显示，开发时使用 vue-cli 脚手架，在浏览器界面中进行调试。

### change log

- v0.0.10 :  现在采用 web 端开发，QWebEngineView 进行桌面显示，稍后会添加 QWebSocket 支持，以便在程序中传递数据。

### License 

GPLv3

[1]: http://glmatrix.net/
[2]: https://github.com/frenchtoast747/webgl-obj-loader