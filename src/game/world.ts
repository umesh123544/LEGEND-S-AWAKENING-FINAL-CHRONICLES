import * as THREE from 'three';
import { assetManager } from './AssetManager';

export interface WorldProps {
  scene: THREE.Scene;
  group: THREE.Group;
  colliders: THREE.Box3[];
  particles: THREE.Points[];
  update: (dt: number) => void;
  destroy: () => void;
}

/**
 * Creates asphalt road canvas texture with yellow/white dividing lines and pedestrian zebra crossings.
 */
function createAsphaltRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark asphalt base
  ctx.fillStyle = '#1e242d';
  ctx.fillRect(0, 0, 1024, 1024);

  // Fine asphalt pebble grain noise
  ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const s = Math.random() * 2 + 1;
    ctx.fillRect(x, y, s, s);
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const s = Math.random() * 2 + 1;
    ctx.fillRect(x, y, s, s);
  }

  // Outer Solid White Road Shoulder Lines (Left & Right)
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(80, 0, 20, 1024);
  ctx.fillRect(924, 0, 20, 1024);

  // Center Double Solid/Dashed Yellow Lines
  ctx.fillStyle = '#facc15';
  for (let y = 30; y < 1024; y += 128) {
    ctx.fillRect(504, y, 16, 75);
  }

  // Pedestrian Zebra Crosswalk at center
  ctx.fillStyle = '#f8fafc';
  for (let x = 140; x < 880; x += 60) {
    ctx.fillRect(x, 460, 36, 110);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Creates concrete sidewalk slab texture with mortar joints.
 */
function createSidewalkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, 512, 512);

  // Stone pavers grid joints
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 4;
  for (let i = 0; i <= 512; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  // Subtle concrete texture flecks
  ctx.fillStyle = 'rgba(71, 85, 105, 0.08)';
  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillRect(x, y, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Creates lush green lawn grass texture.
 */
function createGrassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3f6212';
  ctx.fillRect(0, 0, 512, 512);

  // Multi-tonal grass blades
  const greens = ['#4d7c0f', '#65a30d', '#365314', '#283618', '#84cc16'];
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = greens[Math.floor(Math.random() * greens.length)];
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillRect(x, y, 3, 5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Creates horizontal timber clapboard siding texture for houses.
 */
function createHouseSidingTexture(baseColor: string, isBrick = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);

  if (isBrick) {
    // Brick mortar lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    const rowH = 32;
    const brickW = 64;
    for (let y = 0; y <= 512; y += rowH) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      const offset = (Math.floor(y / rowH) % 2) * (brickW / 2);
      for (let x = offset; x <= 512; x += brickW) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + rowH);
        ctx.stroke();
      }
    }
  } else {
    // Clapboard siding plank lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.lineWidth = 3;
    for (let y = 0; y <= 512; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Creates textured roof shingle tile texture.
 */
function createRoofTileTexture(tileColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = tileColor;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = 3;
  const rowH = 32;
  const w = 48;
  for (let y = 0; y <= 512; y += rowH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();

    const offset = (Math.floor(y / rowH) % 2) * (w / 2);
    for (let x = offset; x <= 512; x += w) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + rowH);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Creates organic tree bark texture with vertical striations.
 */
function createBarkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#4a2810';
  ctx.fillRect(0, 0, 256, 512);

  const lines = ['#361b07', '#5d3214', '#271305', '#6b3c19'];
  for (let i = 0; i < 400; i++) {
    ctx.strokeStyle = lines[Math.floor(Math.random() * lines.length)];
    ctx.lineWidth = Math.random() * 3 + 1;
    const x = Math.random() * 256;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (Math.random() - 0.5) * 20, 512);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Builds a detailed, organic deciduous Broadleaf Oak/Maple tree with branching trunk and multi-cluster foliage.
 */
function createSculptedOakTree(barkMat: THREE.Material, scale = 1.0, isDarkRealm = false): THREE.Group {
  const tree = new THREE.Group();
  tree.scale.set(scale, scale, scale);

  // Main Trunk (Organic tapered curved cylinder)
  const trunkGeo = new THREE.CylinderGeometry(0.32, 0.52, 4.8, 10);
  const trunk = new THREE.Mesh(trunkGeo, barkMat);
  trunk.position.y = 2.4;
  trunk.castShadow = true;
  tree.add(trunk);

  // Exposed Trunk Roots
  for (let r = 0; r < 4; r++) {
    const rootGeo = new THREE.CylinderGeometry(0.12, 0.22, 1.4, 6);
    rootGeo.rotateZ(Math.PI / 4);
    const rootMesh = new THREE.Mesh(rootGeo, barkMat);
    const ang = (r * Math.PI) / 2;
    rootMesh.position.set(Math.cos(ang) * 0.45, 0.35, Math.sin(ang) * 0.45);
    rootMesh.rotation.y = ang;
    tree.add(rootMesh);
  }

  // Branch Boughs
  const branchGeo = new THREE.CylinderGeometry(0.14, 0.24, 2.2, 6);
  const branch1 = new THREE.Mesh(branchGeo, barkMat);
  branch1.position.set(0.6, 3.8, 0.4);
  branch1.rotation.z = -Math.PI / 4;
  tree.add(branch1);

  const branch2 = new THREE.Mesh(branchGeo, barkMat);
  branch2.position.set(-0.6, 4.0, -0.3);
  branch2.rotation.z = Math.PI / 4;
  tree.add(branch2);

  // Natural Volumetric Multi-Cluster Foliage Canopy
  // In Dark Realm: fiery autumn/burnt red-orange; In daylight: lush vibrant forest green
  const foliageColors = isDarkRealm
    ? [0x991b1b, 0xb45309, 0x7f1d1d, 0xd97706]
    : [0x15803d, 0x16a34a, 0x22c55e, 0x4d7c0f, 0x65a30d];

  const clusters = [
    { x: 0, y: 5.6, z: 0, r: 2.1 },
    { x: 1.1, y: 5.2, z: 0.8, r: 1.6 },
    { x: -1.1, y: 5.4, z: -0.7, r: 1.7 },
    { x: 0.7, y: 6.6, z: -0.5, r: 1.5 },
    { x: -0.6, y: 6.7, z: 0.6, r: 1.4 },
    { x: 0, y: 7.2, z: 0, r: 1.3 },
  ];

  clusters.forEach((cl, idx) => {
    const col = foliageColors[idx % foliageColors.length];
    const foliageMat = new THREE.MeshStandardMaterial({
      color: col,
      roughness: 0.8,
      metalness: 0.05,
      flatShading: true,
    });

    const fGeo = new THREE.DodecahedronGeometry(cl.r, 2);
    const clump = new THREE.Mesh(fGeo, foliageMat);
    clump.position.set(cl.x, cl.y, cl.z);
    clump.castShadow = true;
    clump.receiveShadow = true;
    tree.add(clump);
  });

  return tree;
}

/**
 * Builds a natural evergreen Pine / Fir tree with stacked needle tiers.
 */
function createSculptedPineTree(barkMat: THREE.Material, scale = 1.0, isDarkRealm = false): THREE.Group {
  const tree = new THREE.Group();
  tree.scale.set(scale, scale, scale);

  // Tall straight trunk
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.38, 6.5, 8);
  const trunk = new THREE.Mesh(trunkGeo, barkMat);
  trunk.position.y = 3.25;
  trunk.castShadow = true;
  tree.add(trunk);

  // Stacked Conical Foliage Tiers
  const needleCol = isDarkRealm ? 0x7c2d12 : 0x14532d;
  const pineMat = new THREE.MeshStandardMaterial({
    color: needleCol,
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true,
  });

  const tiers = [
    { y: 3.2, r: 2.2, h: 2.4 },
    { y: 4.8, r: 1.8, h: 2.2 },
    { y: 6.2, r: 1.4, h: 2.0 },
    { y: 7.5, r: 1.0, h: 1.8 },
    { y: 8.6, r: 0.6, h: 1.4 },
  ];

  tiers.forEach((t) => {
    const coneGeo = new THREE.ConeGeometry(t.r, t.h, 9);
    const tierMesh = new THREE.Mesh(coneGeo, pineMat);
    tierMesh.position.y = t.y;
    tierMesh.castShadow = true;
    tierMesh.receiveShadow = true;
    tree.add(tierMesh);
  });

  return tree;
}

/**
 * Builds a detailed, lifelike Roadside Suburban / Village House with:
 * - Walls with clapboard / brick textures
 * - Pitched gabled roof with shingles and overhang eaves
 * - Brick chimney with flue cap
 * - Front porch with wooden deck, steps, white columns and handrails
 * - Front entrance door with brass handle and porch light lantern
 * - Multi-pane glass windows with white frames and warm glowing interior illumination
 * - Picket fences enclosing the front yard
 */
function createDetailedRoadsideHouse(
  options: {
    wallColor: string;
    roofColor: string;
    isBrick?: boolean;
    hasPorch?: boolean;
    hasBalcony?: boolean;
    width?: number;
    depth?: number;
    height?: number;
    isShop?: boolean;
  }
): { houseGroup: THREE.Group; colliders: THREE.Box3[] } {
  const houseGroup = new THREE.Group();
  const colliders: THREE.Box3[] = [];

  const w = options.width || 12;
  const d = options.depth || 10;
  const h = options.height || 6.5;

  const sidingTex = createHouseSidingTexture(options.wallColor, options.isBrick);
  sidingTex.repeat.set(w / 4, h / 3);

  const wallMat = new THREE.MeshStandardMaterial({
    map: sidingTex,
    roughness: 0.75,
    metalness: 0.1,
  });

  const roofTex = createRoofTileTexture(options.roofColor);
  roofTex.repeat.set(w / 3, d / 3);
  const roofMat = new THREE.MeshStandardMaterial({
    map: roofTex,
    roughness: 0.7,
    metalness: 0.15,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.4,
    metalness: 0.1,
  });

  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x5c2b14,
    roughness: 0.5,
  });

  const windowFrameMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
  });

  const windowGlassMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfde047,
    emissiveIntensity: 1.6,
    roughness: 0.1,
  });

  // --- 1. Foundation Base ---
  const foundationMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
  const fMesh = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.8, d + 0.4), foundationMat);
  fMesh.position.y = 0.4;
  fMesh.receiveShadow = true;
  houseGroup.add(fMesh);

  // --- 2. Main 1st Floor Body ---
  const bMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  bMesh.position.y = h / 2 + 0.8;
  bMesh.castShadow = true;
  bMesh.receiveShadow = true;
  houseGroup.add(bMesh);

  // House Collider Box
  colliders.push(new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(0, h / 2, 0),
    new THREE.Vector3(w + 1, h + 3, d + 1)
  ));

  // --- 3. Pitched Gabled Roof with Overhang ---
  const roofH = 4.2;
  const roofGeo = new THREE.ConeGeometry(Math.sqrt((w * w) / 2), roofH, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.position.y = h + 0.8 + roofH / 2;
  roofMesh.scale.set(1.15, 1, (d / w) * 1.15);
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  houseGroup.add(roofMesh);

  // Roof Eaves Trim
  const eaveGeo = new THREE.BoxGeometry(w * 1.22, 0.25, d * 1.22);
  const eave = new THREE.Mesh(eaveGeo, trimMat);
  eave.position.y = h + 0.8;
  houseGroup.add(eave);

  // --- 4. Brick Chimney with Top Cap ---
  const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.85 });
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5.2, 1.2), chimneyMat);
  chimney.position.set(w * 0.32, h + 2.5, -d * 0.15);
  chimney.castShadow = true;
  houseGroup.add(chimney);

  const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 1.5), trimMat);
  chimneyCap.position.set(w * 0.32, h + 5.1, -d * 0.15);
  houseGroup.add(chimneyCap);

  // --- 5. Front Entrance Porch (Wooden Deck, Steps & White Columns) ---
  const porchDepth = 2.8;
  const porchWidth = w * 0.55;
  const porchH = 0.5;

  const porchDeckMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
  const porch = new THREE.Mesh(new THREE.BoxGeometry(porchWidth, porchH, porchDepth), porchDeckMat);
  porch.position.set(0, porchH / 2 + 0.4, d / 2 + porchDepth / 2);
  porch.receiveShadow = true;
  houseGroup.add(porch);

  // Porch steps leading down to lawn
  for (let s = 1; s <= 2; s++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(porchWidth * 0.7, 0.22, 0.45),
      foundationMat
    );
    step.position.set(0, 0.4 - s * 0.18, d / 2 + porchDepth + s * 0.4);
    step.receiveShadow = true;
    houseGroup.add(step);
  }

  // Porch White Support Columns
  const colGeo = new THREE.CylinderGeometry(0.1, 0.1, h * 0.55, 8);
  [-porchWidth / 2 + 0.2, porchWidth / 2 - 0.2].forEach((cx) => {
    const column = new THREE.Mesh(colGeo, trimMat);
    column.position.set(cx, (h * 0.55) / 2 + 0.9, d / 2 + porchDepth - 0.25);
    column.castShadow = true;
    houseGroup.add(column);
  });

  // Porch Overhang Canopy Roof
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(porchWidth + 0.4, 0.3, porchDepth + 0.4),
    roofMat
  );
  canopy.position.set(0, h * 0.55 + 0.9, d / 2 + porchDepth / 2);
  canopy.castShadow = true;
  houseGroup.add(canopy);

  // Front Entrance Door
  const doorGeo = new THREE.BoxGeometry(1.6, 2.8, 0.1);
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, 2.2, d / 2 + 0.05);
  houseGroup.add(door);

  // Door Frame
  const dFrame = new THREE.Mesh(new THREE.BoxGeometry(1.85, 3.0, 0.06), trimMat);
  dFrame.position.set(0, 2.2, d / 2 + 0.02);
  houseGroup.add(dFrame);

  // Brass Doorknob
  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95 })
  );
  knob.position.set(0.55, 2.1, d / 2 + 0.12);
  houseGroup.add(knob);

  // Porch Light Lantern
  const lantern = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xf59e0b, emissiveIntensity: 2.5 })
  );
  lantern.position.set(0, 3.4, d / 2 + 0.2);
  houseGroup.add(lantern);

  // --- 6. Multi-Pane Glass Windows with Warm Interior Glow ---
  const windowPositions = [
    // 1st floor front windows (left & right of porch)
    { x: -w * 0.36, y: 2.3, z: d / 2 + 0.06, rotY: 0, w: 1.8, h: 2.2 },
    { x: w * 0.36, y: 2.3, z: d / 2 + 0.06, rotY: 0, w: 1.8, h: 2.2 },
    // 2nd floor front windows
    { x: -w * 0.25, y: h * 0.78, z: d / 2 + 0.06, rotY: 0, w: 1.6, h: 1.8 },
    { x: 0, y: h * 0.78, z: d / 2 + 0.06, rotY: 0, w: 1.6, h: 1.8 },
    { x: w * 0.25, y: h * 0.78, z: d / 2 + 0.06, rotY: 0, w: 1.6, h: 1.8 },
    // Side windows (Left)
    { x: -w / 2 - 0.06, y: 2.4, z: 0, rotY: Math.PI / 2, w: 1.8, h: 2.0 },
    { x: -w / 2 - 0.06, y: h * 0.75, z: 0, rotY: Math.PI / 2, w: 1.6, h: 1.8 },
    // Side windows (Right)
    { x: w / 2 + 0.06, y: 2.4, z: 0, rotY: -Math.PI / 2, w: 1.8, h: 2.0 },
    { x: w / 2 + 0.06, y: h * 0.75, z: 0, rotY: -Math.PI / 2, w: 1.6, h: 1.8 },
  ];

  windowPositions.forEach((wp) => {
    const winGroup = new THREE.Group();
    winGroup.position.set(wp.x, wp.y, wp.z);
    winGroup.rotation.y = wp.rotY;

    // Glowing Glass Pane
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(wp.w, wp.h), windowGlassMat);
    winGroup.add(glass);

    // Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(wp.w + 0.2, wp.h + 0.2, 0.06), windowFrameMat);
    frame.position.z = -0.02;
    winGroup.add(frame);

    // Window Muntins (Cross dividers)
    const mVert = new THREE.Mesh(new THREE.BoxGeometry(0.06, wp.h, 0.08), trimMat);
    winGroup.add(mVert);
    const mHoriz = new THREE.Mesh(new THREE.BoxGeometry(wp.w, 0.06, 0.08), trimMat);
    winGroup.add(mHoriz);

    // Window sill
    const sill = new THREE.Mesh(new THREE.BoxGeometry(wp.w + 0.4, 0.1, 0.18), trimMat);
    sill.position.set(0, -wp.h / 2 - 0.05, 0.06);
    winGroup.add(sill);

    houseGroup.add(winGroup);
  });

  // --- 7. Roadside Shop Striped Awning (If shop) ---
  if (options.isShop) {
    const awningGeo = new THREE.CylinderGeometry(w * 0.45, w * 0.45, porchDepth, 8, 1, false, 0, Math.PI);
    awningGeo.rotateZ(Math.PI / 2);
    const awningMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });
    const awning = new THREE.Mesh(awningGeo, awningMat);
    awning.position.set(0, 3.8, d / 2 + 1.2);
    houseGroup.add(awning);
  }

  return { houseGroup, colliders };
}

