# Light and Shadow

[Test this out yourself](https://jumballaya.github.io/WebGL-shadows/)

Technique used:

1. Create orthographic camera for light
2. Create FBO with depth attachment
3. Render scene with front-face culling on, to FBO
4. Render scene to main framebuffer with depth texture as the shadow-map
5. Calculate shadows with the lighting shader
