import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';


let scene, renderer, camera, metalMaterial, solarPanelMaterial, windowMaterial;
let stationGroup, stationCore;
let antennaPivot, robotArmShoulder, robotArmElbow;
let controls;

let raycaster, mouse;

let composer, bloomPass;

//za rotiranje
const STATION_SELF_ROTATION_SPEED = 0.0015;
const STATION_ORBIT_SPEED = 0.0006;
const STATION_ORBIT_RADIUS = 6;
const ANTENNA_ROTATION_SPEED = 0.01;
const ROBOT_ARM_SPEED = 0.8;

const tourPoints = [
  { name: "Spoljni pregled",          pos: new THREE.Vector3(0, 15, 45), look: new THREE.Vector3(0, 0, 0) },
  { name: "Solarni paneli",           pos: new THREE.Vector3(25, 5, 10), look: new THREE.Vector3(17, 0, 0) },
  { name: "Laboratorijski modul",     pos: new THREE.Vector3(15, 3, 15), look: new THREE.Vector3(10, 0, 0) },
  { name: "Stambeni modul i ruka",    pos: new THREE.Vector3(-15, 3, 15), look: new THREE.Vector3(-10, 0, 0) },
  { name: "Pogled odozgo",            pos: new THREE.Vector3(0, 40, 0.1), look: new THREE.Vector3(0, 0, 0) },
];
let currentTourIndex = 0;
let cameraAnimating = false;
let animStartPos, animEndPos, animStartLook, animEndLook, animStartTime;
const ANIM_DURATION = 1500; // ms, koliko traje prelaz između tačaka


let orbitAngle = 0;

let clock;

let spaceship;
let shipAngle = 0;
let shipWindowMaterial;
const SHIP_ORBIT_RADIUS = 35;      // veci od raspona stanice (paneli ~22) da ne prolazi kroz nju
const SHIP_ORBIT_SPEED = 0.004;
const SHIP_BOB_AMPLITUDE = 8;      // koliko visoko/nisko ide sinusoida
const SHIP_BOB_FREQUENCY = 2;


function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
  );

  camera.position.set(0, 5, 45);
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
    composer.setSize(window.innerWidth, window.innerHeight); // <-- novo
  }
  window.addEventListener("resize", onWindowResize);

  clock = new THREE.Clock();

  //orbit controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 5;
  controls.maxDistance = 300;

  document.getElementById("prevBtn").addEventListener("click", () => changeTourPoint(-1));
  document.getElementById("nextBtn").addEventListener("click", () => changeTourPoint(1));

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  renderer.domElement.addEventListener("click", onCanvasClick);

  composer = new EffectComposer(renderer);

// prvi pass - obican render scene, kao osnova
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

