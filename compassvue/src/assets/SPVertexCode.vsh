precision mediump float;

attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTexture;
attribute vec3 aColor;

uniform mat4 uPMVMatrix;
uniform mat4 uMMatrix;
uniform mat4 uNMatrix;
uniform vec3 uVertColor;
uniform bool uSpecColor;

uniform vec3  uLightDirection; // 直射光的方向
varying vec3  vLight;
varying vec2  vTexture;
varying vec3  vNormal;
varying vec3  vPosition;


void main(void) {
    gl_Position = uPMVMatrix * vec4(aVertexPosition, 1.0);

    vec3 normal = normalize( vec3( uNMatrix * vec4( aVertexNormal, 1 ) ) );
    vNormal = normal;
    vPosition = vec3( uMMatrix * vec4( aVertexPosition , 1.0 ) );

//    vec3 ambientLight     = vec3( 0.2, 0.24, 0.21 );
//    vec3 directLightColor = vec3( 0.75, 0.75, 0.75 );
//    float directional = max( dot( normal, normalize( uLightDirection ) ), 0.0);
//    vec3 diffuse = directLightColor * directional;

    if( !uSpecColor ) {
//        vLight = aColor * (ambientLight + diffuse);
        vLight = aColor;
    } else {
//        vLight = uVertColor * (ambientLight + diffuse);
        vLight = uVertColor;
    }
    vTexture = aTexture;
}
