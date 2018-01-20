varying vec3  vLight;
varying vec2  vTexture;
uniform float uAlpha;
// uniform sampler2D uXSampler;
// uniform sampler2D uYSampler;
// uniform sampler2D uZSampler;
// uniform int uEnableTexture;
uniform vec4 uFragColor;
void main(void) {
  gl_FragColor = vec4(vLight, uAlpha);
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