// drugi pass - pronalazi svetle delove i dodaje im sjaj
  bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.2,   // strength - koliko jako sjaji
      0.4,   // radius - koliko se sjaj širi oko izvora
      0.3    // threshold - koliko svetao pixel mora biti da bi sijao (0-1)
  );
  composer.addPass(bloomPass);

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
    emissiveIntensity: 2.5
  });
  shipWindowMaterial = new THREE.MeshStandardMaterial({
    map: metalTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.06,
    metalness: 0.7,
    roughness: 0.5,
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
  hub.userData.info = "Centralni modul";
  stationCore.add(hub);

  const labGeometry = new THREE.CylinderGeometry(2, 2, 6, 20);
  const labModule = new THREE.Mesh(labGeometry, metalMaterial);
  labModule.rotation.z = Math.PI / 2;
  labModule.position.set(10, 0, 0);
  labModule.userData.info = "Laboratorijski modul";
  stationCore.add(labModule);

  const habGeometry = new THREE.CylinderGeometry(2, 2, 6, 20);
  const habModule = new THREE.Mesh(habGeometry, metalMaterial);
  habModule.rotation.z = Math.PI / 2;
  habModule.position.set(-10, 0, 0);
  habModule.userData.info = "Stambeni modul";
  stationCore.add(habModule);

  const panelGeometry = new THREE.BoxGeometry(10, 0.1, 5);

  const panelRight = new THREE.Mesh(panelGeometry, solarPanelMaterial);
  panelRight.position.set(17, 0, 0);
  panelRight.userData.info = "Desni solarni panel";
  stationCore.add(panelRight);

  const panelLeft = new THREE.Mesh(panelGeometry, solarPanelMaterial);
  panelLeft.position.set(-17, 0, 0);
  panelLeft.userData.info = "Levi solarni panel";
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

  const upperArmGeometry = new THREE.BoxGeometry(3, 1, 1);
  const upperArm = new THREE.Mesh(upperArmGeometry, metalMaterial);
  upperArm.position.x = -1.5;
  upperArm.userData.info = "Robotska ruka";
  shoulder.add(upperArm);

  const elbow = new THREE.Group();
  elbow.position.set(-3, 0, 0);
  shoulder.add(elbow);

  const forearmGeometry = new THREE.BoxGeometry(3, 1, 1);
  const forearm = new THREE.Mesh(forearmGeometry, metalMaterial);
  forearm.position.x = -1.5;
  forearm.userData.info = "Robotska ruka";
  elbow.add(forearm);

  return { base, shoulder, elbow };
}
function createAntenna() {
  const pivot = new THREE.Group(); // dete stationCore, roditelj štapa i tanjira

  const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
  const pole = new THREE.Mesh(poleGeometry, metalMaterial);
  pole.position.y = 0.75; // baza štapa na y=0 (na pivotu), vrh na y=1.5
  pole.userData.info = "Antena";
  pivot.add(pole);

  const dishGeometry = new THREE.ConeGeometry(0.5, 0.4, 16);
  const dish = new THREE.Mesh(dishGeometry, metalMaterial);
  dish.position.y = 1.6;
  dish.rotation.x = Math.PI; // konus okrenut "otvorom" nagore
  dish.userData.info = "Antena";
  pivot.add(dish);

  return pivot;
}

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();
  updateStationAnimation(elapsedTime);
  updateCameraAnimation();
  updateSpaceshipAnimation();

  controls.update();
  composer.render();

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

function changeTourPoint(direction) {
  currentTourIndex = (currentTourIndex + direction + tourPoints.length) % tourPoints.length;
  const target = tourPoints[currentTourIndex];

  animStartPos = camera.position.clone();
  animEndPos = target.pos.clone();
  animStartLook = controls.target.clone();
  animEndLook = target.look.clone();
  animStartTime = performance.now();
  cameraAnimating = true;
}

function updateCameraAnimation() {
  if (!cameraAnimating) return;

  const t = Math.min((performance.now() - animStartTime) / ANIM_DURATION, 1);
  const eased = t * t * (3 - 2 * t); // "smoothstep" - usporava na početku i kraju

  camera.position.lerpVectors(animStartPos, animEndPos, eased);
  controls.target.lerpVectors(animStartLook, animEndLook, eased);

  if (t >= 1) cameraAnimating = false;
}
function createSkybox() {
  // ---- zvezdano nebo ----
  const starCanvas = document.createElement("canvas");
  starCanvas.width = starCanvas.height = 1024;
  const starCtx = starCanvas.getContext("2d");

  starCtx.fillStyle = "#000005";
  starCtx.fillRect(0, 0, 1024, 1024);

  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const radius = Math.random() * 1.4;
    const brightness = Math.random() * 0.5 + 0.5;
    starCtx.fillStyle = `rgba(255,255,255,${brightness})`;
    starCtx.beginPath();
    starCtx.arc(x, y, radius, 0, Math.PI * 2);
    starCtx.fill();
  }

  const starTexture = new THREE.CanvasTexture(starCanvas);
  starTexture.colorSpace = THREE.SRGBColorSpace;

  const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
  const skyMaterial = new THREE.MeshBasicMaterial({
    map: starTexture,
    side: THREE.BackSide, // bitno - objašnjenje ispod
  });
  const skydome = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(skydome);

  // ---- Zemlja u daljini ----
  const earthCanvas = document.createElement("canvas");
  earthCanvas.width = 512;
  earthCanvas.height = 256;
  const earthCtx = earthCanvas.getContext("2d");

  earthCtx.fillStyle = "#1c4f8c";
  earthCtx.fillRect(0, 0, 512, 256);
  earthCtx.fillStyle = "#2f8f4e";
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    const w = Math.random() * 70;
    const h = Math.random() * 40;
    earthCtx.beginPath();
    earthCtx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    earthCtx.fill();
  }

  const earthTexture = new THREE.CanvasTexture(earthCanvas);
  earthTexture.colorSpace = THREE.SRGBColorSpace;

  const earthGeometry = new THREE.SphereGeometry(30, 32, 32);
  const earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture });
  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  earth.position.set(120, -60, -250);
  scene.add(earth);
}
function onCanvasClick(event) {
  // pretvaramo koordinate klika (u pikselima) u "normalized device coordinates":
  // opseg od -1 do 1, gde je (0,0) centar ekrana. Three.js radi samo sa ovim opsegom.
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1; // y je obrnut (ekran ide odozgo, 3D svet odozdo)

  raycaster.setFromCamera(mouse, camera);

  // true = proveri i "unuke" (decu unutar grupa), ne samo direktnu decu scene
  const intersects = raycaster.intersectObjects(scene.children, true);

  const infoPanel = document.getElementById("infoPanel");

  if (intersects.length > 0) {
    const hit = intersects[0].object; // najbliži pogođeni objekat kameri
    if (hit.userData.info) {
      infoPanel.textContent = hit.userData.info;
      return;
    }
  }

  infoPanel.textContent = ""; // klik u prazno - očisti panel
}

