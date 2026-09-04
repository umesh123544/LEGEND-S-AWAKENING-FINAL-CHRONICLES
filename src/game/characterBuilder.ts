import * as THREE from 'three';
import { assetManager } from './AssetManager';

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
  isAssetLoaded: boolean;
  assetPath: string;
  mixer?: THREE.AnimationMixer;
  actions?: Record<string, THREE.AnimationAction>;
  currentAction?: string;
  characterType: string;
  silhouetteMesh?: THREE.Group;
}

/**
 * Creates a glowing holographic shield texture with animated concentric rings and hexagonal lattice.
 */
export function createHexShieldTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Transparent cyber backdrop
  ctx.fillStyle = 'rgba(2, 12, 24, 0.25)';
  ctx.fillRect(0, 0, 512, 512);

  // Outer glowing pulse rings
  ctx.strokeStyle = '#00f7ff';
  ctx.lineWidth = 5;
  ctx.shadowColor = '#00f7ff';
  ctx.shadowBlur = 16;

  ctx.beginPath();
  ctx.arc(256, 256, 220, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(256, 256, 140, 0, Math.PI * 2);
  ctx.stroke();

  // Hexagonal honeycomb barrier lines
  const hexSize = 32;
  const h = hexSize * Math.sqrt(3);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';

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

/**
 * Creates a futuristic plasma energy sword weapon attachment.
 */
export function createFuturisticEnergySword(): { weaponGroup: THREE.Group; bladeGlow: THREE.Mesh } {
  const weapon = new THREE.Group();

  // Hilt
  const hiltGeo = new THREE.CylinderGeometry(0.025, 0.035, 0.32, 12);
  const hiltMat = new THREE.MeshStandardMaterial({
    color: 0x081320,
    metalness: 0.95,
    roughness: 0.2,
  });
  const hilt = new THREE.Mesh(hiltGeo, hiltMat);
  weapon.add(hilt);

  // Emitter Crossguard (Angular cyber wings)
  const emitterGroup = new THREE.Group();
  emitterGroup.position.y = 0.16;
  weapon.add(emitterGroup);

  const ringGeo = new THREE.TorusGeometry(0.06, 0.015, 8, 16);
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 3.0,
    roughness: 0.1,
  });
  const emitterRing = new THREE.Mesh(ringGeo, glowMat);
  emitterRing.rotation.x = Math.PI / 2;
  emitterGroup.add(emitterRing);

  // Plasma Katana / Energy Blade (Sleek elongated tapered curve)
  const bladeCoreGeo = new THREE.ConeGeometry(0.045, 1.45, 8);
  bladeCoreGeo.rotateX(Math.PI);
  bladeCoreGeo.translate(0, 0.72, 0);

  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x00e5ff,
    emissiveIntensity: 3.5,
    roughness: 0.05,
  });
  const bladeCore = new THREE.Mesh(bladeCoreGeo, coreMat);
  emitterGroup.add(bladeCore);

  // Outer Plasma Aura Sheath
  const bladeAuraGeo = new THREE.ConeGeometry(0.075, 1.48, 8);
  bladeAuraGeo.rotateX(Math.PI);
  bladeAuraGeo.translate(0, 0.72, 0);

  const auraMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 2.8,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    roughness: 0.1,
  });
  const bladeAura = new THREE.Mesh(bladeAuraGeo, auraMat);
  emitterGroup.add(bladeAura);

  return { weaponGroup: weapon, bladeGlow: bladeAura };
}

/**
 * Creates a holographic energy shield attachment.
 */
export function createHolographicAuraShield(): { shieldGroup: THREE.Group; shieldMesh: THREE.Mesh } {
  const shield = new THREE.Group();

  // Forearm emitter bracket
  const bracketGeo = new THREE.TorusGeometry(0.12, 0.025, 8, 16);
  const bracketMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 2.5,
  });
  const bracket = new THREE.Mesh(bracketGeo, bracketMat);
  shield.add(bracket);

  // Holographic Hexagonal Disc
  const hexTexture = createHexShieldTexture();
  const discGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.02, 6);
  discGeo.rotateX(Math.PI / 2);

  const shieldMat = new THREE.MeshStandardMaterial({
    map: hexTexture,
    color: 0x00f7ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 2.2,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
    roughness: 0.1,
  });

  const shieldMesh = new THREE.Mesh(discGeo, shieldMat);
  shieldMesh.position.z = 0.05;
  shield.add(shieldMesh);

  shield.scale.set(0, 0, 0); // Initially collapsed until blocking
  return { shieldGroup: shield, shieldMesh };
}

