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