function createSpaceship() {
  // sve delove gradimo prvo duz PRIRODNE ose geometrije (cilindar/konus idu duz Y),
  // pa na kraju rotiramo CEO hullGroup jednom - lakse za snalazenje nego
  // da rucno rotiramo svaki komad pojedinacno
  const hullGroup = new THREE.Group();

  // telo broda
  const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.6, 3, 12);
  const body = new THREE.Mesh(bodyGeometry, metalMaterial);
  hullGroup.add(body);

  // nos (konus na vrhu tela)
  const noseGeometry = new THREE.ConeGeometry(0.5, 1.2, 12);
  const nose = new THREE.Mesh(noseGeometry, metalMaterial);
  nose.position.y = 2.1; // 1.5 (pola duzine tela) + 0.6 (pola visine konusa)
  hullGroup.add(nose);

  // krila
  const wingGeometry = new THREE.BoxGeometry(3, 0.1, 1);
  const wingLeft = new THREE.Mesh(wingGeometry, metalMaterial);
  wingLeft.position.set(-1.3, -0.5, 0);
  wingLeft.rotation.z = 0.15;
  hullGroup.add(wingLeft);

  const wingRight = new THREE.Mesh(wingGeometry, metalMaterial);
  wingRight.position.set(1.3, -0.5, 0);
  wingRight.rotation.z = -0.15;
  hullGroup.add(wingRight);

  // kokpit - koristi windowMaterial (svetli, uklapa se sa bloom efektom iz prethodnog koraka)
  const cockpitGeometry = new THREE.SphereGeometry(0.3, 12, 12);
  const cockpit = new THREE.Mesh(cockpitGeometry, shipWindowMaterial);
  cockpit.position.set(0, 0.8, 0.4);
  hullGroup.add(cockpit);

  // rotiramo ceo hullGroup tako da "nos" (trenutno na +Y) sada gleda u -Z pravac.
  // ovo je bitno zbog konvencije: three.js-ov lookAt() uvek okrece objekat
  // tako da njegova LOKALNA -Z osa gleda ka meti - zato nos MORA biti na -Z, ne bilo gde drugde
  hullGroup.rotation.x = -Math.PI / 2;

  // spoljna grupa - NJU animiramo (position + lookAt) u animate() petlji.
  // hullGroup ostaje unutra kao "fiksna korekcija orijentacije" -
  // da smo rotaciju stavili direktno na spoljnu grupu, lookAt bi je svaki frejm pregazio
  const shipGroup = new THREE.Group();
  shipGroup.add(hullGroup);

  shipGroup.userData.info = "Svemirski brod - kruzi oko stanice po sinusoidnoj putanji.";

  return shipGroup;
}
function updateSpaceshipAnimation() {
  shipAngle += SHIP_ORBIT_SPEED;

  const x = Math.cos(shipAngle) * SHIP_ORBIT_RADIUS;
  const z = Math.sin(shipAngle) * SHIP_ORBIT_RADIUS;

  spaceship.position.set(x, 0, z);
  spaceship.lookAt(0, 0, 0);
}
init();
createLights();
createMaterials();
createSkybox();
buildStation();

spaceship = createSpaceship();
scene.add(spaceship);

animate();