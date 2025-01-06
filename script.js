import { GUI } from "https://cdn.skypack.dev/dat.gui";

const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function getShaderSource(id) {
  return document.getElementById(id).textContent;
}

const vertexShaderSource = getShaderSource("vertex-shader");
const fragmentShaderSource = getShaderSource("fragment-shader");

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      "An error occurred compiling the shaders:",
      gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(
      "Unable to initialize the shader program:",
      gl.getProgramInfoLog(program)
    );
    return null;
  }
  return program;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(
  gl,
  gl.FRAGMENT_SHADER,
  fragmentShaderSource
);
const program = createProgram(gl, vertexShader, fragmentShader);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

gl.useProgram(program);

const u_pattern = gl.getUniformLocation(program, 'u_pattern');
const u_swirl = gl.getUniformLocation(program, 'u_swirl');
const u_detail = gl.getUniformLocation(program, 'u_detail');
const u_rotationSpeed = gl.getUniformLocation(program, 'u_rotationSpeed');
const u_warp = gl.getUniformLocation(program, 'u_warp');
const u_warpIntensity = gl.getUniformLocation(program, 'u_warpIntensity');
const u_reflection = gl.getUniformLocation(program, 'u_reflection');
const u_movementSpeed = gl.getUniformLocation(program, 'u_movementSpeed');
const u_color = gl.getUniformLocation(program, 'u_color');
const u_highContrast = gl.getUniformLocation(program, 'u_highContrast');
const u_discard = gl.getUniformLocation(program, 'u_discard');

const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
const timeLocation = gl.getUniformLocation(program, "u_time");

const gui = new GUI({ width: "100%", closeOnTop: true, closed: true });
const guiParams = {
  pattern: true,
  swirl: 0.4,
  detail: 50.0,
  rotationSpeed: 5.0,
  warp: false,
  warpIntensity: 0.2,
  reflection: 0.5,
  movementSpeed: 5.0,
  color: 2958.0,
  highContrast: false,
  discard: 0.3
};
gui.domElement.querySelector(".close-button").innerHTML = "Open Controls";
gl.uniform1f(u_pattern, guiParams.pattern);
gl.uniform1f(u_swirl, guiParams.swirl);
gl.uniform1f(u_detail, guiParams.detail);
gl.uniform1f(u_rotationSpeed, guiParams.rotationSpeed);
gl.uniform1f(u_warp, guiParams.warp);
gl.uniform1f(u_warpIntensity, guiParams.warpIntensity);
gl.uniform1f(u_reflection, guiParams.reflection);
gl.uniform1f(u_movementSpeed, guiParams.movementSpeed);
gl.uniform1f(u_color, guiParams.color);
gl.uniform1f(u_highContrast, guiParams.highContrast);
gl.uniform1f(u_discard, guiParams.discard);

gui.add(guiParams, 'pattern').onChange((value) => {
  gl.uniform1f(u_pattern, value);
  if(!value){
     guiParams.discard = 0.0;
     gl.uniform1f(u_discard, 0.0); 
  }
});
gui.add(guiParams, 'detail', 0.0, 50.0).onChange((value) => {
  gl.uniform1f(u_detail, parseInt(value));
});
gui.add(guiParams, 'swirl', 0.0, 10.0).onChange((value) => {
  gl.uniform1f(u_swirl, parseInt(value));
});
gui.add(guiParams, 'rotationSpeed', 0.0, 50.0).onChange((value) => {
  gl.uniform1f(u_rotationSpeed, parseInt(value));
});
gui.add(guiParams, 'warp').onChange((value) => {
  gl.uniform1f(u_warp, value);
});
gui.add(guiParams, 'warpIntensity', 0.0, 5.0).onChange((value) => {
  gl.uniform1f(u_warpIntensity, value);
});
gui.add(guiParams, 'reflection', 0.0, 1.0).onChange((value) => {
  gl.uniform1f(u_reflection, value);
});
gui.add(guiParams, 'movementSpeed', 0.0, 100.0).onChange((value) => {
  gl.uniform1f(u_movementSpeed, value);
});
gui.add(guiParams, 'color', 0.0, 10000.0).onChange((value) => {
  gl.uniform1f(u_color, value);
});
gui.add(guiParams, 'highContrast').onChange((value) => {
  gl.uniform1f(u_highContrast, value);
});
gui.add(guiParams, 'discard', 0.0, 2.0).onChange((value) => {
  gl.uniform1f(u_discard, value);
});
gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);

let startTime = null;

function render(time) {
  if (!startTime) startTime = time;

  const elapsedTime = (time - startTime) * 0.001;

  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
  gl.uniform1f(timeLocation, elapsedTime);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  requestAnimationFrame(render);
}

resize();
function resize() {
  const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * devicePixelRatio);
  canvas.height = Math.floor(window.innerHeight * devicePixelRatio);
  gl.viewport(0, 0, canvas.width, canvas.height);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  document.documentElement.requestFullscreen();
}

window.addEventListener("resize", resize);

requestAnimationFrame(render);
