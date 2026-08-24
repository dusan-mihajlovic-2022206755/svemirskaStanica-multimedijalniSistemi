import * as THREE from "three";

const SHIP_ORBIT_RADIUS = 35;      // veci od raspona stanice (paneli ~22) da ne prolazi kroz nju
const SHIP_ORBIT_SPEED = 0.004;

let shipAngle = 0;

export function createSpaceship(materials) {
  const { metalMaterial, shipWindowMaterial } = materials;

  // sve delove gradimo prvo duz PRIRODNE ose geometrije (cilindar/konus idu duz Y),
  // pa na kraju rotiramo CEO hullGroup jednom - lakse za snalazenje nego
  // da rucno rotiramo svaki komad pojedinacno
  const hullGroup = new THREE.Group();

  // telo broda
  const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.6, 3, 12);
  const body = new THREE.Mesh(bodyGeometry, metalMaterial);
  hullGroup.add(body);

  // nos (konus na vrhu tela)
  const noseGeometry = new THREE.ConeGeometry(0.5, 1.2, 12);
  const nose = new THREE.Mesh(noseGeometry, metalMaterial);
  nose.position.y = 2.1; // 1.5 (pola duzine tela) + 0.6 (pola visine konusa)
  hullGroup.add(nose);

  // krila
  const wingGeometry = new THREE.BoxGeometry(3, 0.1, 1);
  const wingLeft = new THREE.Mesh(wingGeometry, metalMaterial);
  wingLeft.position.set(-1.3, -0.5, 0);
  wingLeft.rotation.z = 0.15;
  hullGroup.add(wingLeft);

  const wingRight = new THREE.Mesh(wingGeometry, metalMaterial);
  wingRight.position.set(1.3, -0.5, 0);
  wingRight.rotation.z = -0.15;
  hullGroup.add(wingRight);

  // kokpit - koristi windowMaterial (svetli, uklapa se sa bloom efektom iz prethodnog koraka)
  const cockpitGeometry = new THREE.SphereGeometry(0.3, 12, 12);
  const cockpit = new THREE.Mesh(cockpitGeometry, shipWindowMaterial);
  cockpit.position.set(0, 0.8, 0.4);
  hullGroup.add(cockpit);

  // rotiramo ceo hullGroup tako da "nos" (trenutno na +Y) sada gleda u -Z pravac.
  // ovo je bitno zbog konvencije: three.js-ov lookAt() uvek okrece objekat
  // tako da njegova LOKALNA -Z osa gleda ka meti - zato nos MORA biti na -Z, ne bilo gde drugde
  hullGroup.rotation.x = -Math.PI / 2;

  // spoljna grupa - NJU animiramo (position + lookAt) u animate() petlji.
  // hullGroup ostaje unutra kao "fiksna korekcija orijentacije" -
  // da smo rotaciju stavili direktno na spoljnu grupu, lookAt bi je svaki frejm pregazio
  const shipGroup = new THREE.Group();
  shipGroup.add(hullGroup);

  shipGroup.userData.info = "Svemirski brod - kruzi oko stanice po sinusoidnoj putanji.";

  return shipGroup;
}

export function updateSpaceshipAnimation(spaceship) {
  shipAngle += SHIP_ORBIT_SPEED;

  const x = Math.cos(shipAngle) * SHIP_ORBIT_RADIUS;
  const z = Math.sin(shipAngle) * SHIP_ORBIT_RADIUS;

  spaceship.position.set(x, 0, z);
  spaceship.lookAt(0, 0, 0);
}