/**
 * Creates the demonic Dread Axe weapon.
 */
export function createDreadAxe(): { axeGroup: THREE.Group; axeCore: THREE.Mesh } {
  const axe = new THREE.Group();

  // Dark obsidian haft with spine rings
  const haftGeo = new THREE.CylinderGeometry(0.04, 0.035, 2.4, 12);
  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x12080a,
    metalness: 0.9,
    roughness: 0.35,
  });
  const haft = new THREE.Mesh(haftGeo, darkMetal);
  axe.add(haft);

  // Double crescent demonic axe head
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.85;
  axe.add(headGroup);

  const crimsonMat = new THREE.MeshStandardMaterial({
    color: 0x4a0b14,
    metalness: 0.85,
    roughness: 0.25,
  });

  const redRuneMat = new THREE.MeshStandardMaterial({
    color: 0xff0033,
    emissive: 0xff0022,
    emissiveIntensity: 3.5,
  });

  // Curved Crescent Blade Left
  const bladeLGeo = new THREE.TorusGeometry(0.48, 0.12, 6, 16, Math.PI * 0.9);
  const bladeL = new THREE.Mesh(bladeLGeo, crimsonMat);
  bladeL.position.x = 0.35;
  bladeL.rotation.z = -Math.PI / 2;
  headGroup.add(bladeL);

  // Curved Crescent Blade Right
  const bladeRGeo = new THREE.TorusGeometry(0.38, 0.09, 6, 16, Math.PI * 0.9);
  const bladeR = new THREE.Mesh(bladeRGeo, crimsonMat);
  bladeR.position.x = -0.3;
  bladeR.rotation.z = Math.PI / 2;
  headGroup.add(bladeR);

  // Central Glowing Rune Core
  const coreGeo = new THREE.OctahedronGeometry(0.12, 0);
  const axeCore = new THREE.Mesh(coreGeo, redRuneMat);
  headGroup.add(axeCore);

  // Top Spire Piercer
  const spireGeo = new THREE.ConeGeometry(0.08, 0.5, 6);
  const spire = new THREE.Mesh(spireGeo, darkMetal);
  spire.position.y = 0.4;
  headGroup.add(spire);

  return { axeGroup: axe, axeCore };
}

/**
 * Builds a realistic anatomical cyber-silhouette mannequin for the Hero.
 * (Used while GLB is loading or as a high-fidelity graceful fallback — NO BOXES!)
 */
