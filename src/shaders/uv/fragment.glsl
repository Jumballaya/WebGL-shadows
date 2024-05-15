#version 300 es

precision mediump float;

out vec4 outColor;
in vec2 v_uv;

void main() {
  vec3 color = vec3(v_uv, 1.0);
  outColor = vec4(color, 1.0);
}