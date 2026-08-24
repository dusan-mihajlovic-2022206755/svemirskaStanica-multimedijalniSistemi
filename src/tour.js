import * as THREE from "three";

const ANIM_DURATION = 1500; // ms, koliko traje prelaz između tačaka

export const tourPoints = [
    { name: "Spoljni pregled",          pos: new THREE.Vector3(0, 15, 45), look: new THREE.Vector3(0, 0, 0) },
    { name: "Solarni paneli",           pos: new THREE.Vector3(25, 5, 10), look: new THREE.Vector3(17, 0, 0) },
    { name: "Laboratorijski modul",     pos: new THREE.Vector3(15, 3, 15), look: new THREE.Vector3(10, 0, 0) },
    { name: "Stambeni modul i ruka",    pos: new THREE.Vector3(-15, 3, 15), look: new THREE.Vector3(-10, 0, 0) },
    { name: "Pogled odozgo",            pos: new THREE.Vector3(0, 40, 0.1), look: new THREE.Vector3(0, 0, 0) },
];

export function createTourController(camera, controls) {
    let currentTourIndex = 0;
    let cameraAnimating = false;
    let animStartPos, animEndPos, animStartLook, animEndLook, animStartTime;

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

    return { changeTourPoint, updateCameraAnimation };
}