function buildSculptedHeroSilhouette(): {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  coreMesh: THREE.Mesh;
} {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // Metallic cobalt exoskeleton material with Fresnel-style rim reflections
  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x142b47,
    metalness: 0.92,
    roughness: 0.22,
  });

  const undersuitMat = new THREE.MeshStandardMaterial({
    color: 0x07111c,
    metalness: 0.7,
    roughness: 0.45,
  });

  const cyanEnergyMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 2.8,
    roughness: 0.1,
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x22ffff,
    emissive: 0x00e5ff,
    emissiveIntensity: 3.5,
    roughness: 0.05,
  });

  // --- Pelvis & Contoured Torso ---
  const pelvisGeo = new THREE.SphereGeometry(0.24, 12, 12);
  pelvisGeo.scale(1, 0.75, 0.85);
  const pelvis = new THREE.Mesh(pelvisGeo, undersuitMat);
  pelvis.position.y = 0.95;
  body.add(pelvis);

  // Contoured Chest & Ribcage (Curved aerodynamic armor shell)
  const chestGroup = new THREE.Group();
  chestGroup.position.y = 1.38;
  body.add(chestGroup);

  const chestGeo = new THREE.CapsuleGeometry(0.28, 0.32, 8, 16);
  chestGeo.scale(1.18, 1, 0.82);
  const chest = new THREE.Mesh(chestGeo, armorMat);
  chest.castShadow = true;
  chestGroup.add(chest);

  // Armored Pectoral & Lat Plates
  const pecGeo = new THREE.SphereGeometry(0.18, 10, 10);
  pecGeo.scale(1.1, 0.7, 0.6);
  const pecL = new THREE.Mesh(pecGeo, armorMat);
  pecL.position.set(0.12, 0.08, 0.14);
  chestGroup.add(pecL);

  const pecR = pecL.clone();
  pecR.position.x = -0.12;
  chestGroup.add(pecR);

  // Glowing Cyan AURA Arc Reactor Core
  const coreGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.04, 16);
  coreGeo.rotateX(Math.PI / 2);
  const coreMesh = new THREE.Mesh(coreGeo, cyanEnergyMat);
  coreMesh.position.set(0, 0.06, 0.22);
  chestGroup.add(coreMesh);

  // --- Helmet with Futuristic Visor ---
  const head = new THREE.Group();
  head.position.set(0, 1.82, 0);
  body.add(head);

  const helmetGeo = new THREE.SphereGeometry(0.18, 16, 16);
  helmetGeo.scale(0.9, 1.15, 1.05);
  const helmet = new THREE.Mesh(helmetGeo, armorMat);
  helmet.castShadow = true;
  head.add(helmet);

  // Curved Futuristic Visor Plate
  const visorGeo = new THREE.SphereGeometry(0.14, 12, 12, 0, Math.PI);
  visorGeo.scale(0.95, 0.45, 0.7);
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 0.02, 0.08);
  head.add(visor);

  // --- Shoulders & Athletic Arms ---
  // Left Arm
  const leftArm = new THREE.Group();
  leftArm.position.set(0.42, 1.52, 0);
  body.add(leftArm);

  const pauldronGeo = new THREE.SphereGeometry(0.15, 12, 12);
  pauldronGeo.scale(1, 0.85, 1.1);
  const pauldronL = new THREE.Mesh(pauldronGeo, armorMat);
  leftArm.add(pauldronL);

  const upperArmGeo = new THREE.CapsuleGeometry(0.075, 0.26, 6, 12);
  const upperArmL = new THREE.Mesh(upperArmGeo, undersuitMat);
  upperArmL.position.y = -0.22;
  leftArm.add(upperArmL);

  const forearmLGroup = new THREE.Group();
  forearmLGroup.position.set(0, -0.42, 0);
  leftArm.add(forearmLGroup);

  const forearmGeo = new THREE.CapsuleGeometry(0.07, 0.28, 6, 12);
  const forearmL = new THREE.Mesh(forearmGeo, armorMat);
  forearmL.position.y = -0.16;
  forearmLGroup.add(forearmL);

  // Right Arm
  const rightArm = new THREE.Group();
  rightArm.position.set(-0.42, 1.52, 0);
  body.add(rightArm);

  const pauldronR = new THREE.Mesh(pauldronGeo, armorMat);
  rightArm.add(pauldronR);

  const upperArmR = new THREE.Mesh(upperArmGeo, undersuitMat);
  upperArmR.position.y = -0.22;
  rightArm.add(upperArmR);

  const forearmRGroup = new THREE.Group();
  forearmRGroup.position.set(0, -0.42, 0);
  rightArm.add(forearmRGroup);

  const forearmR = new THREE.Mesh(forearmGeo, armorMat);
  forearmR.position.y = -0.16;
  forearmRGroup.add(forearmR);

  // --- Legs with Athletic Kinetic Greaves ---
  const thighGeo = new THREE.CapsuleGeometry(0.095, 0.38, 6, 12);
  const shinGeo = new THREE.CapsuleGeometry(0.085, 0.38, 6, 12);

  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(0.18, 0.88, 0);
  body.add(leftLeg);

  const thighL = new THREE.Mesh(thighGeo, armorMat);
  thighL.position.y = -0.24;
  leftLeg.add(thighL);

  const shinL = new THREE.Mesh(shinGeo, undersuitMat);
  shinL.position.y = -0.68;
  leftLeg.add(shinL);

  // Boot
  const bootGeo = new THREE.CapsuleGeometry(0.08, 0.16, 6, 10);
  bootGeo.rotateX(Math.PI / 2);
  const bootL = new THREE.Mesh(bootGeo, armorMat);
  bootL.position.set(0, -0.88, 0.05);
  leftLeg.add(bootL);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(-0.18, 0.88, 0);
  body.add(rightLeg);

  const thighR = new THREE.Mesh(thighGeo, armorMat);
  thighR.position.y = -0.24;
  rightLeg.add(thighR);

  const shinR = new THREE.Mesh(shinGeo, undersuitMat);
  shinR.position.y = -0.68;
  rightLeg.add(shinR);

  const bootR = new THREE.Mesh(bootGeo, armorMat);
  bootR.position.set(0, -0.88, 0.05);
  rightLeg.add(bootR);

  return { root, body, head, leftArm, rightArm, leftLeg, rightLeg, coreMesh };
}

