import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

export function initScene() {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
  );

  camera.position.set(0, 5, 45);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  const clock = new THREE.Clock();

  //orbit controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 5;
  controls.maxDistance = 300;

  const composer = new EffectComposer(renderer);

  // prvi pass - obican render scene, kao osnova
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // drugi pass - pronalazi svetle delove i dodaje im sjaj
  const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.2,   // strength - koliko jako sjaji
      0.4,   // radius - koliko se sjaj širi oko izvora
      0.3    // threshold - koliko svetao pixel mora biti da bi sijao (0-1)
  );
  composer.addPass(bloomPass);

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", onWindowResize);

  return { scene, camera, renderer, controls, composer, bloomPass, clock };
}
