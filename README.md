## 基于 QtQuick 制作的罗盘动画
------

显示罗盘动画的一部分代码，包含 qml 绘图和 QtCanvas3D api
 
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
    3D 部分使用的是 QtCanvas3D 和 WebGL 进行绘制。矩阵相关的操作使用的是 [gl-matrix][1] 类库

[1]: http://glmatrix.net/