/**
 * Builds white picket fence segment.
 */
function createPicketFence(length: number): THREE.Group {
  const fence = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });

  // Top and bottom horizontal rails
  const railTop = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, 0.06), postMat);
  railTop.position.set(length / 2, 0.85, 0);
  fence.add(railTop);

  const railBot = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, 0.06), postMat);
  railBot.position.set(length / 2, 0.35, 0);
  fence.add(railBot);

  // Vertical slats
  const slatCount = Math.floor(length / 0.45);
  for (let i = 0; i <= slatCount; i++) {
    const x = i * 0.45;
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.1, 0.04), postMat);
    slat.position.set(x, 0.55, 0);
    fence.add(slat);

    // Pointed top tip
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.15, 4), postMat);
    tip.position.set(x, 1.15, 0);
    tip.rotation.y = Math.PI / 4;
    fence.add(tip);
  }

  return fence;
}

/**
 * Builds realistic curved roadside street lamp post with warm luminaire lantern.
 */
function createCurvedStreetLamp(isDarkRealm = false): THREE.Group {
  const lamp = new THREE.Group();

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.9,
    roughness: 0.25,
  });

  // Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.8, 8), metalMat);
  base.position.y = 0.4;
  lamp.add(base);

  // Vertical Pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 5.8, 8), metalMat);
  pole.position.y = 3.3;
  pole.castShadow = true;
  lamp.add(pole);

  // Curved gooseneck arm extending over sidewalk/road
  const armCurve = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 8, 16, Math.PI / 2), metalMat);
  armCurve.position.set(0.85, 5.8, 0);
  armCurve.rotation.z = Math.PI / 2;
  lamp.add(armCurve);

  // Lantern fixture
  const lanternHousing = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.3, 8), metalMat);
  lanternHousing.position.set(1.6, 6.2, 0);
  lamp.add(lanternHousing);

  // Glowing bulb
  const lampCol = isDarkRealm ? 0xff3b30 : 0xfffae0;
  const bulbMat = new THREE.MeshStandardMaterial({
    color: lampCol,
    emissive: lampCol,
    emissiveIntensity: 3.5,
  });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), bulbMat);
  bulb.position.set(1.6, 5.95, 0);
  lamp.add(bulb);

  // Warm light pool
  const pl = new THREE.PointLight(lampCol, isDarkRealm ? 2.5 : 2.0, 16);
  pl.position.set(1.6, 5.8, 0);
  lamp.add(pl);

  return lamp;
}