/**
 * Builds a realistic demonic villain silhouette for THE DREAD LORD.
 * (NO BOXES! Sculpted muscular dark fantasy armor with sweeping horns & red core.)
 */
function buildSculptedDreadLordSilhouette(): {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  coreMesh: THREE.Mesh;
} {
  const root = new THREE.Group();
  root.scale.set(1.48, 1.48, 1.48); // Imposing boss stature

  const body = new THREE.Group();
  root.add(body);

  const darkObsidianMat = new THREE.MeshStandardMaterial({
    color: 0x18090d,
    metalness: 0.95,
    roughness: 0.28,
  });

  const bloodArmorMat = new THREE.MeshStandardMaterial({
    color: 0x3d0b13,
    metalness: 0.85,
    roughness: 0.32,
  });

  const demonicRuneMat = new THREE.MeshStandardMaterial({
    color: 0xff002b,
    emissive: 0xff0022,
    emissiveIntensity: 3.5,
    roughness: 0.1,
  });

  // Broad Demonic Torso
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 1.45;
  body.add(torsoGroup);

  const torsoGeo = new THREE.CapsuleGeometry(0.38, 0.44, 8, 16);
  torsoGeo.scale(1.25, 1, 0.9);
  const torsoMesh = new THREE.Mesh(torsoGeo, darkObsidianMat);
  torsoMesh.castShadow = true;
  torsoGroup.add(torsoMesh);

  // Glowing Abyssal Core
  const coreGeo = new THREE.OctahedronGeometry(0.14, 0);
  const coreMesh = new THREE.Mesh(coreGeo, demonicRuneMat);
  coreMesh.position.set(0, 0.08, 0.34);
  torsoGroup.add(coreMesh);

  // --- Demonic Helmet & Sweeping Horns ---
  const head = new THREE.Group();
  head.position.set(0, 2.05, 0);
  body.add(head);

  const helmGeo = new THREE.SphereGeometry(0.24, 16, 16);
  helmGeo.scale(0.9, 1.15, 1.05);
  const helm = new THREE.Mesh(helmGeo, darkObsidianMat);
  head.add(helm);

  // Glowing Slit Eyes
  const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
  eyeGeo.scale(1.8, 0.4, 0.8);
  const eyeL = new THREE.Mesh(eyeGeo, demonicRuneMat);
  eyeL.position.set(0.09, 0.04, 0.21);
  head.add(eyeL);

  const eyeR = eyeL.clone();
  eyeR.position.x = -0.09;
  head.add(eyeR);

  // Large Sweeping Curved Horns
  const createHornCurve = (isRight: boolean) => {
    const hornGroup = new THREE.Group();
    const sign = isRight ? -1 : 1;

    // Smooth sweeping cone segments forming majestic curved arc
    const seg1 = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.45, 10), bloodArmorMat);
    seg1.position.set(sign * 0.22, 0.25, -0.05);
    seg1.rotation.z = sign * -0.55;
    seg1.rotation.x = -0.25;
    hornGroup.add(seg1);

    const seg2 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 10), darkObsidianMat);
    seg2.position.set(sign * 0.42, 0.58, -0.18);
    seg2.rotation.z = sign * -0.95;
    seg2.rotation.x = -0.45;
    hornGroup.add(seg2);

    const seg3 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.35, 10), demonicRuneMat);
    seg3.position.set(sign * 0.58, 0.82, -0.28);
    seg3.rotation.z = sign * -1.35;
    seg3.rotation.x = -0.65;
    hornGroup.add(seg3);

    return hornGroup;
  };

  head.add(createHornCurve(false));
  head.add(createHornCurve(true));

  // --- Muscular Spiked Arms ---
  const armGeo = new THREE.CapsuleGeometry(0.12, 0.38, 6, 12);
  const forearmGeo = new THREE.CapsuleGeometry(0.11, 0.36, 6, 12);

  const leftArm = new THREE.Group();
  leftArm.position.set(0.58, 1.68, 0);
  body.add(leftArm);
  leftArm.add(new THREE.Mesh(armGeo, darkObsidianMat));

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.46, 0);
  leftArm.add(leftForearm);
  leftForearm.add(new THREE.Mesh(forearmGeo, bloodArmorMat));

  const rightArm = new THREE.Group();
  rightArm.position.set(-0.58, 1.68, 0);
  body.add(rightArm);
  rightArm.add(new THREE.Mesh(armGeo, darkObsidianMat));

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.46, 0);
  rightArm.add(rightForearm);
  rightForearm.add(new THREE.Mesh(forearmGeo, bloodArmorMat));

  // --- Sturdy Spiked Legs ---
  const legGeo = new THREE.CapsuleGeometry(0.15, 0.46, 6, 12);
  const shinGeo = new THREE.CapsuleGeometry(0.13, 0.46, 6, 12);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(0.26, 0.95, 0);
  body.add(leftLeg);
  leftLeg.add(new THREE.Mesh(legGeo, bloodArmorMat));
  const lShin = new THREE.Mesh(shinGeo, darkObsidianMat);
  lShin.position.y = -0.52;
  leftLeg.add(lShin);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(-0.26, 0.95, 0);
  body.add(rightLeg);
  rightLeg.add(new THREE.Mesh(legGeo, bloodArmorMat));
  const rShin = new THREE.Mesh(shinGeo, darkObsidianMat);
  rShin.position.y = -0.52;
  rightLeg.add(rShin);

  return { root, body, head, leftArm, rightArm, leftLeg, rightLeg, coreMesh };
}

