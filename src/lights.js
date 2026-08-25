import * as THREE from "three";

export function createLights(scene) {
    // ambijentalno svetlo
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    // direkciono svetlo
    const sunLight = new THREE.DirectionalLight(0xffffff, 4);
    sunLight.position.set(40, 20, 30);
    sunLight.target.position.set(0, 0, 0);
    scene.add(sunLight);

    // const sunHelper = new THREE.DirectionalLightHelper(sunLight, 5);
    // scene.add(sunHelper);
}