/**
 * Builds roadside wooden bench.
 */
function createRoadsideBench(): THREE.Group {
  const bench = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.7 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 });

  // Slats
  for (let i = 0; i < 4; i++) {
    const seatSlat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.16), woodMat);
    seatSlat.position.set(0, 0.55, -0.25 + i * 0.18);
    bench.add(seatSlat);

    const backSlat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.06), woodMat);
    backSlat.position.set(0, 0.85 + i * 0.18, -0.32);
    bench.add(backSlat);
  }

  // Cast iron legs
  [-1.0, 1.0].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.75), ironMat);
    leg.position.set(lx, 0.28, 0);
    bench.add(leg);

    const backSupport = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), ironMat);
    backSupport.position.set(lx, 0.9, -0.34);
    bench.add(backSupport);
  });

  return bench;
}

/**
 * Builds classic roadside fire hydrant.
 */
function createFireHydrant(): THREE.Group {
  const hydrant = new THREE.Group();
  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.6, roughness: 0.3 });
  const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.8, 12), redMat);
  body.position.y = 0.4;
  hydrant.add(body);

  const top = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 12), redMat);
  top.position.y = 0.8;
  hydrant.add(top);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8), silverMat);
  cap.position.y = 0.95;
  hydrant.add(cap);

  // Side nozzle caps
  const nozzleL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45, 8), silverMat);
  nozzleL.rotateZ(Math.PI / 2);
  nozzleL.position.set(0, 0.5, 0);
  hydrant.add(nozzleL);

  return hydrant;
}