/**
 * Builds organic sculpted silhouettes for standard enemy types (NO BOXES!).
 */
function buildSculptedEnemySilhouette(type: string): {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
} {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  let scale = 1.0;
  let primaryColor = 0x17151a;
  let glowColor = 0xff0044;

  if (type === 'dark_guardian') {
    scale = 1.35;
    primaryColor = 0x240e14;
    glowColor = 0xff2200;
  } else if (type === 'shadow_archer') {
    scale = 0.92;
    primaryColor = 0x110e1c;
    glowColor = 0xcc00ff;
  } else if (type === 'aura_hunter') {
    scale = 0.96;
    primaryColor = 0x091c1a;
    glowColor = 0x00ffcc;
  } else if (type === 'demon_beast') {
    scale = 1.2;
    primaryColor = 0x2e0c12;
    glowColor = 0xff0033;
  }

  root.scale.set(scale, scale, scale);

  const mat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    metalness: 0.88,
    roughness: 0.3,
  });

  const glowMat = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 2.8,
  });

  // Torso
  const torsoGeo = new THREE.CapsuleGeometry(0.24, 0.36, 6, 12);
  const torso = new THREE.Mesh(torsoGeo, mat);
  torso.position.y = 1.25;
  body.add(torso);

  // Head & Visor
  const head = new THREE.Group();
  head.position.set(0, 1.72, 0);
  body.add(head);

  const headGeo = new THREE.SphereGeometry(0.16, 12, 12);
  head.add(new THREE.Mesh(headGeo, mat));

  const visorGeo = new THREE.CapsuleGeometry(0.04, 0.14, 4, 8);
  visorGeo.rotateZ(Math.PI / 2);
  const visor = new THREE.Mesh(visorGeo, glowMat);
  visor.position.set(0, 0.02, 0.13);
  head.add(visor);

  // Limbs
  const armGeo = new THREE.CapsuleGeometry(0.065, 0.44, 4, 10);
  const leftArm = new THREE.Group();
  leftArm.position.set(0.34, 1.45, 0);
  leftArm.add(new THREE.Mesh(armGeo, mat));
  body.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(-0.34, 1.45, 0);
  rightArm.add(new THREE.Mesh(armGeo, mat));
  body.add(rightArm);

  const legGeo = new THREE.CapsuleGeometry(0.08, 0.54, 4, 10);
  const leftLeg = new THREE.Group();
  leftLeg.position.set(0.15, 0.78, 0);
  leftLeg.add(new THREE.Mesh(legGeo, mat));
  body.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(-0.15, 0.78, 0);
  rightLeg.add(new THREE.Mesh(legGeo, mat));
  body.add(rightLeg);

  return { root, body, head, leftArm, rightArm, leftLeg, rightLeg };
}

