import * as THREE from "three";

export function createSkybox(scene) {
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
        side: THREE.BackSide,
    });
    const skydome = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skydome);

    const earthCanvas = document.createElement("canvas");
    earthCanvas.width = 512;
    earthCanvas.height = 256;
    const earthCtx = earthCanvas.getContext("2d");

    earthCtx.fillStyle = "#1c4f8c";
    earthCtx.fillRect(0, 0, 512, 256);
    earthCtx.fillStyle = "#2f8f4e";

    const earthTexture = new THREE.CanvasTexture(earthCanvas);
    earthTexture.colorSpace = THREE.SRGBColorSpace;

    const earthGeometry = new THREE.SphereGeometry(30, 32, 32);
    const earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(120, -60, -250);
    scene.add(earth);
}
