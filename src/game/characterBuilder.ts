import * as THREE from 'three';

// Procedural texture generators for futuristic sci-fi materials
function createHexShieldTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Transparent dark cyan background
  ctx.fillStyle = 'rgba(0, 20, 30, 0.2)';
  ctx.fillRect(0, 0, 512, 512);

  // Draw glowing concentric rings
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#00f7ff';
  ctx.shadowBlur = 12;

  ctx.beginPath();
  ctx.arc(256, 256, 120, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(256, 256, 200, 0, Math.PI * 2);
  ctx.stroke();

  // Hexagonal grid
  const hexSize = 28;
  const h = hexSize * Math.sqrt(3);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';

  for (let y = 0; y < 512 + h; y += h) {
    let row = 0;
    for (let x = 0; x < 512 + hexSize * 3; x += hexSize * 3) {
      const cx = x + (row % 2 ? hexSize * 1.5 : 0);
      const cy = y;

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = cx + hexSize * Math.cos(angle);
        const hy = cy + hexSize * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
      row++;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export interface CharacterRig {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  weapon: THREE.Group;
  shield?: THREE.Group;
  coreMesh?: THREE.Mesh;
  swordGlow?: THREE.Mesh;
  shieldGlow?: THREE.Mesh;
  animTime: number;
  isHero: boolean;
}

/**
 * Builds the Futuristic Blue/Cyan Powered Armor Hero
 */
export function createHeroCharacter(): CharacterRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // Materials
  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a5f, // Deep futuristic cobalt navy
    metalness: 0.85,
    roughness: 0.25,
  });

  const secondaryArmorMat = new THREE.MeshStandardMaterial({
    color: 0x0c1b2e,
    metalness: 0.9,
    roughness: 0.3,
  });

  const cyanGlowMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 2.2,
    roughness: 0.1,
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00e5ff,
    emissiveIntensity: 3.0,
    roughness: 0.1,
  });

  // Pelvis & Torso
  const torsoGroup = new THREE.Group();
  body.add(torsoGroup);

  // Lower abdomen
  const abdomenGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.45, 8);
  const abdomen = new THREE.Mesh(abdomenGeo, secondaryArmorMat);
  abdomen.position.y = 1.05;
  abdomen.castShadow = true;
  torsoGroup.add(abdomen);

  // Chest armor plate
  const chestGeo = new THREE.BoxGeometry(0.68, 0.58, 0.42);
  const chest = new THREE.Mesh(chestGeo, armorMat);
  chest.position.y = 1.48;
  chest.castShadow = true;
  torsoGroup.add(chest);

  // Glowing Cyan AURA Chest Core
  const coreGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
  coreGeo.rotateX(Math.PI / 2);
  const coreMesh = new THREE.Mesh(coreGeo, cyanGlowMat);
  coreMesh.position.set(0, 1.52, 0.22);
  torsoGroup.add(coreMesh);

  // Chest armor accents
  const chestAccentGeo = new THREE.BoxGeometry(0.55, 0.06, 0.44);
  const chestAccent = new THREE.Mesh(chestAccentGeo, cyanGlowMat);
  chestAccent.position.set(0, 1.35, 0.01);
  torsoGroup.add(chestAccent);

  // Head & Visor
  const head = new THREE.Group();
  head.position.set(0, 1.88, 0);
  torsoGroup.add(head);

  const helmetGeo = new THREE.BoxGeometry(0.32, 0.36, 0.34);
  const helmet = new THREE.Mesh(helmetGeo, armorMat);
  helmet.castShadow = true;
  head.add(helmet);

  const visorGeo = new THREE.BoxGeometry(0.28, 0.1, 0.36);
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 0.04, 0.03);
  head.add(visor);

  // Shoulders & Arms
  // Left Arm (Shield arm)
  const leftArm = new THREE.Group();
  leftArm.position.set(0.48, 1.62, 0);
  body.add(leftArm);

  const lShoulderGeo = new THREE.SphereGeometry(0.18, 8, 8);
  const lShoulder = new THREE.Mesh(lShoulderGeo, armorMat);
  lShoulder.castShadow = true;
  leftArm.add(lShoulder);

  const lUpperArmGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.38, 8);
  const lUpperArm = new THREE.Mesh(lUpperArmGeo, secondaryArmorMat);
  lUpperArm.position.y = -0.22;
  lUpperArm.castShadow = true;
  leftArm.add(lUpperArm);

  const lForearmGroup = new THREE.Group();
  lForearmGroup.position.set(0, -0.42, 0);
  leftArm.add(lForearmGroup);

  const lForearmGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.36, 8);
  const lForearm = new THREE.Mesh(lForearmGeo, armorMat);
  lForearm.position.y = -0.18;
  lForearm.castShadow = true;
  lForearmGroup.add(lForearm);

  // Holographic Energy Shield on Left Forearm
  const shield = new THREE.Group();
  shield.position.set(0.15, -0.18, 0.2);
  shield.rotation.y = Math.PI / 4;
  lForearmGroup.add(shield);

  // Shield emitter ring
  const emitterGeo = new THREE.TorusGeometry(0.14, 0.03, 8, 16);
  const emitter = new THREE.Mesh(emitterGeo, cyanGlowMat);
  shield.add(emitter);

  // Holographic Hex Barrier (Semi-transparent with glowing hex texture)
  const hexTexture = createHexShieldTexture();
  const shieldBarrierGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.04, 6);
  shieldBarrierGeo.rotateX(Math.PI / 2);
  const shieldMat = new THREE.MeshStandardMaterial({
    map: hexTexture,
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 1.8,
    transparent: true,
    opacity: 0.85,
    roughness: 0.1,
    side: THREE.DoubleSide,
  });
  const shieldMesh = new THREE.Mesh(shieldBarrierGeo, shieldMat);
  shield.add(shieldMesh);
  shield.scale.set(0, 0, 0); // hidden until blocking

  // Right Arm (Weapon arm)
  const rightArm = new THREE.Group();
  rightArm.position.set(-0.48, 1.62, 0);
  body.add(rightArm);

  const rShoulderGeo = new THREE.SphereGeometry(0.18, 8, 8);
  const rShoulder = new THREE.Mesh(rShoulderGeo, armorMat);
  rShoulder.castShadow = true;
  rightArm.add(rShoulder);

  const rUpperArmGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.38, 8);
  const rUpperArm = new THREE.Mesh(rUpperArmGeo, secondaryArmorMat);
  rUpperArm.position.y = -0.22;
  rUpperArm.castShadow = true;
  rightArm.add(rUpperArm);

  const rForearmGroup = new THREE.Group();
  rForearmGroup.position.set(0, -0.42, 0);
  rightArm.add(rForearmGroup);

  const rForearmGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.36, 8);
  const rForearm = new THREE.Mesh(rForearmGeo, armorMat);
  rForearm.position.y = -0.18;
  rForearm.castShadow = true;
  rForearmGroup.add(rForearm);

  // Energy Sword in Right Hand
  const weapon = new THREE.Group();
  weapon.position.set(0, -0.38, 0.12);
  weapon.rotation.x = Math.PI / 2;
  rForearmGroup.add(weapon);

  // Hilt
  const hiltGeo = new THREE.CylinderGeometry(0.04, 0.045, 0.28, 8);
  const hilt = new THREE.Mesh(hiltGeo, secondaryArmorMat);
  weapon.add(hilt);

  // Crossguard
  const guardGeo = new THREE.BoxGeometry(0.26, 0.05, 0.1);
  const guard = new THREE.Mesh(guardGeo, armorMat);
  guard.position.y = 0.14;
  weapon.add(guard);

  // Glowing Plasma Blade (Energy sword)
  const bladeCoreGeo = new THREE.BoxGeometry(0.1, 1.3, 0.02);
  const bladeCore = new THREE.Mesh(bladeCoreGeo, cyanGlowMat);
  bladeCore.position.y = 0.82;
  weapon.add(bladeCore);

  const bladeAuraGeo = new THREE.BoxGeometry(0.15, 1.32, 0.04);
  const bladeAuraMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 2.8,
    transparent: true,
    opacity: 0.65,
  });
  const bladeAura = new THREE.Mesh(bladeAuraGeo, bladeAuraMat);
  bladeAura.position.y = 0.82;
  weapon.add(bladeAura);

  // Legs
  const leftLeg = new THREE.Group();
  leftLeg.position.set(0.2, 0.85, 0);
  body.add(leftLeg);

  const lThighGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.44, 8);
  const lThigh = new THREE.Mesh(lThighGeo, armorMat);
  lThigh.position.y = -0.22;
  lThigh.castShadow = true;
  leftLeg.add(lThigh);

  const lShinGeo = new THREE.CylinderGeometry(0.1, 0.11, 0.44, 8);
  const lShin = new THREE.Mesh(lShinGeo, secondaryArmorMat);
  lShin.position.y = -0.66;
  lShin.castShadow = true;
  leftLeg.add(lShin);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(-0.2, 0.85, 0);
  body.add(rightLeg);

  const rThighGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.44, 8);
  const rThigh = new THREE.Mesh(rThighGeo, armorMat);
  rThigh.position.y = -0.22;
  rThigh.castShadow = true;
  rightLeg.add(rThigh);

  const rShinGeo = new THREE.CylinderGeometry(0.1, 0.11, 0.44, 8);
  const rShin = new THREE.Mesh(rShinGeo, secondaryArmorMat);
  rShin.position.y = -0.66;
  rShin.castShadow = true;
  rightLeg.add(rShin);

  return {
    root,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    weapon,
    shield,
    coreMesh,
    swordGlow: bladeAura,
    shieldGlow: shieldMesh,
    animTime: 0,
    isHero: true,
  };
}

