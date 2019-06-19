precision mediump float;

varying vec3  vLight;
varying vec2  vTexture;
varying vec3  vNormal;
varying vec3  vPosition;

uniform float uAlpha;
uniform vec3 uFragColor;
uniform bool uHasTexture;
uniform sampler2D uSampler;

// uniform sampler2D uYSampler;
// uniform sampler2D uZSampler;
// uniform int uEnableTexture;
void main(void) {
    vec3 lightPos = vec3( 10, 10, 10 );
    vec3 ambientLight = vec3( 0.48, 0.38, 0.42 );
    vec3 directLightColor = vec3( 0.78, 0.98, 0.88 );
    float directional = max( dot( normalize( vNormal ), normalize( lightPos - vPosition ) ) * 2, 0.0);        // 直接使用顶点的法线数据进行漫反射计算
    vec3 diffuse = directLightColor * directional;

    if( uHasTexture ) {
//        vec4 color = mix( uFragColor, texture2D( uSampler, vec2( vTexture.s, vTexture.t ) ), 0.5 );
        gl_FragColor = vec4( uFragColor * (diffuse + ambientLight), uAlpha );
    }
    else {
        gl_FragColor = vec4( vLight * (diffuse + ambientLight), uAlpha );
    }
//   mediump vec4 xtextureColor = texture2D(uXSampler, vec2(vXTexture.s, vXTexture.t));
//   mediump vec4 ytextureColor = texture2D(uYSampler, vec2(vXTexture.s, vXTexture.t));
//   mediump vec4 ztextureColor = texture2D(uZSampler, vec2(vXTexture.s, vXTexture.t));
//   if( uEnableTexture == 0 ) {
//     gl_FragColor = vec4(vLight, uAlpha);
//   }
//   else if( uEnableTexture == 1 ) {
//     gl_FragColor = vec4(vLight, 1.0) * xtextureColor;
//   }
//   else if( uEnableTexture == 2 ) {
//     gl_FragColor = vec4(vLight, 1.0) * ytextureColor;}
//   else if( uEnableTexture == 3 ) {
//     gl_FragColor = vec4(vLight, 1.0) * ztextureColor;
//   }
}
