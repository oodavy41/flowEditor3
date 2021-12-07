export default {
  vert: `
  attribute float percent;
  varying float vpercent;

  void main() {

    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    vpercent = percent;
    gl_Position = projectionMatrix * mvPosition;

  }
  `,
  frag: `
  uniform float length;
  uniform float time;
  uniform float speed;
  uniform float opacity;
  uniform float dashLength;
  uniform float dashSpace;
  uniform vec3 color;

  varying float vpercent;

  void main() {
    float offset = mod(time * speed + length * vpercent, dashLength + dashSpace);
    float showing = opacity;
    if(offset > dashLength){
      showing = 0.0;
    }
    gl_FragColor =vec4(color , showing);

  }
  `,
};
