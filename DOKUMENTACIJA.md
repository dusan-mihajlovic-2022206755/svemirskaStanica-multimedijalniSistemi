# Virtuelna tura – Istraživačka svemirska stanica

**Predmet:** Multimedijalni sistemi – Kolokvijum 2
**Autor:** Dušan Mihajlović, 2022/206755

---

## 1. Teorijski uvod

Aplikacija predstavlja interaktivnu 3D vizuelizaciju svemirske stanice u orbiti, realizovanu kao **WebGL** aplikacija koja se izvršava direktno u internet pretraživaču, bez potrebe za dodatnim plaginovima. Za renderovanje 3D scene korišćen je **Three.js** – JavaScript biblioteka koja apstrahuje nisko-nivoske WebGL pozive i nudi pogodan API za rad sa scenama, geometrijom, materijalima, svetlima i kamerom.

Osnovni koncept 3D grafike korišćen u projektu je **scene graph** (hijerarhija objekata): svaki složeni objekat (stanica, robotska ruka, brod) je izgrađen kao stablo `THREE.Group` i `THREE.Mesh` objekata, gde transformacije roditelja (rotacija, translacija) automatski utiču na sve potomke. Ovaj princip je iskorišćen za simulaciju zglobne robotske ruke (rame – lakat – šaka – kljesta) i orbitalnog kretanja.

Za realističniji prikaz scena, primenjuju se sledeći koncepti računarske grafike:
- **Rasterizacija** trouglova geometrije preko GPU-a (WebGL).
- **Osvetljenje** po Phong/PBR modelu (`MeshStandardMaterial`), sa ambijentalnim i direkcionim (sunčevim) svetlom.
- **Teksturisanje** (difuzne mape, normal mape, bump mape) radi dobijanja detalja površine bez dodatne geometrije.
- **Post-processing** – dodatna obrada renderovane slike (bloom efekat za simulaciju sijanja sunčeve svetlosti/prozora).
- **Raycasting** – bacanje zraka iz kamere kroz poziciju kursora radi detekcije klika na 3D objekte (selekcija objekata mišem).

---

## 2. Korišćene tehnologije i biblioteke

| Tehnologija | Namena |
|---|---|
| **Three.js** (`three`, v0.185) | Glavna biblioteka za 3D renderovanje (scena, kamera, svetla, materijali, geometrija) |
| **OrbitControls** (`three/examples/jsm/Addons`) | Kontrola kamere mišem (rotacija, zum, pan oko scene) |
| **EffectComposer + RenderPass + UnrealBloomPass** | Post-processing pipeline za bloom (efekat sijanja) |
| **Vite** (v8) | Build alat i dev server (ES moduli, hot-reload, produkcioni build) |
| **HTML5 Canvas 2D API** | Proceduralno generisanje tekstura (zvezdano nebo, Zemlja) koje se potom koriste kao Three.js teksture |
| **Vanilla JavaScript (ES moduli)** | Cela aplikacija je pisana u čistom JS-u, bez frontend frameworka |
| **CSS** | Minimalno stilizovanje UI overlay-a (dugmad, info panel) |

Projekat je organizovan modularno (`src/`):
- `main.js` – ulazna tačka, inicijalizacija i glavna render petlja (game loop)
- `scene.js` – kreiranje scene, kamere, renderera, kontrola i post-processing pipeline-a
- `lights.js` – definisanje izvora svetla
- `materials.js` – učitavanje tekstura i definisanje materijala
- `skybox.js` – proceduralno generisanje neba sa zvezdama i Zemlje
- `station.js` – geometrija i animacija svemirske stanice (moduli, paneli, antena, robotska ruka)
- `spaceship.js` – geometrija i animacija svemirskog broda koji kruži oko stanice
- `tour.js` – kontroler virtuelne ture (unapred definisane tačke kamere + animacija prelaza)
- `interaction.js` – detekcija klika na objekte (raycasting) i prikaz informacija

---

## 3. Najvažnije funkcionalnosti i isečci koda

### 3.1 Inicijalizacija scene i post-processing pipeline

Scena koristi `EffectComposer` sa dva prolaza (pass-a): standardni render prolaz i `UnrealBloomPass` koji dodaje efekat sijanja svetlih delova scene (npr. osvetljenih prozora).

```js
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.2, 0.4, 0.3   // strength, radius, threshold
));
```

### 3.2 Glavna render petlja (game loop)

U `main.js` se u svakom frejmu ažuriraju animacije stanice, broda i kamere, nakon čega se scena renderuje kroz composer:

```js
const gameLoop = () => {
    const elapsedTime = clock.getElapsedTime();
    updateStationAnimation(station, elapsedTime);
    tour.updateCameraAnimation();
    updateSpaceshipAnimation(spaceship);

    controls.update();
    composer.render();
    window.requestAnimationFrame(gameLoop);
};
```

### 3.3 Hijerarhijska animacija robotske ruke

Robotska ruka je modelovana kao lanac ugnježdenih `THREE.Group` objekata (rame → lakat → šaka → kljesta), gde svaki segment nasleđuje transformaciju prethodnog – klasičan princip **forward kinematike**:

