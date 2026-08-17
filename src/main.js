import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

let scene, renderer, camera, metalMaterial, solarPanelMaterial, windowMaterial;
let stationGroup, stationCore;
let antennaPivot, robotArmShoulder, robotArmElbow;

//za rotiranje
const STATION_SELF_ROTATION_SPEED = 0.0015;
const STATION_ORBIT_SPEED = 0.0006;
const STATION_ORBIT_RADIUS = 6;
const ANTENNA_ROTATION_SPEED = 0.01;
const ROBOT_ARM_SPEED = 0.8;

let orbitAngle = 0;

let clock;

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
  );

  camera.position.set(0, 15, 45);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", onWindowResize);

  clock = new THREE.Clock();
}

function createLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 3);
  sunLight.position.set(80, 40, 60);
  scene.add(sunLight);
}

function createMaterials() {
  const metalTexture = createMetalTexture();
  const bumpTexture = createBumpTexture();
  const solarTexture = createSolarPanelTexture();
  const windowTexture = createWindowTexture();

  metalMaterial = new THREE.MeshStandardMaterial({
    map: metalTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.06,
    metalness: 0.7,
    roughness: 0.5,
  });

  solarPanelMaterial = new THREE.MeshStandardMaterial({
    map: solarTexture,
    metalness: 0.2,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });

  windowMaterial = new THREE.MeshStandardMaterial({
    map: windowTexture,
    emissive: 0xffcc66,
    emissiveIntensity: 0.6,
  });


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
}

function createTruss(from, to) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = direction.length();

  const trussGeometry = new THREE.CylinderGeometry(0.3, 0.3, length, 8);
  const truss = new THREE.Mesh(trussGeometry, metalMaterial);

  truss.position.copy(from).add(direction.multiplyScalar(0.5));
  truss.rotation.z = Math.PI / 2;
  return truss;
}

function buildStation() {
  stationGroup = new THREE.Group();
  scene.add(stationGroup);

  stationCore = new THREE.Group();
  stationGroup.add(stationCore);

  const hubGeometry = new THREE.CylinderGeometry(3, 3, 8, 24);
  const hub = new THREE.Mesh(hubGeometry, metalMaterial);
  hub.rotation.z = Math.PI / 2;
  stationCore.add(hub);

  const labGeometry = new THREE.CylinderGeometry(2, 2, 6, 20);
  const labModule = new THREE.Mesh(labGeometry, metalMaterial);
  labModule.rotation.z = Math.PI / 2;
  labModule.position.set(10, 0, 0);
  stationCore.add(labModule);

  const habGeometry = new THREE.CylinderGeometry(2, 2, 6, 20);
  const habModule = new THREE.Mesh(habGeometry, metalMaterial);
  habModule.rotation.z = Math.PI / 2;
  habModule.position.set(-10, 0, 0);
  stationCore.add(habModule);

  const panelGeometry = new THREE.BoxGeometry(10, 0.1, 5);

  const panelRight = new THREE.Mesh(panelGeometry, solarPanelMaterial);
  panelRight.position.set(17, 0, 0);
  stationCore.add(panelRight);

  const panelLeft = new THREE.Mesh(panelGeometry, solarPanelMaterial);
  panelLeft.position.set(-17, 0, 0);
  stationCore.add(panelLeft);

  stationCore.add(createTruss(new THREE.Vector3(3, 0, 0), new THREE.Vector3(8, 0, 0)));
  stationCore.add(createTruss(new THREE.Vector3(-3, 0, 0), new THREE.Vector3(-8, 0, 0)));

  const windowGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.05);
  for (let i = -1; i <= 1; i++) {
    const win = new THREE.Mesh(windowGeometry, windowMaterial);
    win.position.set(10 + i * 1.5, 2, 0);
    stationCore.add(win);
  }

  antennaPivot = createAntenna();
  antennaPivot.position.set(10, 3.2, 0); // na vrhu lab modula (radius 2 + malo)
  stationCore.add(antennaPivot);

  const armData = createRobotArm();
  armData.base.position.set(-10, 3, 0);
  stationCore.add(armData.base);
  robotArmShoulder = armData.shoulder;
  robotArmElbow = armData.elbow;
}
function createRobotArm() {
  const base = new THREE.Group();       // pričvršćen na modul, ne pomera se

  const shoulder = new THREE.Group();   // zglob "ramena" - ovde se ruka lomi/okreće
  base.add(shoulder);

  const upperArmGeometry = new THREE.BoxGeometry(1.6, 0.25, 0.25);
  const upperArm = new THREE.Mesh(upperArmGeometry, metalMaterial);
  upperArm.position.x = 0.8; // segment se pruža OD zgloba, zato pomeramo pola dužine
  shoulder.add(upperArm);

  const elbow = new THREE.Group();      // zglob "lakta" - na KRAJU gornjeg segmenta
  elbow.position.set(1.6, 0, 0);
  shoulder.add(elbow);

  const forearmGeometry = new THREE.BoxGeometry(1.4, 0.2, 0.2);
  const forearm = new THREE.Mesh(forearmGeometry, metalMaterial);
  forearm.position.x = 0.7;
  elbow.add(forearm);

  return { base, shoulder, elbow };
}
function createAntenna() {
  const pivot = new THREE.Group(); // dete stationCore, roditelj štapa i tanjira

  const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
  const pole = new THREE.Mesh(poleGeometry, metalMaterial);
  pole.position.y = 0.75; // baza štapa na y=0 (na pivotu), vrh na y=1.5
  pivot.add(pole);

  const dishGeometry = new THREE.ConeGeometry(0.5, 0.4, 16);
  const dish = new THREE.Mesh(dishGeometry, metalMaterial);
  dish.position.y = 1.6;
  dish.rotation.x = Math.PI; // konus okrenut "otvorom" nagore
  pivot.add(dish);

  return pivot;
}

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();
  updateStationAnimation(elapsedTime);

  renderer.render(scene, camera);

  function updateStationAnimation(elapsedTime) {
    // rotacija cele stanice oko sopstvene ose (zahtev 4/6)
    stationCore.rotation.y += STATION_SELF_ROTATION_SPEED;

    // orbita stanice oko nevidljive centralne tačke (0,0,0) (zahtev 4/6)
    orbitAngle += STATION_ORBIT_SPEED;
    stationGroup.position.x = Math.cos(orbitAngle) * STATION_ORBIT_RADIUS;
    stationGroup.position.z = Math.sin(orbitAngle) * STATION_ORBIT_RADIUS;

    // antena - sopstvena rotacija (zahtev 5/6)
    antennaPivot.rotation.y += ANTENNA_ROTATION_SPEED;

    // robotska ruka - njihanje ramena i lakta (zahtev 5/6)
    robotArmShoulder.rotation.z = Math.sin(elapsedTime * ROBOT_ARM_SPEED) * 0.3;
    robotArmElbow.rotation.z = Math.sin(elapsedTime * ROBOT_ARM_SPEED * 1.5) * 0.5;
  }
}
init();
createLights();
createMaterials();
buildStation();
animate();