## 基于 QtQuick 制作的罗盘动画
------

显示罗盘动画的一部分代码，只包含到 qml 绘图和 QtCanvas3D api
 
## Qt C++ 部分
- main.cpp
<br>
前期使用 QQmlApplicationEngine 加载 qml 文件，但是在实际项目中需要能够通过调用某个类的函数对 qml 文件进行加载。因此使用 main() 函数入口中的 data 对象，对 qml 文件进行加载。
- data.cpp
<br>
使用该类的 view() 方法和 view3D() 方法，通过实例化 QQuickView ，调用 setSource() 方法，加载 qml 文件。

