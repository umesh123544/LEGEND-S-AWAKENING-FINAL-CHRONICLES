import * as THREE from 'three';

export interface WorldProps {
  scene: THREE.Scene;
  colliders: THREE.Box3[];
  particles: THREE.Points[];
}

export function buildEnvironment(scene: THREE.Scene, chapterId: number): WorldProps {
  const colliders: THREE.Box3[] = [];
  const particles: THREE.Points[] = [];

  const isDarkRealm = chapterId >= 4;

  // Floor Grid & Platform
  const floorSize = 120;
  const floorGeo = new THREE.PlaneGeometry(floorSize, floorSize, 32, 32);
  floorGeo.rotateX(-Math.PI / 2);

  // Procedural canvas grid texture
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = isDarkRealm ? '#120508' : '#08111d';
  ctx.fillRect(0, 0, 512, 512);

  // Grid lines
  ctx.strokeStyle = isDarkRealm ? 'rgba(255, 30, 60, 0.4)' : 'rgba(0, 229, 255, 0.4)';
  ctx.lineWidth = 2;
  const step = 64;
  for (let x = 0; x <= 512; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Inner accents
  ctx.fillStyle = isDarkRealm ? 'rgba(255, 0, 40, 0.15)' : 'rgba(0, 240, 255, 0.15)';
  ctx.fillRect(16, 16, 32, 32);
  ctx.fillRect(512 - 48, 16, 32, 32);
  ctx.fillRect(16, 512 - 48, 32, 32);
  ctx.fillRect(512 - 48, 512 - 48, 32, 32);

  const floorTex = new THREE.CanvasTexture(canvas);
  floorTex.wrapS = THREE.RepeatWrapping;
  floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(15, 15);

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.3,
    metalness: 0.7,
  });

  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.receiveShadow = true;
  scene.add(floor);

  // Outer boundary walls
  const wallMat = new THREE.MeshStandardMaterial({
    color: isDarkRealm ? 0x1f080c : 0x0f2238,
    metalness: 0.8,
    roughness: 0.3,
  });

  const wallHeight = 8;
  const halfSize = floorSize / 2;

  const createWall = (x: number, z: number, w: number, d: number) => {
    const wallGeo = new THREE.BoxGeometry(w, wallHeight, d);
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(x, wallHeight / 2, z);
    wall.receiveShadow = true;
    wall.castShadow = true;
    scene.add(wall);

    const box = new THREE.Box3().setFromObject(wall);
    colliders.push(box);
  };

  createWall(0, -halfSize, floorSize, 2);
  createWall(0, halfSize, floorSize, 2);
  createWall(-halfSize, 0, 2, floorSize);
  createWall(halfSize, 0, 2, floorSize);

  // Sci-fi Pillars / Obelisks
  const pillarCount = 8;
  const radius = 28;
  const glowMat = new THREE.MeshStandardMaterial({
    color: isDarkRealm ? 0xff0033 : 0x00f0ff,
    emissive: isDarkRealm ? 0xff0022 : 0x00f0ff,
    emissiveIntensity: 2.5,
  });

  for (let i = 0; i < pillarCount; i++) {
    const angle = (i / pillarCount) * Math.PI * 2;
    const px = Math.cos(angle) * radius;
    const pz = Math.sin(angle) * radius;

    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(px, 0, pz);

    // Main pillar column
    const pillarGeo = new THREE.CylinderGeometry(0.8, 1.2, 7, 8);
    const pillarMesh = new THREE.Mesh(pillarGeo, wallMat);
    pillarMesh.position.y = 3.5;
    pillarMesh.castShadow = true;
    pillarMesh.receiveShadow = true;
    pillarGroup.add(pillarMesh);

    // Glowing energy ring around pillar
    const ringGeo = new THREE.TorusGeometry(1.2, 0.12, 8, 16);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, glowMat);
    ring.position.y = 3.5;
    pillarGroup.add(ring);

    // Light source
    const pLight = new THREE.PointLight(isDarkRealm ? 0xff2244 : 0x00e5ff, 2.5, 16);
    pLight.position.y = 4;
    pillarGroup.add(pLight);

    scene.add(pillarGroup);

    const box = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(px, 3.5, pz),
      new THREE.Vector3(2.5, 7, 2.5)
    );
    colliders.push(box);
  }

  // Futuristic City Skyline in background (if not dark realm)
  if (!isDarkRealm) {
    const bldgMat = new THREE.MeshBasicMaterial({ color: 0x051329 });
    for (let b = 0; b < 24; b++) {
      const bAngle = (b / 24) * Math.PI * 2;
      const bDist = 65 + (b % 3) * 15;
      const bx = Math.cos(bAngle) * bDist;
      const bz = Math.sin(bAngle) * bDist;
      const bWidth = 6 + (b % 4) * 4;
      const bHeight = 25 + (b % 5) * 18;

      const bldgGeo = new THREE.BoxGeometry(bWidth, bHeight, bWidth);
      const bldg = new THREE.Mesh(bldgGeo, bldgMat);
      bldg.position.set(bx, bHeight / 2 - 2, bz);
      scene.add(bldg);

      // Neon strip on buildings
      if (b % 2 === 0) {
        const stripGeo = new THREE.BoxGeometry(0.3, bHeight * 0.7, 0.3);
        const strip = new THREE.Mesh(stripGeo, glowMat);
        strip.position.set(bx, bHeight / 2, bz);
        scene.add(strip);
      }
    }
  } else {
    // Dark Spikes / Crags in Dark Realm
    const cragMat = new THREE.MeshStandardMaterial({ color: 0x140608, roughness: 0.9 });
    for (let c = 0; c < 18; c++) {
      const cAngle = (c / 18) * Math.PI * 2;
      const cx = Math.cos(cAngle) * 55;
      const cz = Math.sin(cAngle) * 55;
      const cHeight = 15 + (c % 4) * 12;

      const cragGeo = new THREE.ConeGeometry(3.5, cHeight, 5);
      const crag = new THREE.Mesh(cragGeo, cragMat);
      crag.position.set(cx, cHeight / 2, cz);
      scene.add(crag);
    }
  }

  // Floating Atmosphere Particles
  const pCount = 350;
  const pGeo = new THREE.BufferGeometry();
  const pPositions = new Float32Array(pCount * 3);

  for (let i = 0; i < pCount * 3; i += 3) {
    pPositions[i] = (Math.random() - 0.5) * 80;
    pPositions[i + 1] = Math.random() * 14 + 0.5;
    pPositions[i + 2] = (Math.random() - 0.5) * 80;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

  const pMat = new THREE.PointsMaterial({
    color: isDarkRealm ? 0xff2244 : 0x00f7ff,
    size: 0.25,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
  });

  const pPoints = new THREE.Points(pGeo, pMat);
  scene.add(pPoints);
  particles.push(pPoints);

  return { scene, colliders, particles };
}
