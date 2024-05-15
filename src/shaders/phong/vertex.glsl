#version 300 es

layout(location=0) in vec4 a_position;
layout(location=1) in vec2 a_uv;
layout(location=2) in vec3 a_normal;

out vec2 v_uv;
out vec3 v_normal;
out vec3 v_pos;
out vec4 v_pos_light_space;

uniform mat4 u_model_matrix;
uniform mat4 u_view_matrix;
uniform mat4 u_projection_matrix;

uniform mat4 u_light_view_matrix;
uniform mat4 u_light_projection_matrix;

void main() {
  mat4 light_space_matrix = u_light_projection_matrix * u_light_view_matrix;
  v_uv = a_uv;
  v_normal = mat3(transpose(inverse(u_model_matrix))) * a_normal;
  v_pos = vec3(u_model_matrix * a_position);
  v_pos_light_space = light_space_matrix * vec4(v_pos, 1.0);

  gl_Position = u_projection_matrix * u_view_matrix * vec4(v_pos, 1.0);
}