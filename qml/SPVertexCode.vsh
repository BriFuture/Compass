//precision mediump;
attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTexture;
attribute vec3 aColor;

uniform mat4 uPMVMatrix;
uniform mat4 uMMatrix;
uniform mat4 uNMatrix;

uniform vec3  uLightDirection; // 直射光的方向
varying vec3  vLight;
varying vec2  vTexture;


void main(void) {
    gl_Position = uPMVMatrix * vec4(aVertexPosition, 1.0);
    vec3 ambientLight = vec3( 0.28, 0.28, 0.28 );
    vec3 directLightColor = vec3( 0.51, 0.55, 0.52 );
    vec3 normal = normalize( vec3( uNMatrix * vec4( aVertexNormal, 1 ) ) );
    float directional = max( dot( normal, normalize( uLightDirection ) ), 0.0);        // 直接使用顶点的法线数据进行漫反射计算
    vec3 diffuse = directLightColor * directional;
    vLight = aColor * (ambientLight + diffuse);
    vTexture = aTexture;
}
