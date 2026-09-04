import * as THREE from 'three';
import { assetManager } from './AssetManager';

export interface WorldProps {
  scene: THREE.Scene;
  colliders: THREE.Box3[];
  particles: THREE.Points[];
  update: (dt: number) => void;
}

/**
 * Creates procedural texture for skyscraper facade with illuminated windows and neon bands.
 */
function createBuildingTexture(neonColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark alloy facade
  ctx.fillStyle = '#060a12';
  ctx.fillRect(0, 0, 512, 1024);

  // Structural panel seams
  ctx.strokeStyle = '#0b1626';
  ctx.lineWidth = 2;
  for (let y = 0; y < 1024; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Illuminated office/habitation windows
  const cols = 12;
  const rows = 30;
  const wWidth = 24;
  const wHeight = 16;
  const colStep = 512 / cols;
  const rowStep = 1024 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const rand = Math.random();
      if (rand > 0.45) {
        if (rand > 0.85) {
          ctx.fillStyle = neonColor;
        } else if (rand > 0.65) {
          ctx.fillStyle = '#a8e6cf';
        } else {
          ctx.fillStyle = '#fffae0';
        }
        ctx.fillRect(c * colStep + 8, r * rowStep + 8, wWidth, wHeight);
      }
    }
  }

  // Neon accent strips running vertically
  ctx.fillStyle = neonColor;
  ctx.fillRect(0, 0, 4, 1024);
  ctx.fillRect(508, 0, 4, 1024);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Creates a holographic billboard canvas texture with animated sci-fi advert content.
 */
function createHoloAdTexture(title: string, subtitle: string, accentColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(5, 12, 24, 0.9)';
  ctx.fillRect(0, 0, 512, 256);

  // Border glow
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 240);

  // Scanlines
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
  ctx.lineWidth = 1;
  for (let y = 0; y < 256; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Text
  ctx.font = 'bold 38px sans-serif';
  ctx.fillStyle = accentColor;
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 110);

  ctx.font = '600 20px sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(subtitle, 256, 160);

  ctx.font = '14px monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText('STATUS: ONLINE // SECTOR 07', 256, 210);

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

/**
 * Builds the Futuristic Cyber City environment (Chapter 1-3) or Abyssal Citadel (Chapter 4-6).
 */