/**
 * Builds roadside traffic signs (Speed Limit & Crosswalk).
 */
function createRoadSign(type: 'speed' | 'crosswalk'): THREE.Group {
  const sign = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85 });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 8), poleMat);
  pole.position.y = 1.6;
  sign.add(pole);

  // Sign plate
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  if (type === 'speed') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, 236, 236);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPEED', 128, 65);
    ctx.fillText('LIMIT', 128, 105);
    ctx.font = 'bold 88px sans-serif';
    ctx.fillText('35', 128, 205);
  } else {
    // Yellow diamond pedestrian crosswalk sign
    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, 236, 236);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CROSS', 128, 100);
    ctx.fillText('WALK', 128, 160);
  }

  const signTex = new THREE.CanvasTexture(canvas);
  const signPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(1.0, 1.0),
    new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.4 })
  );
  signPlate.position.set(0, 2.6, 0.06);
  sign.add(signPlate);

  return sign;
}

/**
 * Builds natural roadside garden bushes with flowers and mossy boulders.
 */
function createGardenBush(flowerColor: number): THREE.Group {
  const bush = new THREE.Group();

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.85,
    flatShading: true,
  });
  const flowerMat = new THREE.MeshStandardMaterial({
    color: flowerColor,
    roughness: 0.5,
  });

  // Base bush clumps
  const b1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 1), leafMat);
  b1.position.y = 0.55;
  bush.add(b1);

  const b2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 1), leafMat);
  b2.position.set(0.45, 0.45, 0.2);
  bush.add(b2);

  const b3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 1), leafMat);
  b3.position.set(-0.4, 0.4, -0.2);
  bush.add(b3);

  // Tiny blossom petals
  for (let f = 0; f < 8; f++) {
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), flowerMat);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * (Math.PI / 3);
    const r = 0.72;
    flower.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      0.55 + r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
    bush.add(flower);
  }

  return bush;
}

