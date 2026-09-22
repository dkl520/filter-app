// app.js — WebGL filter engine + UI wiring

const VERT_SRC = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = (a_pos + 1.0) / 2.0;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG_SRC = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform vec2 u_uvScale;
uniform vec2 u_uvOffset;

uniform float u_exposure, u_contrast, u_saturation, u_temp, u_tint;
uniform float u_highlights, u_shadows, u_fade, u_grain, u_vignette, u_clarity;
uniform vec3 u_splitShadow, u_splitHighlight;
uniform float u_splitAmount;
uniform vec3 u_channelSat;
uniform float u_posterize, u_edge, u_rgbShift, u_glitch, u_dust, u_glow, u_vhs, u_seed;

float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = v_uv * u_uvScale + u_uvOffset;

  if (u_glitch > 0.0) {
    float band = floor(uv.y * 40.0);
    float off = (rand(vec2(band, u_seed)) - 0.5) * u_glitch * 0.06;
    uv.x += off;
  }

  vec2 texel = 1.0 / u_resolution;
  vec3 color;
  if (u_rgbShift > 0.0) {
    float s = u_rgbShift * 0.01;
    float r = texture2D(u_image, uv + vec2(s, 0.0)).r;
    float g = texture2D(u_image, uv).g;
    float b = texture2D(u_image, uv - vec2(s, 0.0)).b;
    color = vec3(r, g, b);
  } else {
    color = texture2D(u_image, uv).rgb;
  }

  if (abs(u_clarity) > 0.001) {
    vec3 blur = (
      texture2D(u_image, uv + vec2(texel.x, 0.0)).rgb +
      texture2D(u_image, uv - vec2(texel.x, 0.0)).rgb +
      texture2D(u_image, uv + vec2(0.0, texel.y)).rgb +
      texture2D(u_image, uv - vec2(0.0, texel.y)).rgb
    ) * 0.25;
    color += (color - blur) * u_clarity * 1.8;
  }

  if (u_glow > 0.0) {
    vec3 blur2 = (
      texture2D(u_image, uv + vec2(texel.x * 2.0, 0.0)).rgb +
      texture2D(u_image, uv - vec2(texel.x * 2.0, 0.0)).rgb +
      texture2D(u_image, uv + vec2(0.0, texel.y * 2.0)).rgb +
      texture2D(u_image, uv - vec2(0.0, texel.y * 2.0)).rgb
    ) * 0.25;
    color = mix(color, color + blur2 * 0.5, u_glow);
  }

  color += u_exposure;
  color.r += u_temp * 0.16;
  color.b -= u_temp * 0.16;
  color.g -= u_tint * 0.12;
  color.r += u_tint * 0.04;
  color.b += u_tint * 0.04;

  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  float hiMask = smoothstep(0.5, 1.0, luma);
  float shMask = 1.0 - smoothstep(0.0, 0.5, luma);
  color += u_highlights * 0.35 * hiMask;
  color += u_shadows * 0.35 * shMask;

  color = (color - 0.5) * (1.0 + u_contrast) + 0.5;

  color = mix(color, vec3(0.52, 0.50, 0.47), u_fade * 0.35);
  color = mix(color, max(color, vec3(0.06)), u_fade * 0.5);

  luma = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(luma), color, 1.0 + u_saturation);

  vec3 diff = color - vec3(luma);
  diff *= (vec3(1.0) + u_channelSat);
  color = vec3(luma) + diff;

  if (u_splitAmount > 0.0) {
    float t = smoothstep(0.2, 0.8, luma);
    vec3 tone = mix(u_splitShadow, u_splitHighlight, t);
    color = mix(color, color * tone * 2.0, u_splitAmount);
  }

  if (u_posterize > 0.5) {
    color = floor(color * u_posterize) / u_posterize;
  }

  if (u_edge > 0.0) {
    float l = luma;
    float lx = dot(texture2D(u_image, uv + vec2(texel.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
    float ly = dot(texture2D(u_image, uv + vec2(0.0, texel.y)).rgb, vec3(0.299, 0.587, 0.114));
    float e = clamp((abs(l - lx) + abs(l - ly)) * 6.0, 0.0, 1.0);
    color = mix(color, vec3(0.0), e * u_edge);
  }

  if (u_dust > 0.0) {
    float d = rand(uv * vec2(400.0, 300.0) + u_seed);
    if (d > 0.995) color = mix(color, vec3(1.0), 0.7 * u_dust);
  }

  if (u_vhs > 0.0) {
    color *= 1.0 - 0.05 * u_vhs * (0.5 + 0.5 * sin(uv.y * 800.0));
  }

  if (u_grain > 0.0) {
    float n = (rand(uv * u_resolution * 0.4 + u_seed) - 0.5) * u_grain * 0.25;
    color += vec3(n);
  }

  if (u_vignette > 0.0) {
    vec2 c = uv - 0.5;
    float d = length(c) * 1.4;
    float v = smoothstep(0.4, 1.0, d);
    color *= 1.0 - v * u_vignette * 1.5;
  }

  color = clamp(color, 0.0, 1.0);
  gl_FragColor = vec4(color, 1.0);
}
`;

const UNIFORM_MAP = {
  u_exposure: 'exp', u_contrast: 'contrast', u_saturation: 'sat',
  u_temp: 'temp', u_tint: 'tint', u_highlights: 'highlights', u_shadows: 'shadows',
  u_fade: 'fade', u_grain: 'grain', u_vignette: 'vignette', u_clarity: 'clarity',
  u_splitAmount: 'splitAmount', u_posterize: 'posterize', u_edge: 'edge',
  u_rgbShift: 'rgbShift', u_glitch: 'glitch', u_dust: 'dust', u_glow: 'glow', u_vhs: 'vhs',
};
const VEC3_UNIFORMS = { u_splitShadow: 'splitShadow', u_splitHighlight: 'splitHighlight', u_channelSat: 'channelSat' };

function compileShader(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error('Shader compile error: ' + info);
  }
  return sh;
}

function createProgram(gl) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error('Program link error: ' + gl.getProgramInfoLog(program));
  }
  return program;
}

function createRenderer(canvas) {
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true }) ||
             canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });
  if (!gl) throw new Error('WebGL is not supported in this browser.');

  const program = createProgram(gl);
  gl.useProgram(program);

  const posLoc = gl.getAttribLocation(program, 'a_pos');
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const uImage = gl.getUniformLocation(program, 'u_image');
  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uUvScale = gl.getUniformLocation(program, 'u_uvScale');
  const uUvOffset = gl.getUniformLocation(program, 'u_uvOffset');
  const uSeed = gl.getUniformLocation(program, 'u_seed');

  const floatLocs = {};
  Object.keys(UNIFORM_MAP).forEach((name) => { floatLocs[name] = gl.getUniformLocation(program, name); });
  const vec3Locs = {};
  Object.keys(VEC3_UNIFORMS).forEach((name) => { vec3Locs[name] = gl.getUniformLocation(program, name); });

  function setImage(imgEl) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgEl);
  }

  function render(params, width, height, opts) {
    opts = opts || {};
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
    gl.useProgram(program);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uImage, 0);
    gl.uniform2f(uResolution, width, height);
    gl.uniform2f(uUvScale, (opts.uvScale && opts.uvScale[0]) || 1, (opts.uvScale && opts.uvScale[1]) || 1);
    gl.uniform2f(uUvOffset, (opts.uvOffset && opts.uvOffset[0]) || 0, (opts.uvOffset && opts.uvOffset[1]) || 0);
    gl.uniform1f(uSeed, opts.seed || 0);

    Object.keys(UNIFORM_MAP).forEach((name) => {
      gl.uniform1f(floatLocs[name], params[UNIFORM_MAP[name]]);
    });
    Object.keys(VEC3_UNIFORMS).forEach((name) => {
      gl.uniform3fv(vec3Locs[name], params[VEC3_UNIFORMS[name]]);
    });

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  return { setImage, render, canvas };
}

// ---------- UI wiring ----------

(function main() {
  const colLeft = document.getElementById('colLeft');
  const colRight = document.getElementById('colRight');
  const compare = document.getElementById('compare');
  const canvasOriginal = document.getElementById('canvasOriginal');
  const canvasFiltered = document.getElementById('canvasFiltered');
  const handle = document.getElementById('handle');
  const slider = document.getElementById('slider');
  const emptyState = document.getElementById('emptyState');
  const uploadBtn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('fileInput');
  const downloadBtn = document.getElementById('downloadBtn');
  const currentFilterLabel = document.getElementById('currentFilterLabel');
  const stage = document.getElementById('stage');

  let mainRenderer, thumbRenderer;
  try {
    mainRenderer = createRenderer(canvasFiltered);
    thumbRenderer = createRenderer(document.createElement('canvas'));
  } catch (e) {
    emptyState.textContent = 'WebGL 初始化失败：' + e.message;
    return;
  }

  const ctxOriginal = canvasOriginal.getContext('2d');
  const state = { img: null, activeIndex: 0, seed: Math.random() * 100, itemEls: [] };

  // ---- build filter list columns ----
  const half = Math.ceil(window.FILTERS.length / 2);
  window.FILTERS.forEach((f, i) => {
    const el = document.createElement('button');
    el.className = 'filter-item';
    el.type = 'button';
    el.title = f.prompt;
    el.innerHTML =
      '<span class="swatch" data-swatch></span>' +
      '<span class="names"><span class="name-en">' + f.en + '</span>' +
      '<span class="name-cn">' + f.cn + '</span></span>' +
      '<span class="idx">' + String(i + 1).padStart(2, '0') + '</span>';
    el.addEventListener('click', () => selectFilter(i));
    (i < half ? colLeft : colRight).appendChild(el);
    state.itemEls[i] = el;
  });

  function setActiveClass(i) {
    state.itemEls.forEach((el, idx) => el.classList.toggle('active', idx === i));
    const activeEl = state.itemEls[i];
    if (activeEl && activeEl.scrollIntoView) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function selectFilter(i) {
    state.activeIndex = i;
    const f = window.FILTERS[i];
    setActiveClass(i);
    currentFilterLabel.textContent = '当前滤镜 · ' + f.en + ' ' + f.cn;
    if (state.img) renderMain();
  }

  function computeCoverUv(w, h) {
    if (w > h) {
      const scale = h / w;
      return { scale: [scale, 1], offset: [(1 - scale) / 2, 0] };
    } else {
      const scale = w / h;
      return { scale: [1, scale], offset: [0, (1 - scale) / 2] };
    }
  }

  function renderMain() {
    const f = window.FILTERS[state.activeIndex];
    mainRenderer.render(f.params, state.dispW, state.dispH, { seed: state.seed });
  }

  function layoutCanvases() {
    if (!state.img) return;
    const maxW = Math.min(stage.clientWidth - 4, 920);
    const maxH = Math.min(window.innerHeight * 0.58, 640);
    const iw = state.img.naturalWidth, ih = state.img.naturalHeight;
    const scale = Math.min(maxW / iw, maxH / ih, 1.6);
    state.dispW = Math.round(iw * scale);
    state.dispH = Math.round(ih * scale);
    compare.style.width = state.dispW + 'px';
    compare.style.height = state.dispH + 'px';

    canvasOriginal.width = state.dispW;
    canvasOriginal.height = state.dispH;
    ctxOriginal.drawImage(state.img, 0, 0, state.dispW, state.dispH);

    renderMain();
    updateSliderClip();
  }

  function updateSliderClip() {
    const v = Number(slider.value);
    canvasFiltered.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
    handle.style.left = v + '%';
  }

  slider.addEventListener('input', updateSliderClip);

  // ---- thumbnails ----
  function generateThumbnails() {
    const THUMB = 64;
    thumbRenderer.setImage(state.img);
    const cover = computeCoverUv(state.img.naturalWidth, state.img.naturalHeight);
    window.FILTERS.forEach((f, i) => {
      thumbRenderer.render(f.params, THUMB, THUMB, { uvScale: cover.scale, uvOffset: cover.offset, seed: state.seed });
      const url = thumbRenderer.canvas.toDataURL('image/jpeg', 0.85);
      const sw = state.itemEls[i].querySelector('[data-swatch]');
      sw.style.backgroundImage = 'url(' + url + ')';
    });
  }

  // ---- image loading ----
  function loadImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      state.img = img;
      state.seed = Math.random() * 100;
      mainRenderer.setImage(img);
      emptyState.style.display = 'none';
      downloadBtn.disabled = false;
      slider.disabled = false;
      layoutCanvases();
      generateThumbnails();
      const randomIndex = Math.floor(Math.random() * window.FILTERS.length);
      selectFilter(randomIndex);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { emptyState.textContent = '图片加载失败，请重试'; };
    img.src = url;
  }

  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) loadImageFile(e.target.files[0]);
  });

  ['dragover', 'dragenter'].forEach((evt) =>
    compare.addEventListener(evt, (e) => { e.preventDefault(); compare.classList.add('drag'); })
  );
  ['dragleave', 'drop'].forEach((evt) =>
    compare.addEventListener(evt, (e) => { e.preventDefault(); compare.classList.remove('drag'); })
  );
  compare.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) loadImageFile(e.dataTransfer.files[0]);
  });

  window.addEventListener('resize', () => { if (state.img) layoutCanvases(); });

  // ---- download ----
  downloadBtn.addEventListener('click', () => {
    if (!state.img) return;
    const f = window.FILTERS[state.activeIndex];
    const fullCanvas = document.createElement('canvas');
    const fullRenderer = createRenderer(fullCanvas);
    fullRenderer.setImage(state.img);
    fullRenderer.render(f.params, state.img.naturalWidth, state.img.naturalHeight, { seed: state.seed });
    fullCanvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'filtered-' + f.en.toLowerCase().replace(/\s+/g, '-') + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }, 'image/png');
  });

  // initial label
  currentFilterLabel.textContent = '上传照片后随机为你选择一个滤镜';
})();
