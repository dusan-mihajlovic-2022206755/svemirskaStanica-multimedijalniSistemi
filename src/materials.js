import * as THREE from "three";

export function createMaterials() {
    const textureLoader = new THREE.TextureLoader();

    const metalTexture = textureLoader.load("textures/shiphull.jpg");
    const metalNormalMap = textureLoader.load("textures/metalNormalMap.jpg")
    metalTexture.colorSpace = THREE.SRGBColorSpace;
    const bumpTexture =textureLoader.load("textures/bump.jpg");
    bumpTexture.colorSpace = THREE.SRGBColorSpace;
    const solarTexture = textureLoader.load("textures/Solar.jpg");
    solarTexture.colorSpace = THREE.SRGBColorSpace;
    const windowTexture = textureLoader.load("frost.jpeg");
    windowTexture.colorSpace = THREE.SRGBColorSpace;

    const metalMaterial = new THREE.MeshStandardMaterial({
        map: metalTexture,
        normalMap: metalNormalMap,
        bumpScale: 0.06,
        metalness: 0.7,
        roughness: 0.5,
    });

    const solarPanelMaterial = new THREE.MeshStandardMaterial({
        map: solarTexture,
        metalness: 0.2,
        roughness: 0.4,
        side: THREE.DoubleSide,
    });

    const windowMaterial = new THREE.MeshStandardMaterial({
        map: windowTexture,
        emissive: 0xffcc66,
        emissiveIntensity: 1.5
    });

    const shipWindowMaterial = new THREE.MeshStandardMaterial({
        map: metalTexture,
        bumpMap: bumpTexture,
        bumpScale: 0.06,
        metalness: 0.7,
        roughness: 0.5,
    });

    return { metalMaterial, solarPanelMaterial, windowMaterial, shipWindowMaterial };
}

