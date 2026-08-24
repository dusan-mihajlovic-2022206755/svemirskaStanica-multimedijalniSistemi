import * as THREE from "three";

export function setupClickHandler(renderer, camera, scene) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

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

  renderer.domElement.addEventListener("click", onCanvasClick);
}
