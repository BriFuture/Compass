uniform sampler2D qt_Texture0;
varying highp vec4 qt_TexCoord0;

void main(void)
{
    gl_FragColor = texture2D(qt_Texture0, qt_TexCoord0.st);
}

'attribute vec3 aVertexPosition;\n'  +
'attribute vec3 aVertexNormal;\n'    +
'attribute vec2 aTexture;\n'         +
'attribute vec3 aColor;\n'           +
'uniform highp mat4 uPMVMatrix;\n'   +
'uniform highp mat4 uMMatrix;\n'     +
'uniform vec3  uLightDirection;\n'   + // 直射光的方向
'varying vec3  vLight;\n'            +
'varying vec2  vTexture;\n'          +
'void main(void) {\n'                +
'  gl_Position = uPMVMatrix * vec4(aVertexPosition, 1.0);\n'      +
'  highp vec3 ambientLight = vec3(0.28, 0.28, 0.28);\n'           +
'  highp vec3 directionalLightColor = vec3(0.51, 0.55, 0.52);\n'  +
'  highp float directional = max(dot(aVertexNormal, normalize(uLightDirection)), 0.0);\n' +        // 直接使用顶点的法线数据进行漫反射计算
'  vLight = aColor * (ambientLight + (directionalLightColor * directional));\n'  +
'}\n';
