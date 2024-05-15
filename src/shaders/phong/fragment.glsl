#version 300 es

precision mediump float;

out vec4 outColor;
in vec2 v_uv;
in vec3 v_normal;
in vec3 v_pos;
in vec4 v_pos_light_space;

struct Material {
  sampler2D diffuse;
  sampler2D specular;
  float shininess;
  float albedoScale;
};

struct Light {
  vec3 position;
  vec3 direction;
  vec3 color;
  float ambient;
  float specular;
};

uniform Light u_light;
uniform Material u_material;
uniform vec3 u_view_position;
uniform sampler2D u_tex_depth;

float calculate_shadows(float bias) {
  vec3 projCoords = v_pos_light_space.xyz / v_pos_light_space.w;
  float shadow = 0.0;
  if (projCoords.z > 1.0) {
    return shadow;
  }
  projCoords = projCoords * 0.5 + 0.5;
  float currentDepth = projCoords.z;
  vec2 texelSize = 1.0 / vec2(textureSize(u_tex_depth, 0));
  for (int x = -3; x <= 3; ++x) {
    for (int y = -3; y <= 3; ++y) {
      float pcfDepth = texture(u_tex_depth, projCoords.xy + vec2(x, y) * texelSize).r; 
      shadow += currentDepth - bias > pcfDepth ? 1.0 : 0.0;        
    }
  }
  shadow /= 49.0;
  return shadow;
}

void main() {
  float gamma = 2.2;

  // BASE COLOR
  vec3 color = texture(u_material.diffuse, v_uv * u_material.albedoScale).rgb;

  // CALCULATE AMBIENT
  vec3 ambient = u_light.color * u_light.ambient * color;
  

  // CALCULATE DIFFUSE
  vec3 normal = normalize(v_normal);
  vec3 light_dir = normalize(-u_light.direction);
  float diff = max(dot(light_dir, normal), 0.0);
  vec3 diffuse = diff * u_light.color;
  
  // CALCULATE SPECULAR
  vec3 specular_map = texture(u_material.specular, v_uv).rgb;
  vec3 view_dir = normalize(u_view_position - v_pos);
  float spec = 0.0;
  vec3 halfwayDir = normalize(light_dir + view_dir);
  spec = pow(max(dot(normal, halfwayDir), 0.0), u_material.shininess);
  vec3 specular = u_light.specular * spec * specular_map;

  // CALCULATE SHADOWS
  float shadow = calculate_shadows(0.00001);
  vec3 lighting = (ambient + (1.0 - shadow) * (diffuse + specular)) * color * 0.5;
  outColor = vec4(lighting, 1.0);

  outColor.rgb = pow(outColor.rgb, vec3(1.0 / gamma));
}