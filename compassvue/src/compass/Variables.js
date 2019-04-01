var states = {
  gl: "not initialized",
};

var attitude = {
  heading: 0,
  pitch: 0,
  roll: 0
}

var attributes = {};  // attribute variables from shader
var uniforms = {};    // uniform variables from shader
export {states, uniforms, attributes, attitude};