/**
 * Builds THE DREAD LORD (The Final Boss Villain from prompt & reference image)
 */
export function createDreadLordCharacter(): CharacterRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // Scale up for intimidating final boss presence
  root.scale.set(1.45, 1.45, 1.45);

  // Materials
  const darkPlateMat = new THREE.MeshStandardMaterial({
    color: 0x1f0b0e, // Demonic crimson-tinted obsidian
    metalness: 0.9,
    roughness: 0.35,
  });

  const bloodArmorMat = new THREE.MeshStandardMaterial({
    color: 0x470e17,
    metalness: 0.85,
    roughness: 0.3,
  });

  const redCoreMat = new THREE.MeshStandardMaterial({
    color: 0xff0033,
    emissive: 0xff0022,
    emissiveIntensity: 3.2,
    roughness: 0.1,
  });

  // Torso
  const torsoGroup = new THREE.Group();
  body.add(torsoGroup);

  const abdomenGeo = new THREE.CylinderGeometry(0.3, 0.26, 0.5, 8);
  const abdomen = new THREE.Mesh(abdomenGeo, darkPlateMat);
  abdomen.position.y = 1.1;
  abdomen.castShadow = true;
  torsoGroup.add(abdomen);

  // Massive Spiked Chest
  const chestGeo = new THREE.BoxGeometry(0.88, 0.7, 0.55);
  const chest = new THREE.Mesh(chestGeo, bloodArmorMat);
  chest.position.y = 1.62;
  chest.castShadow = true;
  torsoGroup.add(chest);

  // Glowing Red Demonic Core
  const coreGeo = new THREE.OctahedronGeometry(0.14, 0);
  const coreMesh = new THREE.Mesh(coreGeo, redCoreMat);
  coreMesh.position.set(0, 1.65, 0.29);
  torsoGroup.add(coreMesh);

  // Spiked Rib plates
  const ribGeo = new THREE.ConeGeometry(0.08, 0.35, 4);
  ribGeo.rotateZ(Math.PI / 3);
  const ribL = new THREE.Mesh(ribGeo, darkPlateMat);
  ribL.position.set(0.48, 1.7, 0.15);
  torsoGroup.add(ribL);

  const ribR = ribL.clone();
  ribR.position.set(-0.48, 1.7, 0.15);
  ribR.rotation.z = -Math.PI / 3;
  torsoGroup.add(ribR);

  // Demonic Head with Horns & Glowing Red Eyes
  const head = new THREE.Group();
  head.position.set(0, 2.1, 0);
  torsoGroup.add(head);

  const helmGeo = new THREE.BoxGeometry(0.4, 0.44, 0.42);
  const helm = new THREE.Mesh(helmGeo, darkPlateMat);
  helm.castShadow = true;
  head.add(helm);

  // Glowing Red Eyes
  const eyeLGeo = new THREE.BoxGeometry(0.09, 0.04, 0.05);
  const eyeL = new THREE.Mesh(eyeLGeo, redCoreMat);
  eyeL.position.set(0.1, 0.05, 0.22);
  head.add(eyeL);

  const eyeR = eyeL.clone();
  eyeR.position.set(-0.1, 0.05, 0.22);
  head.add(eyeR);

  // Massive Curved Horns
  const hornCurveL = new THREE.CurvePath<THREE.Vector3>();
  // Left Horn using cone segments
  const hornL1 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 6), bloodArmorMat);
  hornL1.position.set(0.24, 0.32, -0.05);
  hornL1.rotation.z = -0.5;
  hornL1.rotation.x = -0.2;
  head.add(hornL1);

  const hornL2 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 6), darkPlateMat);
  hornL2.position.set(0.38, 0.62, -0.15);
  hornL2.rotation.z = -0.9;
  hornL2.rotation.x = -0.4;
  head.add(hornL2);

  // Right Horn
  const hornR1 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 6), bloodArmorMat);
  hornR1.position.set(-0.24, 0.32, -0.05);
  hornR1.rotation.z = 0.5;
  hornR1.rotation.x = -0.2;
  head.add(hornR1);

  const hornR2 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 6), darkPlateMat);
  hornR2.position.set(-0.38, 0.62, -0.15);
  hornR2.rotation.z = 0.9;
  hornR2.rotation.x = -0.4;
  head.add(hornR2);

  // Arms
  // Left Arm (Claw/Fist)
  const leftArm = new THREE.Group();
  leftArm.position.set(0.62, 1.8, 0);
  body.add(leftArm);

  const lSpikePad = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 5), darkPlateMat);
  lSpikePad.rotation.z = -Math.PI / 4;
  leftArm.add(lSpikePad);

  const lArmGeo = new THREE.CylinderGeometry(0.15, 0.12, 0.45, 8);
  const lArmMesh = new THREE.Mesh(lArmGeo, bloodArmorMat);
  lArmMesh.position.y = -0.28;
  leftArm.add(lArmMesh);

  // Right Arm (Huge Battle Axe Wielder)
  const rightArm = new THREE.Group();
  rightArm.position.set(-0.62, 1.8, 0);
  body.add(rightArm);

  const rSpikePad = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 5), darkPlateMat);
  rSpikePad.rotation.z = Math.PI / 4;
  rightArm.add(rSpikePad);

  const rArmGeo = new THREE.CylinderGeometry(0.15, 0.12, 0.45, 8);
  const rArmMesh = new THREE.Mesh(rArmGeo, bloodArmorMat);
  rArmMesh.position.y = -0.28;
  rightArm.add(rArmMesh);

  // Huge Dark Fantasy Battle Axe in Hand
  const weapon = new THREE.Group();
  weapon.position.set(0, -0.5, 0.2);
  weapon.rotation.x = Math.PI / 2.3;
  rightArm.add(weapon);

  // Axe Handle / Haft
  const haftGeo = new THREE.CylinderGeometry(0.06, 0.05, 2.3, 8);
  const haft = new THREE.Mesh(haftGeo, darkPlateMat);
  weapon.add(haft);

  // Double Curved Axe Blades
  const bladeGeo = new THREE.BoxGeometry(0.85, 0.65, 0.06);
  const blade = new THREE.Mesh(bladeGeo, bloodArmorMat);
  blade.position.set(0.4, 0.8, 0);
  weapon.add(blade);

  const bladeBackGeo = new THREE.BoxGeometry(0.65, 0.5, 0.06);
  const bladeBack = new THREE.Mesh(bladeBackGeo, bloodArmorMat);
  bladeBack.position.set(-0.35, 0.8, 0);
  weapon.add(bladeBack);

  // Axe glowing rune core
  const axeCoreGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.08, 8);
  axeCoreGeo.rotateX(Math.PI / 2);
  const axeCore = new THREE.Mesh(axeCoreGeo, redCoreMat);
  axeCore.position.set(0, 0.8, 0);
  weapon.add(axeCore);

  // Top Axe Spike
  const topSpikeGeo = new THREE.ConeGeometry(0.1, 0.45, 6);
  const topSpike = new THREE.Mesh(topSpikeGeo, darkPlateMat);
  topSpike.position.y = 1.35;
  weapon.add(topSpike);

  // Legs
  const leftLeg = new THREE.Group();
  leftLeg.position.set(0.28, 0.9, 0);
  body.add(leftLeg);
  const lLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.9, 8), darkPlateMat);
  lLegMesh.position.y = -0.45;
  leftLeg.add(lLegMesh);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(-0.28, 0.9, 0);
  body.add(rightLeg);
  const rLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.9, 8), darkPlateMat);
  rLegMesh.position.y = -0.45;
  rightLeg.add(rLegMesh);

  return {
    root,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    weapon,
    coreMesh,
    animTime: 0,
    isHero: false,
  };
}

