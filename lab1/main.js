// CS405 · Lab 1 — a rotating square in WebGPU.
const canvas = document.querySelector('canvas');

// TODO 1: get a device and configure the canvas.
if (!navigator.gpu) throw new Error('WebGPU is not available. Use localhost or HTTPS.');
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) throw new Error('No WebGPU adapter is available.');
const device = await adapter.requestDevice();
const ctx = canvas.getContext('webgpu');
if (!ctx) throw new Error('Could not create a WebGPU canvas context.');
const format = navigator.gpu.getPreferredCanvasFormat();
ctx.configure({ device, format, alphaMode: 'opaque' });
console.log('WebGPU ready:', format);

// TODO 2: create the vertex and fragment shaders and the pipeline.
const SHADER = `
  struct U { time: f32, aspect: f32, mouse: vec2f };
  @group(0) @binding(0) var<uniform> u: U;
  struct VSOut {
    @builtin(position) pos: vec4f,
    @location(0) colour: vec4f,
  };

  @vertex fn vs(@builtin(vertex_index) i: u32) -> VSOut {
    // TODO 5: two triangles make a square; shared corners match.
    var p = array<vec2f, 6>(
      vec2f(-0.35, -0.35), vec2f(0.35, -0.35), vec2f(0.35, 0.35),
      vec2f(-0.35, -0.35), vec2f(0.35, 0.35), vec2f(-0.35, 0.35),
    );
    // TODO 3: pass vertex colours to the fragment shader.
    var c = array<vec3f, 6>(
      vec3f(1.0, 0.0, 0.0), vec3f(0.0, 1.0, 0.0), vec3f(0.0, 0.0, 1.0),
      vec3f(1.0, 0.0, 0.0), vec3f(0.0, 0.0, 1.0), vec3f(1.0, 1.0, 0.0),
    );
    // TODO 4: rotate the vertex, as in the lab example.
    let a = u.time;
    let q = vec2f(p[i].x * cos(a) - p[i].y * sin(a),
                  p[i].x * sin(a) + p[i].y * cos(a));
    var out: VSOut;
    // TODO 5: correct the aspect ratio, then move to the mouse.
    out.pos = vec4f(vec2f(q.x / u.aspect, q.y) + u.mouse, 0.0, 1.0);
    out.colour = vec4f(c[i], 1.0);
    return out;
  }
  @fragment fn fs(in: VSOut) -> @location(0) vec4f {
    return in.colour;
  }
`;
const module = device.createShaderModule({ code: SHADER });
const pipeline = device.createRenderPipeline({
  layout: 'auto',
  vertex: { module, entryPoint: 'vs' },
  fragment: { module, entryPoint: 'fs', targets: [{ format }] },
});

// TODO 4: time, aspect ratio and mouse coordinates occupy 16 bytes.
const ubuf = device.createBuffer({
  size: 16,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
const bind = device.createBindGroup({
  layout: pipeline.getBindGroupLayout(0),
  entries: [{ binding: 0, resource: { buffer: ubuf } }],
});

// TODO 5: convert canvas pixels to clip coordinates in [-1, 1].
let mouseX = 0;
let mouseY = 0;
canvas.addEventListener('pointermove', event => {
  const r = canvas.getBoundingClientRect();
  if (!r.width || !r.height) return;
  mouseX = 2 * (event.clientX - r.left) / r.width - 1;
  mouseY = 1 - 2 * (event.clientY - r.top) / r.height;
});
function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(r.width * dpr));
  canvas.height = Math.max(1, Math.round(r.height * dpr));
}
window.addEventListener('resize', resize);
resize();

const t0 = performance.now();
function frame() {
  // TODO 4: update the uniform buffer each frame.
  const t = (performance.now() - t0) * 0.001;
  const aspect = canvas.width / canvas.height;
  device.queue.writeBuffer(ubuf, 0, new Float32Array([t, aspect, mouseX, mouseY]));

  // TODO 1: record and submit a render pass.
  const enc = device.createCommandEncoder();
  const pass = enc.beginRenderPass({ colorAttachments: [{
    view: ctx.getCurrentTexture().createView(),
    clearValue: { r: 0.19, g: 0.2, b: 0.6, a: 1 },
    loadOp: 'clear', storeOp: 'store',
  }] });
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bind);
  pass.draw(6);
  pass.end();
  device.queue.submit([enc.finish()]);
  requestAnimationFrame(frame);
}
frame();
