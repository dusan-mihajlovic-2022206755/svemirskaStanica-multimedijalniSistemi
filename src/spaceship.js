import * as THREE from "three";

const SHIP_ORBIT_RADIUS = 28;
const SHIP_ORBIT_SPEED = 0.006;

let shipAngle = 0;

export function createSpaceship(materials) {
    const { metalMaterial, shipWindowMaterial } = materials;

    const hullGroup = new THREE.Group();

    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.6, 3, 12);
    const body = new THREE.Mesh(bodyGeometry, metalMaterial);
    hullGroup.add(body);

    const noseGeometry = new THREE.ConeGeometry(0.5, 1.2, 12);
    const nose = new THREE.Mesh(noseGeometry, metalMaterial);
    nose.position.y = 2.1;
    hullGroup.add(nose);

    const wingGeometry = new THREE.BoxGeometry(3, 0.1, 1);
    const wingLeft = new THREE.Mesh(wingGeometry, metalMaterial);
    wingLeft.position.set(-1.3, -0.5, 0);
    wingLeft.rotation.z = 0.15;
    hullGroup.add(wingLeft);

    const wingRight = new THREE.Mesh(wingGeometry, metalMaterial);
    wingRight.position.set(1.3, -0.5, 0);
    wingRight.rotation.z = -0.15;
    hullGroup.add(wingRight);

    const cockpitGeometry = new THREE.SphereGeometry(0.3, 12, 12);
    const cockpit = new THREE.Mesh(cockpitGeometry, shipWindowMaterial);
    cockpit.position.set(0, 0.8, 0.4);
    hullGroup.add(cockpit);

    hullGroup.rotation.x = -Math.PI / 2;

    const shipGroup = new THREE.Group();
    shipGroup.add(hullGroup);

    shipGroup.userData.info = "Svemirski brod";

    return shipGroup;
}

export function updateSpaceshipAnimation(spaceship) {
    shipAngle += SHIP_ORBIT_SPEED;

    const x = Math.cos(shipAngle) * SHIP_ORBIT_RADIUS;
    const z = Math.sin(shipAngle) * SHIP_ORBIT_RADIUS;

    spaceship.position.set(x, 0, z);
    spaceship.lookAt(0, 0, 0);
}
