import QtQuick 2.0

Item {

    // 0 -> 60
    var data0 = [0, 0, 0];

//    var data1 = [10, 0, 0];
    var count = 0;
    var dataV = 0;

    id: dataItem
    Timer {
        id: dataSource
        interval: 300
        running: true
        repeat: true
        onTriggered: {
            incx = Math.random(5) - 2   // -2 <= x < 3
            incy = Math.random(1)   // 0 <= y < 1
            changeData(0, incx)
            changeData(1, incy)
            changeData(2, incy)
        }
    }

    /*
      * 修改数据
      * int vec  x (0) y (1) z (2) 方向
      * double inc  变化的值
    */
    function changeData(vec, inc) {
        data[vec] += inc;
    }

    function resetData() {
        data0 = [0, 0, 0]
    }

    // 模拟数据，提供接口供外部获取
    property double data : data0;
}