```js
robotArmShoulder.rotation.z = Math.sin(elapsedTime * ROBOT_ARM_SPEED) * 0.3;
robotArmElbow.rotation.z = Math.sin(elapsedTime * ROBOT_ARM_SPEED * 1.5) * 0.5;

const openAmount = ((Math.sin(elapsedTime * PINCER_SPEED) + 1) / 2) * PINCER_MAX_ANGLE;
pincerTopPivot.rotation.z = openAmount;
pincerBottomPivot.rotation.z = -openAmount;
```

### 3.4 Orbitalno kretanje stanice i broda

Kretanje po kružnoj putanji se dobija parametarski, preko trigonometrijskih funkcija:

```js
orbitAngle += STATION_ORBIT_SPEED;
stationGroup.position.x = Math.cos(orbitAngle) * STATION_ORBIT_RADIUS;
stationGroup.position.z = Math.sin(orbitAngle) * STATION_ORBIT_RADIUS;
```

Brod dodatno koristi `lookAt()` kako bi uvek bio orijentisan ka centru stanice tokom kruženja.

### 3.5 Virtuelna tura – animirani prelaz kamere

Tura je definisana kao niz unapred zadatih tačaka (pozicija + tačka gledanja). Prelaz između tačaka se ne dešava skokovito, već se pozicija kamere i target `OrbitControls`-a interpoliraju (`lerp`) uz **smoothstep** funkciju ubrzanja/usporenja:

```js
const t = Math.min((performance.now() - animStartTime) / ANIM_DURATION, 1);
const eased = t * t * (3 - 2 * t); // smoothstep

camera.position.lerpVectors(animStartPos, animEndPos, eased);
controls.target.lerpVectors(animStartLook, animEndLook, eased);
```

### 3.6 Interakcija klikom – raycasting

Klikom na canvas, pozicija miša se pretvara u normalizovane koordinate uređaja (NDC), a zatim se zrak iz kamere baca kroz scenu radi pronalaska pogođenog objekta:

```js
mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

raycaster.setFromCamera(mouse, camera);
const intersects = raycaster.intersectObjects(scene.children, true);

if (intersects.length > 0 && intersects[0].object.userData.info) {
    infoPanel.textContent = intersects[0].object.userData.info;
}
```

Svaki relevantan deo modela (moduli, paneli, antena, robotska ruka, brod) ima postavljen `userData.info` naziv koji se prikazuje u info panelu.

### 3.7 Proceduralno generisanje tekstura

Zvezdano nebo i Zemlja se ne učitavaju kao gotove slike, već se generišu u realnom vremenu pomoću HTML5 Canvas 2D API-ja i potom koriste kao `THREE.CanvasTexture`:

```js
for (let i = 0; i < 1500; i++) {
    const x = Math.random() * 1024, y = Math.random() * 1024;
    const brightness = Math.random() * 0.5 + 0.5;
    starCtx.fillStyle = `rgba(255,255,255,${brightness})`;
    starCtx.beginPath();
    starCtx.arc(x, y, Math.random() * 1.4, 0, Math.PI * 2);
    starCtx.fill();
}
const starTexture = new THREE.CanvasTexture(starCanvas);
```

### 3.8 Materijali i teksture

Za realan izgled metalnih površina i solarnih panela koriste se `MeshStandardMaterial` (PBR) sa kombinacijom difuzne mape, normal mape i bump mape, dok su prozori simulirani emisivnim materijalom (efekat osvetljenih prozora stanice, dodatno naglašen bloom pass-om):

```js
const windowMaterial = new THREE.MeshStandardMaterial({
    map: windowTexture,
    emissive: 0xffcc66,
    emissiveIntensity: 1.5
});
```

---

## 4. Funkcionalnosti aplikacije

- **Prikaz 3D modela svemirske stanice**, sastavljene iz više modula: centralni (hub), laboratorijski, stambeni modul, solarni paneli, prozori, antena i robotska ruka sa kleštima.
- **Svemirski brod** koji kontinuirano kruži oko stanice.
- **Automatske animacije**: rotacija stanice oko sopstvene ose, orbitalno kretanje stanice, rotiranje antene, pokreti robotske ruke i otvaranje/zatvaranje kleštiju, rotacija laboratorijskog modula.
- **Slobodna kontrola kamere** mišem (rotacija, zum, pomeranje) preko `OrbitControls`.
- **Virtuelna tura** – dugmad "Prethodna tačka" / "Sledeća tačka" vode kroz unapred definisane tačke posmatranja (spoljni pregled, solarni paneli, laboratorijski modul, stambeni modul i ruka, pogled odozgo), uz glatku animiranu tranziciju kamere.
- **Interakcija klikom (raycasting)** – klik na bilo koji deo modela ispisuje naziv tog dela u info panelu na vrhu ekrana.
- **Skybox** sa proceduralno generisanim zvezdanim nebom i modelom Zemlje u pozadini.
- **Bloom post-processing efekat** koji naglašava osvetljene delove scene (sunce, prozori).
- **Responzivnost** – scena i kamera se automatski prilagođavaju promeni veličine prozora.

*(Printskrinovi gotovog rešenja se dodaju ovde – prikaz spoljnog izgleda stanice, pojedinačnih modula, robotske ruke tokom rada, virtuelne ture i info panela nakon klika.)*