/**
 * Builds generic enemy characters (Dark Soldier, Shadow Archer, Dark Guardian)
 */
export function createEnemyMesh(type: string): CharacterRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  let mainColor = 0x221111;
  let glowColor = 0xff2222;
  let scale = 1.0;

  if (type === 'dark_guardian') {
    mainColor = 0x331111;
    scale = 1.25;
  } else if (type === 'shadow_archer') {
    mainColor = 0x151122;
    glowColor = 0xff00cc;
    scale = 0.9;
  } else if (type === 'aura_hunter') {
    mainColor = 0x112222;
    glowColor = 0x00ffcc;
    scale = 0.95;
  }

  root.scale.set(scale, scale, scale);

  const mat = new THREE.MeshStandardMaterial({
    color: mainColor,
    metalness: 0.8,
    roughness: 0.4,
  });

  const glowMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 2.0,
  });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.35), mat);
  torso.position.y = 1.25;
  torso.castShadow = true;
  body.add(torso);

  // Visor
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.28), glowMat);
  visor.position.set(0, 1.7, 0.08);
  body.add(visor);

  // Head
  const head = new THREE.Group();
  head.position.set(0, 1.7, 0);
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.28), mat);
  head.add(headMesh);
  body.add(head);

  // Limbs
  const leftArm = new THREE.Group();
  leftArm.position.set(0.38, 1.4, 0);
  leftArm.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.55, 6), mat));
  body.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(-0.38, 1.4, 0);
  rightArm.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.55, 6), mat));
  body.add(rightArm);

  const weapon = new THREE.Group();
  weapon.position.set(0, -0.3, 0.1);
  rightArm.add(weapon);

  if (type === 'shadow_archer') {
    // Energy Bow
    const bowGeo = new THREE.TorusGeometry(0.35, 0.03, 6, 12, Math.PI);
    const bow = new THREE.Mesh(bowGeo, glowMat);
    bow.rotation.y = Math.PI / 2;
    weapon.add(bow);
  } else {
    // Dark Blade / Mace
    const sword = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.03), glowMat);
    sword.position.y = 0.4;
    weapon.add(sword);
  }

  const leftLeg = new THREE.Group();
  leftLeg.position.set(0.16, 0.8, 0);
  leftLeg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.7, 6), mat));
  body.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(-0.16, 0.8, 0);
  rightLeg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.7, 6), mat));
  body.add(rightLeg);

  return {
    root,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    weapon,
    animTime: 0,
    isHero: false,
  };
}
