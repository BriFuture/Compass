.pragma library
// 0 -> 60
var data0 = [0, 42, 0];

/*
  * 修改数据
  * int vec  x (0) y (1) z (2) 方向
  * double inc  变化的值
*/
function changeData(vec, inc) {
    data0[vec] += inc;
    // 俯仰角范围 [-180, 180]
    if(data0[1] >= 180 || data0[1] <= -180) {
        data0[1] = -data0[1]
    }
    // 横滚角 [-360, 360]
    if(data0[2] >= 360 || data0[2] <= -360) {
        data0[2] = -data0[2]
    }
}

function resetData() {
    data0 = [0, 0, 0]
}

function changer() {
    var incx = Math.random() * 5 - 2   // -2 <= x < 3
    var incy = 10* Math.random() * 0.3 - 0.1   // -0.1 <= y < 0.2
//    changeData(0, incx)
//    changeData(1, incy)
//    changeData(2, incy)
    changeData(0, 1)
    changeData(1, 1)
    changeData(2, 3)
}

function getData() {
    changer();
    return data0;
}

function testRandom() {
    return Math.random(5) * 5 - 2
}