/**
 * Builds natural mossy boulder rock.
 */
function createMossyRock(scale = 1.0): THREE.Mesh {
  const rockGeo = new THREE.DodecahedronGeometry(scale, 1);
  rockGeo.scale(1.3, 0.8, 1.0);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.9,
    flatShading: true,
  });
  const rock = new THREE.Mesh(rockGeo, rockMat);
  rock.castShadow = true;
  rock.receiveShadow = true;
  return rock;
}

/**
 * Builds the complete Roadside Natural Environment with surrounding houses and trees.
 * Exactly matches user's request:
 * "ani background chai road side ma oripari ghar tree natural type ko purai detailing ma hunu pareyo"
 */
export function buildEnvironment(scene: THREE.Scene, chapterId: number): WorldProps {
  const group = new THREE.Group();
  scene.add(group);

  const colliders: THREE.Box3[] = [];
  const particles: THREE.Points[] = [];

  const isDarkRealm = chapterId === 6;

  // Set sky and atmospheric lighting
  if (isDarkRealm) {
    scene.background = new THREE.Color(0x2d0a10); // Volcanic fiery dusk for Dread Lord
    scene.fog = new THREE.FogExp2(0x380f16, 0.012);
  } else {
    scene.background = new THREE.Color(0x72a8e2); // Beautiful clear blue sky
    scene.fog = new THREE.FogExp2(0x93c5fd, 0.007);
  }

  // Attempt to load background GLB if available
  const envAssetPath = isDarkRealm
    ? '/assets/environment/city/abyssal-citadel.glb'
    : '/assets/environment/city/sector-1.glb';
  assetManager.loadGLTF(envAssetPath).then((gltf) => {
    if (gltf) {
      try {
        const envModel = assetManager.cloneScene(gltf);
        group.add(envModel);
      } catch (e) {
        console.warn('Failed mounting environment GLB:', e);
      }
    }
  });

  const arenaSize = 140;

  // --- 1. Natural Green Grass Lawn Foundation ---
  const grassTex = createGrassTexture();
  grassTex.repeat.set(16, 16);
  const grassMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 0.85,
    metalness: 0.05,
  });
  const groundGeo = new THREE.PlaneGeometry(arenaSize, arenaSize, 32, 32);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMesh = new THREE.Mesh(groundGeo, grassMat);
  groundMesh.receiveShadow = true;
  group.add(groundMesh);

  // --- 2. Central Asphalt Roadway ---
  const roadWidth = 18;
  const roadTex = createAsphaltRoadTexture();
  roadTex.repeat.set(1, 10);
  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.35,
    metalness: 0.2,
  });

  const roadGeo = new THREE.PlaneGeometry(roadWidth, arenaSize, 16, 32);
  roadGeo.rotateX(-Math.PI / 2);
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.position.y = 0.03; // Slightly above grass to prevent Z-fighting
  road.receiveShadow = true;
  group.add(road);

  // --- 3. Raised Concrete Curbs & Sidewalks along both sides of road ---
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
  const sidewalkTex = createSidewalkTexture();
  sidewalkTex.repeat.set(2, 28);
  const sidewalkMat = new THREE.MeshStandardMaterial({
    map: sidewalkTex,
    roughness: 0.6,
    metalness: 0.1,
  });

  const sidewalkWidth = 4.5;
  const curbHeight = 0.22;

  // Left Sidewalk & Curb (x ~ -11.5)
  const curbLeft = new THREE.Mesh(new THREE.BoxGeometry(0.35, curbHeight, arenaSize), curbMat);
  curbLeft.position.set(-roadWidth / 2 - 0.18, curbHeight / 2, 0);
  curbLeft.receiveShadow = true;
  group.add(curbLeft);

  const walkLeft = new THREE.Mesh(new THREE.BoxGeometry(sidewalkWidth, 0.18, arenaSize), sidewalkMat);
  walkLeft.position.set(-roadWidth / 2 - sidewalkWidth / 2 - 0.35, 0.1, 0);
  walkLeft.receiveShadow = true;
  group.add(walkLeft);

  // Right Sidewalk & Curb (x ~ +11.5)
  const curbRight = new THREE.Mesh(new THREE.BoxGeometry(0.35, curbHeight, arenaSize), curbMat);
  curbRight.position.set(roadWidth / 2 + 0.18, curbHeight / 2, 0);
  curbRight.receiveShadow = true;
  group.add(curbRight);

  const walkRight = new THREE.Mesh(new THREE.BoxGeometry(sidewalkWidth, 0.18, arenaSize), sidewalkMat);
  walkRight.position.set(roadWidth / 2 + sidewalkWidth / 2 + 0.35, 0.1, 0);
  walkRight.receiveShadow = true;
  group.add(walkRight);

  // --- 4. Perimeter Natural Boundary (Rustic Stone Walls & Timber Fences) ---
  const boundaryMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
  const half = arenaSize / 2;
  const createWallCollider = (x: number, z: number, w: number, d: number) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 4, d), boundaryMat);
    wall.position.set(x, 2, z);
    wall.visible = false;
    group.add(wall);
    colliders.push(new THREE.Box3().setFromObject(wall));
  };
  createWallCollider(0, -half, arenaSize, 2);
  createWallCollider(0, half, arenaSize, 2);
  createWallCollider(-half, 0, 2, arenaSize);
  createWallCollider(half, 0, 2, arenaSize);

  // --- 5. Roadside Houses ("oripari ghar" - Surrounding Houses) ---
  const houseConfigurations = [
    // Left Side Roadside Houses (Facing the road eastward)
    {
      x: -26,
      z: -42,
      rotY: Math.PI / 2,
      wallColor: '#f1f5f9',
      roofColor: '#475569',
      isBrick: false,
      isShop: false,
    },
    {
      x: -27,
      z: -14,
      rotY: Math.PI / 2,
      wallColor: '#b91c1c',
      roofColor: '#1e293b',
      isBrick: true,
      isShop: true,
    },
    {
      x: -26,
      z: 16,
      rotY: Math.PI / 2,
      wallColor: '#e2e8f0',
      roofColor: '#7c2d12',
      isBrick: false,
      isShop: false,
    },
    {
      x: -28,
      z: 44,
      rotY: Math.PI / 2,
      wallColor: '#0284c7',
      roofColor: '#334155',
      isBrick: false,
      isShop: false,
    },

    // Right Side Roadside Houses (Facing the road westward)
    {
      x: 26,
      z: -44,
      rotY: -Math.PI / 2,
      wallColor: '#991b1b',
      roofColor: '#334155',
      isBrick: true,
      isShop: false,
    },
    {
      x: 27,
      z: -16,
      rotY: -Math.PI / 2,
      wallColor: '#15803d',
      roofColor: '#1e293b',
      isBrick: false,
      isShop: false,
    },
    {
      x: 26,
      z: 14,
      rotY: -Math.PI / 2,
      wallColor: '#d97706',
      roofColor: '#475569',
      isBrick: false,
      isShop: true,
    },
    {
      x: 27,
      z: 42,
      rotY: -Math.PI / 2,
      wallColor: '#f8fafc',
      roofColor: '#7f1d1d',
      isBrick: false,
      isShop: false,
    },

    // Background Houses (Distant neighborhood depth)
    {
      x: -48,
      z: -28,
      rotY: Math.PI / 3,
      wallColor: '#cbd5e1',
      roofColor: '#334155',
      isBrick: false,
      isShop: false,
    },
    {
      x: -50,
      z: 28,
      rotY: Math.PI / 4,
      wallColor: '#e2e8f0',
      roofColor: '#991b1b',
      isBrick: false,
      isShop: false,
    },
    {
      x: 48,
      z: -26,
      rotY: -Math.PI / 3,
      wallColor: '#b45309',
      roofColor: '#1e293b',
      isBrick: true,
      isShop: false,
    },
    {
      x: 50,
      z: 26,
      rotY: -Math.PI / 4,
      wallColor: '#f1f5f9',
      roofColor: '#475569',
      isBrick: false,
      isShop: false,
    },
  ];

  houseConfigurations.forEach((hc) => {
    const { houseGroup, colliders: houseCols } = createDetailedRoadsideHouse({
      wallColor: hc.wallColor,
      roofColor: hc.roofColor,
      isBrick: hc.isBrick,
      isShop: hc.isShop,
    });
    houseGroup.position.set(hc.x, 0, hc.z);
    houseGroup.rotation.y = hc.rotY;
    group.add(houseGroup);

    // Add house colliders
    houseCols.forEach((box) => {
      const worldBox = box.clone();
      worldBox.translate(new THREE.Vector3(hc.x, 0, hc.z));
      colliders.push(worldBox);
    });

    // Add white picket fences along the front of the houses
    const fence = createPicketFence(9);
    fence.position.set(
      hc.x + (hc.rotY > 0 ? 9 : -9),
      0,
      hc.z - 4.5
    );
    fence.rotation.y = hc.rotY;
    group.add(fence);

    // Stone Garden Walkway leading from sidewalk to house porch
    const walkGeo = new THREE.BoxGeometry(2.0, 0.05, 5.5);
    const walkMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 });
    const walkway = new THREE.Mesh(walkGeo, walkMat);
    walkway.position.set(
      hc.x + (hc.rotY > 0 ? 5.5 : -5.5),
      0.06,
      hc.z
    );
    walkway.rotation.y = hc.rotY;
    walkway.receiveShadow = true;
    group.add(walkway);
  });

  // --- 6. Natural 3D Trees ("tree natural type ko purai detailing ma") ---
  const barkMat = new THREE.MeshStandardMaterial({
    map: createBarkTexture(),
    roughness: 0.9,
    metalness: 0.1,
  });

  // Rhythmic Roadside Trees lining both sides of the sidewalk
  const roadsideTreeZ = [-52, -36, -20, -4, 12, 28, 44, 58];
  roadsideTreeZ.forEach((tz, idx) => {
    // Left verge tree
    const oakLeft = createSculptedOakTree(barkMat, 0.95 + (idx % 3) * 0.15, isDarkRealm);
    oakLeft.position.set(-16.5, 0, tz + ((idx % 2) * 2 - 1));
    group.add(oakLeft);

    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(-16.5, 2, tz),
      new THREE.Vector3(1.0, 4, 1.0)
    ));

    // Right verge tree
    const treeRight = (idx % 2 === 0)
      ? createSculptedOakTree(barkMat, 1.0 + (idx % 2) * 0.2, isDarkRealm)
      : createSculptedPineTree(barkMat, 1.05 + (idx % 2) * 0.15, isDarkRealm);
    treeRight.position.set(16.5, 0, tz - ((idx % 2) * 2 - 1));
    group.add(treeRight);

    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(16.5, 2, tz),
      new THREE.Vector3(1.0, 4, 1.0)
    ));
  });

  // Garden Trees & Background Woodland Groves
  const groveCoords = [
    [-38, -48], [-44, -36], [-38, -2], [-42, 14], [-38, 38], [-45, 52],
    [38, -46], [44, -34], [38, -6], [42, 16], [38, 36], [45, 54],
    [-18, -60], [18, -60], [-18, 60], [18, 60],
  ];

  groveCoords.forEach(([gx, gz], idx) => {
    const isPine = idx % 3 === 0;
    const tree = isPine
      ? createSculptedPineTree(barkMat, 1.1 + (idx % 3) * 0.2, isDarkRealm)
      : createSculptedOakTree(barkMat, 1.0 + (idx % 4) * 0.2, isDarkRealm);
    tree.position.set(gx, 0, gz);
    group.add(tree);

    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(gx, 2, gz),
      new THREE.Vector3(1.0, 4, 1.0)
    ));
  });

  // --- 7. Roadside Flowering Bushes & Garden Hedges ---
  const flowerColors = [0xec4899, 0xa855f7, 0xfacc15, 0xef4444, 0x38bdf8];
  for (let b = -48; b <= 48; b += 16) {
    // Left roadside bushes
    const bushL = createGardenBush(flowerColors[Math.abs(b) % flowerColors.length]);
    bushL.position.set(-13.8, 0, b + 6);
    group.add(bushL);

    // Right roadside bushes
    const bushR = createGardenBush(flowerColors[(Math.abs(b) + 2) % flowerColors.length]);
    bushR.position.set(13.8, 0, b - 6);
    group.add(bushR);
  }

  // Natural Mossy Boulders along grass edges
  const rockCoords = [
    [-14.5, -28], [-14.2, 22], [-14.6, 50],
    [14.5, -38], [14.2, 8], [14.4, 46],
  ];
  rockCoords.forEach(([rx, rz], idx) => {
    const rock = createMossyRock(0.7 + (idx % 3) * 0.3);
    rock.position.set(rx, 0.35, rz);
    group.add(rock);
  });

  // --- 8. Authentic Street Lamps along Sidewalks ---
  const lampPositions = [
    [-12.2, -45], [-12.2, -15], [-12.2, 15], [-12.2, 45],
    [12.2, -45], [12.2, -15], [12.2, 15], [12.2, 45],
  ];

  lampPositions.forEach(([lx, lz]) => {
    const lamp = createCurvedStreetLamp(isDarkRealm);
    lamp.position.set(lx, 0, lz);
    lamp.rotation.y = lx > 0 ? -Math.PI / 2 : Math.PI / 2;
    group.add(lamp);

    colliders.push(new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(lx, 2.5, lz),
      new THREE.Vector3(0.5, 5, 0.5)
    ));
  });

  // --- 9. Street Furniture (Benches, Fire Hydrant, Road Signs) ---
  // Park Benches on sidewalks
  const benchL = createRoadsideBench();
  benchL.position.set(-12.5, 0, 0);
  benchL.rotation.y = Math.PI / 2;
  group.add(benchL);

  const benchR = createRoadsideBench();
  benchR.position.set(12.5, 0, 0);
  benchR.rotation.y = -Math.PI / 2;
  group.add(benchR);

  // Fire Hydrants near curbs
  const hydrant1 = createFireHydrant();
  hydrant1.position.set(-11.8, 0, -25);
  group.add(hydrant1);

  const hydrant2 = createFireHydrant();
  hydrant2.position.set(11.8, 0, 25);
  group.add(hydrant2);

  // Road Signs
  const sign1 = createRoadSign('speed');
  sign1.position.set(12.2, 0, -32);
  sign1.rotation.y = -Math.PI / 2;
  group.add(sign1);

  const sign2 = createRoadSign('crosswalk');
  sign2.position.set(-12.2, 0, 8);
  sign2.rotation.y = Math.PI / 2;
  group.add(sign2);

  // --- 10. Atmospheric Floating Dust / Leaves / Embers ---
  const pCount = isDarkRealm ? 350 : 200;
  const pGeo = new THREE.BufferGeometry();
  const pPositions = new Float32Array(pCount * 3);

  for (let i = 0; i < pCount * 3; i += 3) {
    pPositions[i] = (Math.random() - 0.5) * 80;
    pPositions[i + 1] = Math.random() * 12 + 0.5;
    pPositions[i + 2] = (Math.random() - 0.5) * 80;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

  const pMat = new THREE.PointsMaterial({
    color: isDarkRealm ? 0xff2233 : 0x86efac,
    size: isDarkRealm ? 0.32 : 0.22,
    transparent: true,
    opacity: 0.65,
    blending: isDarkRealm ? THREE.AdditiveBlending : THREE.NormalBlending,
  });

  const pPoints = new THREE.Points(pGeo, pMat);
  group.add(pPoints);
  particles.push(pPoints);

  // Update loop
  const update = (dt: number) => {
    const pos = pGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length; i += 3) {
      // Gentle wind sway and slow descent
      pos[i] += Math.sin(Date.now() * 0.001 + pos[i + 2]) * dt * 0.5;
      pos[i + 1] -= dt * 0.4;
      if (pos[i + 1] < 0.2) {
        pos[i + 1] = 12;
      }
    }
    pGeo.attributes.position.needsUpdate = true;
  };

  // Safe and clean resource disposal
  const destroy = () => {
    scene.remove(group);
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
      }
    });
  };

  return { scene, group, colliders, particles, update, destroy };
}
