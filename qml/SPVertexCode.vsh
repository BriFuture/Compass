attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTexture;
attribute vec3 aColor;
uniform highp mat4 uPMVMatrix;
uniform highp mat4 uMMatrix;
uniform vec3  uLightDirection; // 直射光的方向
varying vec3  vLight;
varying vec2  vTexture;
void main(void) {
    gl_Position = uPMVMatrix * vec4(aVertexPosition, 1.0);
    highp vec3 ambientLight = vec3(0.28, 0.28, 0.28);
    highp vec3 directionalLightColor = vec3(0.51, 0.55, 0.52);
    highp float directional = max(dot(aVertexNormal, normalize(uLightDirection)), 0.0);        // 直接使用顶点的法线数据进行漫反射计算
    vLight = aColor * (ambientLight + (directionalLightColor * directional));
};