export function buildEnvironment(scene: THREE.Scene, chapterId: number): WorldProps {
  const colliders: THREE.Box3[] = [];
  const particles: THREE.Points[] = [];
  const flyingVehicles: { mesh: THREE.Group; speed: number; laneY: number; laneZ: number; dir: number }[] = [];

  const isDarkRealm = chapterId >= 4;

  // Environment GLB loader attempt
  const envAssetPath = isDarkRealm ? '/assets/environment/city/abyssal-citadel.glb' : '/assets/environment/city/sector-1.glb';
  assetManager.loadGLTF(envAssetPath).then((gltf) => {
    if (gltf) {
      try {
        const envModel = assetManager.cloneScene(gltf);
        scene.add(envModel);
        console.log(`[World] Environment GLB '${envAssetPath}' loaded successfully.`);
      } catch (e) {
        console.warn('Failed mounting environment GLB:', e);
      }
    }
  });

  // --- 1. Road & Tactical Cyber Floor ---
  const floorSize = 130;
  const floorGeo = new THREE.PlaneGeometry(floorSize, floorSize, 32, 32);
  floorGeo.rotateX(-Math.PI / 2);

  const roadCanvas = document.createElement('canvas');
  roadCanvas.width = 1024;
  roadCanvas.height = 1024;
  const rCtx = roadCanvas.getContext('2d')!;

  // Dark wet asphalt base
  rCtx.fillStyle = isDarkRealm ? '#0a0305' : '#070d16';
  rCtx.fillRect(0, 0, 1024, 1024);

  // Cyber road grid lines
  rCtx.strokeStyle = isDarkRealm ? 'rgba(255, 20, 50, 0.35)' : 'rgba(0, 220, 255, 0.35)';
  rCtx.lineWidth = 4;
  const gridStep = 128;
  for (let x = 0; x <= 1024; x += gridStep) {
    rCtx.beginPath();
    rCtx.moveTo(x, 0);
    rCtx.lineTo(x, 1024);
    rCtx.stroke();
  }
  for (let y = 0; y <= 1024; y += gridStep) {
    rCtx.beginPath();
    rCtx.moveTo(0, y);
    rCtx.lineTo(1024, y);
    rCtx.stroke();
  }

  // Tactical lane markers & crosswalk stripes
  rCtx.fillStyle = isDarkRealm ? 'rgba(255, 0, 60, 0.6)' : 'rgba(0, 240, 255, 0.6)';
  for (let i = 64; i < 1024; i += 128) {
    rCtx.fillRect(i, 480, 48, 64);
  }

  const floorTex = new THREE.CanvasTexture(roadCanvas);
  floorTex.wrapS = THREE.RepeatWrapping;
  floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(8, 8);

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.25,
    metalness: 0.8,
  });

  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.receiveShadow = true;
  scene.add(floor);

  // --- 2. Perimeter Energy Barriers & Containment Walls ---
  const wallHeight = 10;
  const halfSize = floorSize / 2;

  const barrierMat = new THREE.MeshStandardMaterial({
    color: isDarkRealm ? 0x220508 : 0x0a1626,
    metalness: 0.9,
    roughness: 0.3,
  });

  const barrierGlowMat = new THREE.MeshStandardMaterial({
    color: isDarkRealm ? 0xff0044 : 0x00f0ff,
    emissive: isDarkRealm ? 0xff0022 : 0x00d8f6,
    emissiveIntensity: 2.2,
    transparent: true,
    opacity: 0.75,
  });

  const createPerimeterWall = (x: number, z: number, w: number, d: number) => {
    const wallGroup = new THREE.Group();
    wallGroup.position.set(x, wallHeight / 2, z);

    const baseGeo = new THREE.BoxGeometry(w, wallHeight, d);
    const baseMesh = new THREE.Mesh(baseGeo, barrierMat);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    wallGroup.add(baseMesh);

    // Glowing energy top conduit
    const conduitGeo = new THREE.BoxGeometry(w, 0.4, d);
    const conduitMesh = new THREE.Mesh(conduitGeo, barrierGlowMat);
    conduitMesh.position.y = wallHeight / 2 - 0.2;
    wallGroup.add(conduitMesh);

    scene.add(wallGroup);
    colliders.push(new THREE.Box3().setFromObject(wallGroup));
  };

  createPerimeterWall(0, -halfSize, floorSize, 3);
  createPerimeterWall(0, halfSize, floorSize, 3);
  createPerimeterWall(-halfSize, 0, 3, floorSize);
  createPerimeterWall(halfSize, 0, 3, floorSize);

  // --- 3. Futuristic Skyscrapers & Architecture ---
  const bldgTextures = [
    createBuildingTexture('#00f0ff'),
    createBuildingTexture('#ff0055'),
    createBuildingTexture('#ffe600'),
  ];

  const buildingCount = 20;
  for (let i = 0; i < buildingCount; i++) {
    const angle = (i / buildingCount) * Math.PI * 2;
    const dist = 68 + (i % 3) * 16;
    const bx = Math.cos(angle) * dist;
    const bz = Math.sin(angle) * dist;

    const bWidth = 14 + (i % 4) * 5;
    const bDepth = 14 + ((i + 2) % 4) * 4;
    const bHeight = 45 + (i % 6) * 22;

    const bGroup = new THREE.Group();
    bGroup.position.set(bx, 0, bz);

    // Main tower
    const bMat = new THREE.MeshStandardMaterial({
      map: bldgTextures[i % bldgTextures.length],
      metalness: 0.85,
      roughness: 0.35,
    });
    const towerMesh = new THREE.Mesh(new THREE.BoxGeometry(bWidth, bHeight, bDepth), bMat);
    towerMesh.position.y = bHeight / 2;
    bGroup.add(towerMesh);

    // Setback top tower
    const topHeight = 15;
    const topTower = new THREE.Mesh(
      new THREE.BoxGeometry(bWidth * 0.65, topHeight, bDepth * 0.65),
      bMat
    );
    topTower.position.y = bHeight + topHeight / 2;
    bGroup.add(topTower);

    // Rooftop Spire & Warning Beacon
    const spireGeo = new THREE.CylinderGeometry(0.1, 0.4, 12, 6);
    const spireMat = new THREE.MeshStandardMaterial({ color: 0x223344, metalness: 0.9 });
    const spire = new THREE.Mesh(spireGeo, spireMat);
    spire.position.y = bHeight + topHeight + 6;
    bGroup.add(spire);

    const beaconGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xff0044,
      emissive: 0xff0022,
      emissiveIntensity: 3.0,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = bHeight + topHeight + 12;
    bGroup.add(beacon);

    // Holographic Ads on select front facades
    if (i % 3 === 0) {
      const titles = ['A.U.R.A. DEFENSE', 'NEO-CYBERIA', 'QUANTUM SYNAPSE', 'ORBITAL ELEVATOR'];
      const subs = ['ACTIVE RESISTANCE MATRIX', 'METROPOLIS SECTOR 01', 'ENERGY CORE ONLINE', 'ACCESS AUTHORIZED'];
      const adTex = createHoloAdTexture(titles[i % titles.length], subs[i % subs.length], i % 2 === 0 ? '#00f0ff' : '#ff0055');

      const adMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(16, 8),
        new THREE.MeshBasicMaterial({ map: adTex, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
      );
      // Face toward center
      adMesh.position.set(0, 22, (bDepth / 2) + 0.1);
      bGroup.add(adMesh);
    }

    scene.add(bGroup);
  }

  // --- 4. Street Lamps & Holographic Props Inside Arena ---
  const streetLightPositions = [
    [-24, -24], [24, -24], [-24, 24], [24, 24],
    [-40, 0], [40, 0], [0, -40], [0, 40],
  ];

  streetLightPositions.forEach(([lx, lz], idx) => {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(lx, 0, lz);

    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.18, 6.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x111c2e, metalness: 0.9 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 3.25;
    pole.castShadow = true;
    lampGroup.add(pole);

    // Overhang arm
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6);
    armGeo.rotateZ(Math.PI / 3);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(0.6, 6.2, 0);
    lampGroup.add(arm);

    // Glowing Luminaire head
    const lampColor = isDarkRealm ? 0xff2244 : (idx % 2 === 0 ? 0x00f0ff : 0x00e5ff);
    const lumGeo = new THREE.SphereGeometry(0.24, 8, 8);
    const lumMat = new THREE.MeshStandardMaterial({
      color: lampColor,
      emissive: lampColor,
      emissiveIntensity: 3.5,
    });
    const lum = new THREE.Mesh(lumGeo, lumMat);
    lum.position.set(1.4, 5.8, 0);
    lampGroup.add(lum);

    // Local Point Light
    const pl = new THREE.PointLight(lampColor, 2.8, 18);
    pl.position.set(1.4, 5.5, 0);
    lampGroup.add(pl);

    scene.add(lampGroup);

    // Collider for street lamp pole
    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(lx, 3.25, lz),
      new THREE.Vector3(0.6, 6.5, 0.6)
    ));
  });

  // --- 5. Street Props: Damaged Barricades & Energy Conduits ---
  const propCoords = [
    [-15, 12], [15, 12], [-12, -18], [14, -16],
    [-28, 14], [28, -14],
  ];

  propCoords.forEach(([px, pz]) => {
    const propGroup = new THREE.Group();
    propGroup.position.set(px, 0, pz);

    // Reinforced barricade block
    const barGeo = new THREE.BoxGeometry(4.2, 1.4, 1.2);
    const barMat = new THREE.MeshStandardMaterial({
      color: isDarkRealm ? 0x240e14 : 0x142033,
      metalness: 0.85,
      roughness: 0.3,
    });
    const barricade = new THREE.Mesh(barGeo, barMat);
    barricade.position.y = 0.7;
    barricade.castShadow = true;
    barricade.receiveShadow = true;
    propGroup.add(barricade);

    // Warning hazard stripes
    const stripeGeo = new THREE.BoxGeometry(4.22, 0.25, 1.22);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: isDarkRealm ? 0xff0033 : 0x00f0ff,
      emissive: isDarkRealm ? 0xff0022 : 0x00e5ff,
      emissiveIntensity: 2.2,
    });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 0.8;
    propGroup.add(stripe);

    scene.add(propGroup);

    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(px, 0.7, pz),
      new THREE.Vector3(4.2, 1.4, 1.2)
    ));
  });

  // --- 6. Sky Traffic (Flying Cyber Aerocars) ---
  const aerocarMat = new THREE.MeshStandardMaterial({
    color: 0x051122,
    metalness: 0.95,
    roughness: 0.15,
  });
  const carLightMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00f7ff,
    emissiveIntensity: 3.5,
  });
  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0xff0044,
    emissive: 0xff0022,
    emissiveIntensity: 3.5,
  });

  for (let v = 0; v < 8; v++) {
    const vGroup = new THREE.Group();
    const carBody = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.9, 1.8), aerocarMat);
    vGroup.add(carBody);

    // Front headlights
    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.4), carLightMat);
    headL.position.set(2.3, 0, 0.6);
    vGroup.add(headL);

    const headR = headL.clone();
    headR.position.z = -0.6;
    vGroup.add(headR);

    // Rear engine exhaust trail
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.4), tailLightMat);
    tailL.position.set(-2.3, 0, 0.6);
    vGroup.add(tailL);

    const tailR = tailL.clone();
    tailR.position.z = -0.6;
    vGroup.add(tailR);

    const laneY = 28 + (v % 4) * 8;
    const laneZ = -70 + v * 20;
    const dir = v % 2 === 0 ? 1 : -1;
    vGroup.position.set((Math.random() - 0.5) * 160, laneY, laneZ);
    if (dir < 0) vGroup.rotation.y = Math.PI;

    scene.add(vGroup);
    flyingVehicles.push({
      mesh: vGroup,
      speed: 25 + Math.random() * 15,
      laneY,
      laneZ,
      dir,
    });
  }

  // --- 7. Atmospheric Cyber Energy Dust & Fog Motes ---
  const pCount = 450;
  const pGeo = new THREE.BufferGeometry();
  const pPositions = new Float32Array(pCount * 3);

  for (let i = 0; i < pCount * 3; i += 3) {
    pPositions[i] = (Math.random() - 0.5) * 95;
    pPositions[i + 1] = Math.random() * 20 + 0.5;
    pPositions[i + 2] = (Math.random() - 0.5) * 95;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

  const pMat = new THREE.PointsMaterial({
    color: isDarkRealm ? 0xff2244 : 0x00f7ff,
    size: 0.28,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
  });

  const pPoints = new THREE.Points(pGeo, pMat);
  scene.add(pPoints);
  particles.push(pPoints);

  // Update function for animated vehicles & particle sway
  const update = (dt: number) => {
    // Animate flying vehicles
    flyingVehicles.forEach((v) => {
      v.mesh.position.x += v.dir * v.speed * dt;
      if (v.dir > 0 && v.mesh.position.x > 120) {
        v.mesh.position.x = -120;
      } else if (v.dir < 0 && v.mesh.position.x < -120) {
        v.mesh.position.x = 120;
      }
    });

    // Animate floating energy motes
    const pos = pGeo.attributes.position.array as Float32Array;
    for (let i = 1; i < pos.length; i += 3) {
      pos[i] += Math.sin(Date.now() * 0.001 + pos[i - 1]) * 0.02;
      if (pos[i] > 22) pos[i] = 0.5;
    }
    pGeo.attributes.position.needsUpdate = true;
  };

  return { scene, colliders, particles, update };
}
