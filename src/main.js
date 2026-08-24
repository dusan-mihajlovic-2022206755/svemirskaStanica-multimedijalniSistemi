import { initScene } from "./scene.js";
import { createLights } from "./lights.js";
import { createMaterials } from "./materials.js";
import { createSkybox } from "./skybox.js";
import { buildStation, updateStationAnimation } from "./station.js";
import { createSpaceship, updateSpaceshipAnimation } from "./spaceship.js";
import { createTourController } from "./tour.js";
import { setupClickHandler } from "./interaction.js";

const { scene, camera, renderer, controls, composer, clock } = initScene();

createLights(scene);
const materials = createMaterials();
createSkybox(scene);

const station = buildStation(scene, materials);

const spaceship = createSpaceship(materials);
scene.add(spaceship);

const tour = createTourController(camera, controls);
document.getElementById("prevBtn").addEventListener("click", () => tour.changeTourPoint(-1));
document.getElementById("nextBtn").addEventListener("click", () => tour.changeTourPoint(1));

setupClickHandler(renderer, camera, scene);

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();
  updateStationAnimation(station, elapsedTime);
  tour.updateCameraAnimation();
  updateSpaceshipAnimation(spaceship);

  controls.update();
  composer.render();
}

animate();
