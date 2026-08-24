import * as THREE from "three";

export function createMaterials() {
  const metalTexture = createMetalTexture();
  const bumpTexture = createBumpTexture();
  const solarTexture = createSolarPanelTexture();
  const windowTexture = createWindowTexture();

  const metalMaterial = new THREE.MeshStandardMaterial({
    map: metalTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.06,
    metalness: 0.7,
    roughness: 0.5,
  });

  const solarPanelMaterial = new THREE.MeshStandardMaterial({
    map: solarTexture,
    metalness: 0.2,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });

  const windowMaterial = new THREE.MeshStandardMaterial({
    map: windowTexture,
    emissive: 0xffcc66,
    emissiveIntensity: 2.5
  });

  const shipWindowMaterial = new THREE.MeshStandardMaterial({
    map: metalTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.06,
    metalness: 0.7,
    roughness: 0.5,
  });

  return { metalMaterial, solarPanelMaterial, windowMaterial, shipWindowMaterial };
}

function createMetalTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#8c8f94";
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "#5c5f63";
  ctx.lineWidth = 2;
  for (let y = 0; y < size; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

function createBumpTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(size, size);

  for (let i = 0; i < imageData.data.length; i += 4) {
    const value = Math.floor(Math.random() * 60) + 90;
    imageData.data[i] = value;
    imageData.data[i + 1] = value;
    imageData.data[i + 2] = value;
    imageData.data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

function createSolarPanelTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0b1a3a";
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "#2f5ea8";
  ctx.lineWidth = 2;
  const cell = 32;
  for (let x = 0; x <= size; x += cell) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += cell) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createWindowTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#ffe9a8";
  ctx.fillRect(6, 6, size - 12, size - 12);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
