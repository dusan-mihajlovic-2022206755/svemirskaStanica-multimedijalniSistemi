import * as THREE from "three";

export function setupClickHandler(renderer, camera, scene) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onCanvasClick(event) {

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1; // y obrnut!!

        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children, true);

        const infoPanel = document.getElementById("infoPanel");

        if (intersects.length > 0) {
            const hit = intersects[0].object; // najbliži kameri
            if (hit.userData.info) {
                infoPanel.textContent = hit.userData.info;
                return;
            }
        }

        infoPanel.textContent = "";
    }

    renderer.domElement.addEventListener("click", onCanvasClick);
}
