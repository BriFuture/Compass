.pragma library
Qt.include("gl-matrix.js");

/**
 * this function used to define the basic paint object, use key word `new` to create a object
*/
function PaintObj() {
    // vertexes num(exclude color info)
    this.vertexes = [];
    this.indexes  = [];
    this.colors   = [];
    // include vertexes and color info
    this.points   = [];
    // world coordinate
    this.xoff   = 0;
    this.yoff   = 0;
    this.zoff   = 0;
    this.mvMat = mat4.create();
}

PaintObj.prototype.getVertexes = function() {
    return this.vertexes;
}

PaintObj.prototype.getVertexNum = function() {
    return this.vertexes.length;
}

PaintObj.prototype.setVertexes  = function(vertexes) {
    this.vertexes = vertexes;
    return this;
}

PaintObj.prototype.getIndexes   = function() {
    return this.indexes;
}

PaintObj.prototype.getIndexNum  = function() {
    return this.indexes.length;
}

PaintObj.prototype.setIndexes   = function(indexes) {
    this.indexes = indexes;
    return this;
}

PaintObj.prototype.setOffset = function(offset) {
    this.xoff = offset[0];
    this.yoff = offset[1];
    this.zoff = offset[2];
    mat4.fromTranslation(this.mvMat, vec3.fromValues(this.xoff, this.yoff, this.zoff));
//    for(var i = 0; i < this.vertexes.length; i = i+3) {
//        this.vertexes[i+0] += this.xoff;
//        this.vertexes[i+1] += this.yoff;
//        this.vertexes[i+2] += this.zoff;
//    }
}

PaintObj.prototype.moveOnX = function(move) {
    this.xoff += move;
    for(var i = 0; i < this.vertexes.length; i = i+3) {
        this.vertexes[i] += move;
    }
}

PaintObj.prototype.moveOnY = function(move) {
    this.yoff += move;
    for(var i = 0; i < this.vertexes.length; i = i+3) {
        this.vertexes[i+1] += move;
    }
}

PaintObj.prototype.moveOnZ = function(move) {
    this.zoff += move;
    for(var i = 0; i < this.vertexes.length; i = i+3) {
        this.vertexes[i+2] += move;
    }
}

/**
  * get circle point on XOY plane
  * @param {Object} config
**/
PaintObj.prototype.getCircle = function(config) {
    var points = []; // 二维数组，每个元素是一个三维数组，包含顶点的 xyz 坐标
    if(config.origin) {
        points.concat(0, 0, 0);
    }
    var i = 0;
    for(i = 0; i < config.edge; i++) {
//        point = [pointSize * Math.cos(Math.PI * 2 * i / config.edge), pointSize * Math.sin(Math.PI * 2 * i / config.edge), 0];
        points.push(config.pointSize * Math.cos(Math.PI * 2 * i / config.edge));
        points.push(config.pointSize * Math.sin(Math.PI * 2 * i / config.edge));
        points.push(0);
    }
    // 优化数组连接，concat 在这里的时间复杂度为 O(n2)
//    points.push.apply(points, this.rotateNormal(config));
    this.vertexes = points;
    return this;
}

/**
*  调整PaintObj的法线方向，默认法线方向指向Z轴
*  首先以原点为中心，
**/
PaintObj.prototype.rotateNormal = function(config) {
    var u = config.u;
    var v = config.v;
    var f = config.f;

    for(var i = 0; i < this.vertexes.length; i += 3) {
        var point = [this.vertexes[i+0], this.vertexes[i+1], this.vertexes[i+2]];
        // 变量 f 影响面的旋转
        var tp0 = point[0];
        var tp1 = point[1];
        point[0] = tp0 * Math.cos(Math.PI * 2 * f) - tp1 * Math.sin(Math.PI * 2 * f);
        point[1] = tp1 * Math.cos(Math.PI * 2 * f) + tp0 * Math.sin(Math.PI * 2 * f);
        // 处理 u 带来的变化
        tp0 = point[0];
        point[0] = tp0 * Math.cos(-Math.PI * u);
        point[2] = tp0 * Math.sin(-Math.PI * u);
        // 处理 v 带来的变化
        tp0 = point[0] * Math.cos(-Math.PI * 2 * v) + point[1] * Math.sin(-Math.PI * 2 * v);
        tp1 = point[1] * Math.cos(-Math.PI * 2 * v) - point[0] * Math.sin(-Math.PI * 2 * v);
        point[0] = tp0;
        point[1] = tp1;
        this.vertexes[i+0] = point[0];
        this.vertexes[i+1] = point[1];
        this.vertexes[i+2] = point[2];
    }
    return this.vertexes;
}

/**
 * 根据 u，v 计算传感器当前位置四周的点的位置
 * 获取点位置用的方法是：先在 XOY 平面上绘制出相应图形，根据 u, v 进行旋转，
 * 然后根据 u, v, offset 确定的向量进行平移
 * 注意：由于可能需要原点，因此这里的顶点个数为n+1。
 * @param {array} angles   angles[0] = u, angles[1] = v, angles[2] = f
 * @param {double} offset 与原点的距离
 * @param {double} pointSize  中心点到顶点的距离
 * @param {int}    n          边数，至少为 4
 * @param {*} rgb  三维数组，可以不再使用
 * @returns 坐标和颜色的数组
 */

PaintObj.prototype.getCirclePoints = function(angles, offset, pointSize, n, rgb) {
    var u = angles[0];
    var v = angles[1];
    var f = angles[2];
    var points = []; // 二级数组，每个元素是一个三维数组，包含顶点的 xyz 坐标
    var point = [];
    /* 处理旋转,从 xoy 平面上的 (r, 0) 开始，计算每个顶点的位置，然后将其反转，旋转得到相应角度的平面 */
    for (var i = 0; i < n; i++) {
        point = [pointSize * Math.cos(Math.PI * 2 * i / n), pointSize * Math.sin(Math.PI * 2 * i / n), 0];
        points.push(point);
    }
    return points;
}