/**
 * Creates the Hero character rig with asynchronous GLB loader and sleek fallback silhouette.
 */
export function createHeroCharacter(): CharacterRig {
  const assetPath = '/assets/characters/hero.glb';
  const silhouette = buildSculptedHeroSilhouette();
  const { weaponGroup, bladeGlow } = createFuturisticEnergySword();
  const { shieldGroup, shieldMesh } = createHolographicAuraShield();

  // Attach weapons
  silhouette.rightArm.add(weaponGroup);
  weaponGroup.position.set(0, -0.42, 0.14);
  weaponGroup.rotation.x = Math.PI / 2;

  silhouette.leftArm.add(shieldGroup);
  shieldGroup.position.set(0.12, -0.32, 0.15);
  shieldGroup.rotation.y = Math.PI / 4;

  const rig: CharacterRig = {
    root: silhouette.root,
    body: silhouette.body,
    head: silhouette.head,
    leftArm: silhouette.leftArm,
    rightArm: silhouette.rightArm,
    leftLeg: silhouette.leftLeg,
    rightLeg: silhouette.rightLeg,
    weapon: weaponGroup,
    shield: shieldGroup,
    coreMesh: silhouette.coreMesh,
    swordGlow: bladeGlow,
    shieldGlow: shieldMesh,
    animTime: 0,
    isHero: true,
    isAssetLoaded: false,
    assetPath,
    characterType: 'hero',
    silhouetteMesh: silhouette.body,
  };

  // Attempt to load the real hero.glb model
  assetManager.loadGLTF(assetPath).then((gltf) => {
    if (gltf) {
      try {
        const clonedModel = assetManager.cloneScene(gltf);
        // Hide procedural silhouette and mount high-fidelity model
        silhouette.body.visible = false;
        rig.root.add(clonedModel);
        rig.isAssetLoaded = true;

        // Setup AnimationMixer if clips are provided
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(clonedModel);
          const actions: Record<string, THREE.AnimationAction> = {};
          gltf.animations.forEach((clip) => {
            actions[clip.name.toLowerCase()] = mixer.clipAction(clip);
          });
          rig.mixer = mixer;
          rig.actions = actions;

          // Default to idle
          const idleAction = actions['idle'] || Object.values(actions)[0];
          if (idleAction) {
            idleAction.play();
            rig.currentAction = 'idle';
          }
        }
      } catch (err) {
        console.warn('Failed mounting hero.glb model:', err);
      }
    }
  });

  return rig;
}

/**
 * Creates the Dread Lord character rig with asynchronous GLB loader and sleek fallback silhouette.
 */
