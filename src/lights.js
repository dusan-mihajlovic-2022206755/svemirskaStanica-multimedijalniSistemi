import * as THREE from "three";

export function createLights(scene) {
    // ambijentalno svetlo
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    // direkciono svetlo
    const sunLight = new THREE.DirectionalLight(0xffffff, 3);
    sunLight.position.set(80, 40, 60);
    scene.add(sunLight);
}
