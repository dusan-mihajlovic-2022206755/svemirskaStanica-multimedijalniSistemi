import * as THREE from "three";

/* ==========================================================
   KORAK 1: Inicijalizacija scene i kamere (zahtev 1)
   ========================================================== */

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
// kamera dovoljno udaljena da obuhvati celu stanicu i okruzenje
camera.position.set(0, 15, 45);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// automatsko podesavanje proporcija scene u odnosu na velicinu prozora
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onWindowResize);

/* privremena kocka - samo da proverimo da scena radi,
   uklonicemo je kada pocnemo da gradimo stanicu */
const testCube = new THREE.Mesh(
  new THREE.BoxGeometry(3, 3, 3),
  new THREE.MeshNormalMaterial()
);
scene.add(testCube);

function animate() {
  requestAnimationFrame(animate);
  testCube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();