export function createDreadLordCharacter(): CharacterRig {
  const assetPath = '/assets/characters/dread-lord.glb';
  const silhouette = buildSculptedDreadLordSilhouette();
  const { axeGroup, axeCore } = createDreadAxe();

  // Attach Dread Axe to right arm
  silhouette.rightArm.add(axeGroup);
  axeGroup.position.set(0, -0.5, 0.22);
  axeGroup.rotation.x = Math.PI / 2.3;

  const rig: CharacterRig = {
    root: silhouette.root,
    body: silhouette.body,
    head: silhouette.head,
    leftArm: silhouette.leftArm,
    rightArm: silhouette.rightArm,
    leftLeg: silhouette.leftLeg,
    rightLeg: silhouette.rightLeg,
    weapon: axeGroup,
    coreMesh: silhouette.coreMesh,
    swordGlow: axeCore,
    animTime: 0,
    isHero: false,
    isAssetLoaded: false,
    assetPath,
    characterType: 'dread_lord',
    silhouetteMesh: silhouette.body,
  };

  // Attempt to load dread-lord.glb
  assetManager.loadGLTF(assetPath).then((gltf) => {
    if (gltf) {
      try {
        const clonedModel = assetManager.cloneScene(gltf);
        silhouette.body.visible = false;
        rig.root.add(clonedModel);
        rig.isAssetLoaded = true;

        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(clonedModel);
          const actions: Record<string, THREE.AnimationAction> = {};
          gltf.animations.forEach((clip) => {
            actions[clip.name.toLowerCase()] = mixer.clipAction(clip);
          });
          rig.mixer = mixer;
          rig.actions = actions;

          const idleAction = actions['idle'] || Object.values(actions)[0];
          if (idleAction) {
            idleAction.play();
            rig.currentAction = 'idle';
          }
        }
      } catch (err) {
        console.warn('Failed mounting dread-lord.glb model:', err);
      }
    }
  });

  return rig;
}

/**
 * Creates enemy character rigs with asynchronous GLB loader and sleek fallback silhouettes.
 */
export function createEnemyMesh(type: string): CharacterRig {
  const assetPath = `/assets/enemies/${type.replace('_', '-')}.glb`;
  const silhouette = buildSculptedEnemySilhouette(type);

  // Weapon attachment
  const weapon = new THREE.Group();
  weapon.position.set(0, -0.36, 0.12);
  silhouette.rightArm.add(weapon);

  if (type === 'shadow_archer') {
    // Holographic energy bow
    const bowGeo = new THREE.TorusGeometry(0.36, 0.025, 8, 16, Math.PI);
    const bowMat = new THREE.MeshStandardMaterial({
      color: 0xcc00ff,
      emissive: 0xcc00ff,
      emissiveIntensity: 2.5,
    });
    const bow = new THREE.Mesh(bowGeo, bowMat);
    bow.rotation.y = Math.PI / 2;
    weapon.add(bow);
  } else {
    // Dark energy blade
    const bladeGeo = new THREE.ConeGeometry(0.045, 0.95, 6);
    bladeGeo.rotateX(Math.PI);
    bladeGeo.translate(0, 0.45, 0);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xff1133,
      emissive: 0xff0022,
      emissiveIntensity: 2.2,
    });
    weapon.add(new THREE.Mesh(bladeGeo, bladeMat));
  }

  const rig: CharacterRig = {
    root: silhouette.root,
    body: silhouette.body,
    head: silhouette.head,
    leftArm: silhouette.leftArm,
    rightArm: silhouette.rightArm,
    leftLeg: silhouette.leftLeg,
    rightLeg: silhouette.rightLeg,
    weapon,
    animTime: 0,
    isHero: false,
    isAssetLoaded: false,
    assetPath,
    characterType: type,
    silhouetteMesh: silhouette.body,
  };

  // Attempt to load enemy GLB
  assetManager.loadGLTF(assetPath).then((gltf) => {
    if (gltf) {
      try {
        const clonedModel = assetManager.cloneScene(gltf);
        silhouette.body.visible = false;
        rig.root.add(clonedModel);
        rig.isAssetLoaded = true;

        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(clonedModel);
          const actions: Record<string, THREE.AnimationAction> = {};
          gltf.animations.forEach((clip) => {
            actions[clip.name.toLowerCase()] = mixer.clipAction(clip);
          });
          rig.mixer = mixer;
          rig.actions = actions;

          const idleAction = actions['idle'] || Object.values(actions)[0];
          if (idleAction) {
            idleAction.play();
            rig.currentAction = 'idle';
          }
        }
      } catch (err) {
        console.warn(`Failed mounting ${assetPath}:`, err);
      }
    }
  });

  return rig;
}
