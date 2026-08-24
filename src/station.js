import * as THREE from "three";

const STATION_SELF_ROTATION_SPEED = 0.0015;
const STATION_ORBIT_SPEED = 0.0006;
const STATION_ORBIT_RADIUS = 6;
const ANTENNA_ROTATION_SPEED = 0.01;
const ROBOT_ARM_SPEED = 0.8;
const LAB_SPIN_SPEED = 0.008;

let orbitAngle = 0;

export function buildStation(scene, materials) {
    const { metalMaterial, solarPanelMaterial, windowMaterial } = materials;

    const stationGroup = new THREE.Group();
    scene.add(stationGroup);

    const stationCore = new THREE.Group();
    stationGroup.add(stationCore);

    //centralni modul
    const hubGeometry = new THREE.CylinderGeometry(3, 3, 8, 24);
    const hub = new THREE.Mesh(hubGeometry, metalMaterial);
    hub.rotation.z = Math.PI / 2;
    hub.userData.info = "Centralni modul";
    stationCore.add(hub);

    //laboratorijski modul
    const labAssembly = new THREE.Group();
    labAssembly.position.set(10, 0, 0);
    stationCore.add(labAssembly);

    const labGeometry = new THREE.CylinderGeometry(2, 2, 6, 20);
    const labModule = new THREE.Mesh(labGeometry, metalMaterial);
    labModule.rotation.z = Math.PI / 2;
    labModule.userData.info = "Laboratorijski modul";
    labAssembly.add(labModule);

    //stambeni modul
    const habGeometry = new THREE.CylinderGeometry(2, 2, 6, 20);
    const habModule = new THREE.Mesh(habGeometry, metalMaterial);
    habModule.rotation.z = Math.PI / 2;
    habModule.rotation.y = Math.PI / 2;
    habModule.position.set(-10, 0, 0);
    habModule.userData.info = "Stambeni modul";
    stationCore.add(habModule);

    const panelGeometry = new THREE.BoxGeometry(10, 0.1, 5);

    const panelRight = new THREE.Mesh(panelGeometry, solarPanelMaterial);
    panelRight.position.set(7, 0, 0);
    panelRight.userData.info = "Desni solarni panel";
    labAssembly.add(panelRight);

    const panelLeft = new THREE.Mesh(panelGeometry, solarPanelMaterial);
    panelLeft.position.set(-17, 0, 0);
    panelLeft.userData.info = "Levi solarni panel";
    stationCore.add(panelLeft);

    stationCore.add(createTruss(new THREE.Vector3(3, 0, 0), new THREE.Vector3(8, 0, 0), metalMaterial));
    stationCore.add(createTruss(new THREE.Vector3(-3, 0, 0), new THREE.Vector3(-8, 0, 0), metalMaterial));

    const windowGeometry = new THREE.BoxGeometry(1, 1, 0.05);
    for (let i = -1; i <= 1; i++) {
        const winFront = new THREE.Mesh(windowGeometry, windowMaterial);
        winFront.position.set(i * 2.5, 0, 3);
        const winBack = new THREE.Mesh(windowGeometry, windowMaterial);
        winBack.position.set(i * 2.5, 0, -3);
        stationCore.add(winFront);
        stationCore.add(winBack);
    }


    const labWinFront = new THREE.Mesh(windowGeometry, windowMaterial);
    labWinFront.position.set(0, 0, 2);
    labAssembly.add(labWinFront);

    const labWinBack = new THREE.Mesh(windowGeometry, windowMaterial);
    labWinBack.position.set(0, 0, -2);
    labAssembly.add(labWinBack);

    const antennaPivot = createAntenna(metalMaterial);
    antennaPivot.position.set(0, 2, 0);
    labAssembly.add(antennaPivot);

    const armData = createRobotArm(metalMaterial);
    armData.base.position.set(-10, 0, 2);
    armData.base.rotation.y = Math.PI / 2;
    stationCore.add(armData.base);
    const robotArmShoulder = armData.shoulder;
    const robotArmElbow = armData.elbow;

    return { stationGroup, stationCore, antennaPivot, robotArmShoulder, robotArmElbow, labAssembly };
}

function createTruss(from, to, metalMaterial) {
    const direction = new THREE.Vector3().subVectors(to, from);
    const length = direction.length();

    const trussGeometry = new THREE.CylinderGeometry(0.3, 0.3, length, 8);
    const truss = new THREE.Mesh(trussGeometry, metalMaterial);

    truss.position.copy(from).add(direction.multiplyScalar(0.5));
    truss.rotation.z = Math.PI / 2;
    return truss;
}

function createRobotArm(metalMaterial) {
    const base = new THREE.Group();

    const shoulder = new THREE.Group();
    base.add(shoulder);

    const upperArmGeometry = new THREE.BoxGeometry(3, 1, 1);
    const upperArm = new THREE.Mesh(upperArmGeometry, metalMaterial);
    upperArm.position.x = -1.5;
    upperArm.userData.info = "Robotska ruka";
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.set(-3, 0, 0);
    shoulder.add(elbow);

    const forearmGeometry = new THREE.BoxGeometry(3, 1, 1);
    const forearm = new THREE.Mesh(forearmGeometry, metalMaterial);
    forearm.position.x = -1.5;
    forearm.userData.info = "Robotska ruka";
    elbow.add(forearm);

    return { base, shoulder, elbow };
}

function createAntenna(metalMaterial) {
    const pivot = new THREE.Group();

    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 12);
    const pole = new THREE.Mesh(poleGeometry, metalMaterial);
    pole.position.y = 0.75;
    pole.userData.info = "Antena";
    pivot.add(pole);

    const dishGeometry = new THREE.ConeGeometry(1, 0.5, 20);
    const dish = new THREE.Mesh(dishGeometry, metalMaterial);
    dish.position.y = 1.6;
    dish.rotation.x = Math.PI;
    dish.userData.info = "Antena";
    pivot.add(dish);

    return pivot;
}

export function updateStationAnimation(station, elapsedTime) {
    const { stationGroup, stationCore, antennaPivot, robotArmShoulder, robotArmElbow, labAssembly } = station;

    stationCore.rotation.y += STATION_SELF_ROTATION_SPEED;

    orbitAngle += STATION_ORBIT_SPEED;
    stationGroup.position.x = Math.cos(orbitAngle) * STATION_ORBIT_RADIUS;
    stationGroup.position.z = Math.sin(orbitAngle) * STATION_ORBIT_RADIUS;

    labAssembly.rotation.x += LAB_SPIN_SPEED;

    antennaPivot.rotation.y += ANTENNA_ROTATION_SPEED;

    robotArmShoulder.rotation.z = Math.sin(elapsedTime * ROBOT_ARM_SPEED) * 0.3;
    robotArmElbow.rotation.z = Math.sin(elapsedTime * ROBOT_ARM_SPEED * 1.5) * 0.5;
}
