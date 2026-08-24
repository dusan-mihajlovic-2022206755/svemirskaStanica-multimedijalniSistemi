import * as THREE from "three";
import { OrbitControls, EffectComposer, RenderPass, UnrealBloomPass } from "three/examples/jsm/Addons.js";

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

    const canvas = document.querySelector("canvas.threejs");
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const clock = new THREE.Clock();

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 300;

    const composer = new EffectComposer(renderer);

    // prvi pass - obican render
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    //drugi pass - bloom
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.2,
        0.4,
        0.3
    );
    composer.addPass(bloomPass);

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });

    return { scene, camera, renderer, controls, composer, bloomPass, clock };
}
