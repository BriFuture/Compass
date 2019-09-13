## 基于 QtQuick 制作的罗盘动画
------

显示罗盘动画的一部分代码，包含 qml 绘图和 QtCanvas3D api。

> 现在该程序(webview 版本)可以通过 DLL 的形式导入到项目中。如果想以 QProcess 子进程方式运行可执行文件 .exe，需要先编译出可执行文件，然后指定可执行文件的位置。
> 注意：在 `Debug` 模式下 QWebEngineView 的显示会有问题，如果有问题的话使用 `Release` 模式下构建程序可以看到正常的画面。

### 使用 Vue 进行开发

直接使用 QtQuick 开发这款程序不如使用 Vue 开发来的方便（尤其是开发 3D 的时候）。我将 3D 程序的核心 JS 文件移植到了 Vue 项目中 (submodule compassvue)，可以使用浏览器很方便的开发 3D 程序（界面尚未开发完成），对 SpacePath.js 文件及依赖文件的改动都会导致 devserver 的重新加载。

现在可以直接在浏览器中预览 3D 程序的效果：[点击链接](https://brifuture.github.io/blog-code-example/19-q2/compassvue-demo/index.html)

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

要启用 QuickView，确定 `display.pro` 中有如下语句（第一行不是注释状态，第二行是）：

```
DEFINES += QUICKVIEW
# DEFINES += WEBVIEW
```

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

要启用 WebEngine, 确定 `display.pro` 中有如下语句（第二行不是注释状态，第一行是）：

```
# DEFINES += QUICKVIEW
DEFINES += WEBVIEW
```

最新的程序采用了 QWebEngineView 进行显示，开发时使用 vue-cli 脚手架，在浏览器界面中进行调试。与 Qt 部分通讯时需要使用 QWebSocket，协议如下：

```js
// data:  默认的 length 为 4
{ type: 'feedHPR', heading: 0 , pitch: 0, roll: 0, length: 4 }
//  action 
{type: 'action', idx: 0, record: true, resetRecord: false, resetPath: false}
```

**Note: Debug 模式下 WebEngineView 会加载失败。请使用 Release 模式运行程序。另外，QtWebEngine 模块不被 MinGW 编译器所支持，在 Windows 平台下请使用 MSVC 版本的 Qt 进行编译。**

开发时可以使用浏览器开发，构建生产环境代码时使用 `yarn build` 进行构建，简化完成后可在项目根目录下使用 python 脚本 `python process_index.py` 复制构建好的代码。Qt 程序编译后，运行程序默认不会产生模拟数据，要产生模拟数据，将可执行文件同级目录下的 `display.ini` 文件中的 `mock_data` 值改为 `true`。

### change log

- v0.0.12: 更新了代码组织方式，可以以 DLL 动态链接库的形式使用本程序。在 `examples` 目录下增加了关于 DLL 的使用示例。

- v0.0.10 :  现在采用 web 端开发，QWebEngineView 进行桌面显示，稍后会添加 QWebSocket 支持，以便在程序中传递数据。

### License 

GPLv3

[1]: http://glmatrix.net/
[2]: https://github.com/frenchtoast747/webgl-obj-loader
