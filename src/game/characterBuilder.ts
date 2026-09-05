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
  /** Reference to the mounted custom GLB mesh (when it has no internal skeleton/animations),
   *  used to apply procedural whole-body motion: walk bob/lean, attack lunge, idle breathing. */
  meshGroup?: THREE.Group;
  meshBasePosition?: THREE.Vector3;
  meshBaseRotationY?: number;
  /** True when the mounted GLB has no bone-driven animation clips, so the engine should
   *  drive procedural whole-body motion on meshGroup instead of relying on the mixer. */
  needsProceduralMotion?: boolean;
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
 * Creates a futuristic cyber greatsword weapon attachment matching the photo.
 */
export function createFuturisticEnergySword(): { weaponGroup: THREE.Group; bladeGlow: THREE.Mesh } {
  const weapon = new THREE.Group();

  // Textured Hilt Grip
  const hiltGeo = new THREE.CylinderGeometry(0.026, 0.032, 0.38, 12);
  const hiltMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    metalness: 0.92,
    roughness: 0.25,
  });
  const hilt = new THREE.Mesh(hiltGeo, hiltMat);
  weapon.add(hilt);

  // Pommel power node
  const pommelGeo = new THREE.SphereGeometry(0.045, 8, 8);
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 3.8,
    roughness: 0.1,
  });
  const pommel = new THREE.Mesh(pommelGeo, glowMat);
  pommel.position.y = -0.2;
  weapon.add(pommel);

  // Emitter Crossguard (Angular cyber wings)
  const emitterGroup = new THREE.Group();
  emitterGroup.position.y = 0.2;
  weapon.add(emitterGroup);

  const crossguardGeo = new THREE.BoxGeometry(0.34, 0.06, 0.07);
  const crossguard = new THREE.Mesh(crossguardGeo, hiltMat);
  emitterGroup.add(crossguard);

  const ringGeo = new THREE.TorusGeometry(0.07, 0.016, 8, 16);
  const emitterRing = new THREE.Mesh(ringGeo, glowMat);
  emitterRing.rotation.x = Math.PI / 2;
  emitterGroup.add(emitterRing);

  // Broad High-Tech Blade Core (Dark titanium alloy spine)
  const spineGeo = new THREE.BoxGeometry(0.1, 1.45, 0.035);
  spineGeo.translate(0, 0.72, 0);
  const spineMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.95,
    roughness: 0.2,
  });
  const bladeSpine = new THREE.Mesh(spineGeo, spineMat);
  emitterGroup.add(bladeSpine);

  // Glowing Cyan Plasma Cutting Edge (Left Edge)
  const edgeGeo = new THREE.BoxGeometry(0.035, 1.46, 0.045);
  edgeGeo.translate(0, 0.72, 0);

  const edgeL = new THREE.Mesh(edgeGeo, glowMat);
  edgeL.position.x = 0.06;
  emitterGroup.add(edgeL);

  // Glowing Cyan Plasma Cutting Edge (Right Edge)
  const edgeR = new THREE.Mesh(edgeGeo, glowMat);
  edgeR.position.x = -0.06;
  emitterGroup.add(edgeR);

  // Angular Blade Tip
  const tipGeo = new THREE.ConeGeometry(0.08, 0.3, 4);
  tipGeo.rotateY(Math.PI / 4);
  const bladeTip = new THREE.Mesh(tipGeo, glowMat);
  bladeTip.position.set(0, 1.55, 0);
  emitterGroup.add(bladeTip);

  // Plasma Aura Sheath
  const bladeAuraGeo = new THREE.BoxGeometry(0.18, 1.5, 0.07);
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
 * Matches the user's provided photo:
 * - Real human face with styled dark hair and stylish black-rimmed glasses
 * - Sleek cobalt blue tactical cyber-armor with glowing cyan Arc Reactor chest core
 * - 6-pack abdominal cybernetic plating, high-tech shoulder pauldrons, articulated gauntlets
 * - High-tech combat boots with cyan sole thruster glow
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

  // Vibrant metallic cobalt blue armor matching photo
  const cobaltArmorMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    metalness: 0.82,
    roughness: 0.22,
  });

  const slateArmorMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.7,
    roughness: 0.35,
  });

  const cyanGlowMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 4.0,
    roughness: 0.1,
  });

  // Natural warm skin tone for human face
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xe0ac69,
    roughness: 0.55,
    metalness: 0.05,
  });

  // Dark espresso styled hair
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x171214,
    roughness: 0.85,
    metalness: 0.1,
  });

  // Black metallic glasses frame
  const glassesFrameMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0f,
    metalness: 0.9,
    roughness: 0.2,
  });

  // Reflective clear glass lenses with subtle cyan sheen
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0xa5f3fc,
    transparent: true,
    opacity: 0.4,
    roughness: 0.05,
    metalness: 0.9,
  });

  // --- Pelvis & Armored Cyber Belt ---
  const pelvisGroup = new THREE.Group();
  pelvisGroup.position.y = 0.96;
  body.add(pelvisGroup);

  const pelvisGeo = new THREE.SphereGeometry(0.24, 14, 14);
  pelvisGeo.scale(1, 0.75, 0.85);
  const pelvis = new THREE.Mesh(pelvisGeo, slateArmorMat);
  pelvisGroup.add(pelvis);

  // Cyber Belt & Central Sensor Buckle
  const beltGeo = new THREE.TorusGeometry(0.25, 0.03, 8, 24);
  beltGeo.rotateX(Math.PI / 2);
  const belt = new THREE.Mesh(beltGeo, cobaltArmorMat);
  pelvisGroup.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.04), cyanGlowMat);
  buckle.position.set(0, 0, 0.24);
  pelvisGroup.add(buckle);

  // --- Contoured Chest & Muscular Cyber Plating ---
  const chestGroup = new THREE.Group();
  chestGroup.position.y = 1.38;
  body.add(chestGroup);

  // Ribcage base
  const chestGeo = new THREE.CapsuleGeometry(0.27, 0.32, 8, 16);
  chestGeo.scale(1.2, 1, 0.85);
  const chest = new THREE.Mesh(chestGeo, slateArmorMat);
  chest.castShadow = true;
  chestGroup.add(chest);

  // Layered Pectoral Armor Plates (Cobalt Blue)
  const pecGeo = new THREE.BoxGeometry(0.22, 0.18, 0.08);
  const pecL = new THREE.Mesh(pecGeo, cobaltArmorMat);
  pecL.position.set(0.12, 0.1, 0.18);
  pecL.rotation.y = -0.15;
  pecL.rotation.z = -0.05;
  chestGroup.add(pecL);

  const pecR = new THREE.Mesh(pecGeo, cobaltArmorMat);
  pecR.position.set(-0.12, 0.1, 0.18);
  pecR.rotation.y = 0.15;
  pecR.rotation.z = 0.05;
  chestGroup.add(pecR);

  // Glowing Cyan Arc Reactor Core (Circular chest power node matching photo)
  const coreOuterGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.04, 24);
  coreOuterGeo.rotateX(Math.PI / 2);
  const coreHousing = new THREE.Mesh(coreOuterGeo, cobaltArmorMat);
  coreHousing.position.set(0, 0.09, 0.22);
  chestGroup.add(coreHousing);

  const coreGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.045, 24);
  coreGeo.rotateX(Math.PI / 2);
  const coreMesh = new THREE.Mesh(coreGeo, cyanGlowMat);
  coreMesh.position.set(0, 0.09, 0.23);
  chestGroup.add(coreMesh);

  // Core Accent Chevron light guides
  const chevGeo = new THREE.BoxGeometry(0.08, 0.015, 0.02);
  const chev1 = new THREE.Mesh(chevGeo, cyanGlowMat);
  chev1.position.set(0, 0.2, 0.22);
  chestGroup.add(chev1);

  // 6-Pack Abdominal Armor Plates with glowing cyan seams
  const abGeo = new THREE.BoxGeometry(0.09, 0.06, 0.04);
  for (let row = 0; row < 3; row++) {
    const yPos = -0.04 - row * 0.08;
    const abL = new THREE.Mesh(abGeo, cobaltArmorMat);
    abL.position.set(0.055, yPos, 0.19 - row * 0.02);
    chestGroup.add(abL);

    const abR = new THREE.Mesh(abGeo, cobaltArmorMat);
    abR.position.set(-0.055, yPos, 0.19 - row * 0.02);
    chestGroup.add(abR);

    // Subtle cyan seam divider
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.008, 0.02), cyanGlowMat);
    seam.position.set(0, yPos - 0.035, 0.19 - row * 0.02);
    chestGroup.add(seam);
  }

  // --- Real Human Head with Glasses & Styled Hair (Matching photo) ---
  const head = new THREE.Group();
  head.position.set(0, 1.83, 0);
  body.add(head);

  // Armored high-tech neck collar
  const neckGeo = new THREE.CylinderGeometry(0.1, 0.13, 0.14, 16);
  const neck = new THREE.Mesh(neckGeo, slateArmorMat);
  neck.position.y = -0.1;
  head.add(neck);

  const neckRim = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.015, 8, 16), cyanGlowMat);
  neckRim.rotation.x = Math.PI / 2;
  neckRim.position.y = -0.04;
  head.add(neckRim);

  // Sculpted Human Face Base
  const headGeo = new THREE.SphereGeometry(0.16, 18, 18);
  headGeo.scale(0.88, 1.15, 1.0);
  const faceMesh = new THREE.Mesh(headGeo, skinMat);
  faceMesh.castShadow = true;
  head.add(faceMesh);

  // Sculpted Jaw & Chin
  const jawGeo = new THREE.SphereGeometry(0.11, 14, 14);
  jawGeo.scale(0.85, 0.7, 0.95);
  const jaw = new THREE.Mesh(jawGeo, skinMat);
  jaw.position.set(0, -0.06, 0.06);
  head.add(jaw);

  // Sculpted Nose Bridge
  const noseGeo = new THREE.ConeGeometry(0.022, 0.07, 8);
  noseGeo.rotateX(Math.PI / 3);
  const nose = new THREE.Mesh(noseGeo, skinMat);
  nose.position.set(0, 0.01, 0.15);
  head.add(nose);

  // Ears
  const earGeo = new THREE.SphereGeometry(0.04, 8, 8);
  earGeo.scale(0.3, 1, 0.6);
  const earL = new THREE.Mesh(earGeo, skinMat);
  earL.position.set(0.15, 0.02, 0);
  head.add(earL);

  const earR = earL.clone();
  earR.position.x = -0.15;
  head.add(earR);

  // Expressive Eyes with dark pupils
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
  const eyeGeo = new THREE.SphereGeometry(0.018, 8, 8);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(0.052, 0.04, 0.14);
  head.add(eyeL);

  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(-0.052, 0.04, 0.14);
  head.add(eyeR);

  // Distinctive Eyebrows
  const browMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
  const browGeo = new THREE.BoxGeometry(0.045, 0.008, 0.01);
  const browL = new THREE.Mesh(browGeo, browMat);
  browL.position.set(0.055, 0.065, 0.145);
  browL.rotation.z = -0.08;
  head.add(browL);

  const browR = new THREE.Mesh(browGeo, browMat);
  browR.position.set(-0.055, 0.065, 0.145);
  browR.rotation.z = 0.08;
  head.add(browR);

  // --- Stylish Parted Dark Hair (Matching photo) ---
  const hairGroup = new THREE.Group();
  head.add(hairGroup);

  // Main Hair Crown & Back
  const hairCapGeo = new THREE.SphereGeometry(0.175, 16, 16);
  hairCapGeo.scale(0.92, 1.08, 1.05);
  const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
  hairCap.position.set(0, 0.06, -0.02);
  hairGroup.add(hairCap);

  // Front Styled Hair Parting & Volumetric Bangs
  const hairBangsGeo = new THREE.SphereGeometry(0.12, 12, 12);
  hairBangsGeo.scale(1.2, 0.45, 0.85);
  const bangsL = new THREE.Mesh(hairBangsGeo, hairMat);
  bangsL.position.set(0.04, 0.16, 0.08);
  bangsL.rotation.z = -0.15;
  hairGroup.add(bangsL);

  const bangsR = new THREE.Mesh(hairBangsGeo, hairMat);
  bangsR.position.set(-0.06, 0.15, 0.07);
  bangsR.rotation.z = 0.25;
  hairGroup.add(bangsR);

  // --- Signature Rectangular Glasses (Matching photo) ---
  const glassesGroup = new THREE.Group();
  glassesGroup.position.set(0, 0.04, 0.152);
  head.add(glassesGroup);

  // Left & Right Eyeglass Rims
  const rimGeo = new THREE.BoxGeometry(0.056, 0.038, 0.008);
  const rimL = new THREE.Mesh(rimGeo, glassesFrameMat);
  rimL.position.x = 0.052;
  glassesGroup.add(rimL);

  const rimR = new THREE.Mesh(rimGeo, glassesFrameMat);
  rimR.position.x = -0.052;
  glassesGroup.add(rimR);

  // Reflective Glass Lenses
  const lensGeo = new THREE.PlaneGeometry(0.048, 0.03);
  const lensL = new THREE.Mesh(lensGeo, lensMat);
  lensL.position.set(0.052, 0, 0.005);
  glassesGroup.add(lensL);

  const lensR = new THREE.Mesh(lensGeo, lensMat);
  lensR.position.set(-0.052, 0, 0.005);
  glassesGroup.add(lensR);

  // Nose Bridge wire
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.006, 0.006), glassesFrameMat);
  bridge.position.set(0, 0.006, 0.004);
  glassesGroup.add(bridge);

  // Temple Arms extending to ears
  const templeGeo = new THREE.BoxGeometry(0.006, 0.006, 0.15);
  const templeL = new THREE.Mesh(templeGeo, glassesFrameMat);
  templeL.position.set(0.085, 0.005, -0.07);
  glassesGroup.add(templeL);

  const templeR = new THREE.Mesh(templeGeo, glassesFrameMat);
  templeR.position.set(-0.085, 0.005, -0.07);
  glassesGroup.add(templeR);

  // --- Shoulders & Articulated Cybernetic Arms ---
  // Left Arm
  const leftArm = new THREE.Group();
  leftArm.position.set(0.42, 1.52, 0);
  body.add(leftArm);

  // Tiered Cyber Pauldron with cyan light strip
  const pauldronGeo = new THREE.SphereGeometry(0.16, 12, 12);
  pauldronGeo.scale(1.1, 0.85, 1.15);
  const pauldronL = new THREE.Mesh(pauldronGeo, cobaltArmorMat);
  leftArm.add(pauldronL);

  const pauldronGlowL = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.015, 6, 16), cyanGlowMat);
  pauldronGlowL.rotation.x = Math.PI / 2;
  leftArm.add(pauldronGlowL);

  const upperArmL = new THREE.Mesh(new THREE.CapsuleGeometry(0.078, 0.26, 6, 12), slateArmorMat);
  upperArmL.position.y = -0.22;
  leftArm.add(upperArmL);

  // Forearm with cyber gauntlet
  const forearmLGroup = new THREE.Group();
  forearmLGroup.position.set(0, -0.42, 0);
  leftArm.add(forearmLGroup);

  const forearmL = new THREE.Mesh(new THREE.CapsuleGeometry(0.074, 0.28, 6, 12), cobaltArmorMat);
  forearmL.position.y = -0.16;
  forearmLGroup.add(forearmL);

  // Glowing blue conduit on gauntlet
  const conduitL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.22, 0.03), cyanGlowMat);
  conduitL.position.set(0, -0.16, 0.07);
  forearmLGroup.add(conduitL);

  // Armored Glove
  const gloveL = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), slateArmorMat);
  gloveL.position.y = -0.34;
  forearmLGroup.add(gloveL);

  // Right Arm
  const rightArm = new THREE.Group();
  rightArm.position.set(-0.42, 1.52, 0);
  body.add(rightArm);

  const pauldronR = new THREE.Mesh(pauldronGeo, cobaltArmorMat);
  rightArm.add(pauldronR);

  const pauldronGlowR = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.015, 6, 16), cyanGlowMat);
  pauldronGlowR.rotation.x = Math.PI / 2;
  rightArm.add(pauldronGlowR);

  const upperArmR = new THREE.Mesh(new THREE.CapsuleGeometry(0.078, 0.26, 6, 12), slateArmorMat);
  upperArmR.position.y = -0.22;
  rightArm.add(upperArmR);

  const forearmRGroup = new THREE.Group();
  forearmRGroup.position.set(0, -0.42, 0);
  rightArm.add(forearmRGroup);

  const forearmR = new THREE.Mesh(new THREE.CapsuleGeometry(0.074, 0.28, 6, 12), cobaltArmorMat);
  forearmR.position.y = -0.16;
  forearmRGroup.add(forearmR);

  const conduitR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.22, 0.03), cyanGlowMat);
  conduitR.position.set(0, -0.16, 0.07);
  forearmRGroup.add(conduitR);

  const gloveR = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), slateArmorMat);
  gloveR.position.y = -0.34;
  forearmRGroup.add(gloveR);

  // --- Legs with Armored Kinetic Greaves & Glowing Soles ---
  const thighGeo = new THREE.CapsuleGeometry(0.098, 0.38, 6, 12);
  const shinGeo = new THREE.CapsuleGeometry(0.088, 0.38, 6, 12);

  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(0.18, 0.88, 0);
  body.add(leftLeg);

  const thighL = new THREE.Mesh(thighGeo, cobaltArmorMat);
  thighL.position.y = -0.24;
  leftLeg.add(thighL);

  // Knee Guard with Cyan Power Inset
  const kneeL = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), slateArmorMat);
  kneeL.position.set(0, -0.48, 0.08);
  leftLeg.add(kneeL);

  const kneeLightL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), cyanGlowMat);
  kneeLightL.rotateX(Math.PI / 2);
  kneeLightL.position.set(0, -0.48, 0.14);
  leftLeg.add(kneeLightL);

  const shinL = new THREE.Mesh(shinGeo, slateArmorMat);
  shinL.position.y = -0.7;
  leftLeg.add(shinL);

  // High-tech Boot with glowing cyan sole
  const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.26), cobaltArmorMat);
  bootL.position.set(0, -0.92, 0.05);
  leftLeg.add(bootL);

  const soleL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.27), cyanGlowMat);
  soleL.position.set(0, -0.99, 0.05);
  leftLeg.add(soleL);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(-0.18, 0.88, 0);
  body.add(rightLeg);

  const thighR = new THREE.Mesh(thighGeo, cobaltArmorMat);
  thighR.position.y = -0.24;
  rightLeg.add(thighR);

  const kneeR = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), slateArmorMat);
  kneeR.position.set(0, -0.48, 0.08);
  rightLeg.add(kneeR);

  const kneeLightR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), cyanGlowMat);
  kneeLightR.rotateX(Math.PI / 2);
  kneeLightR.position.set(0, -0.48, 0.14);
  rightLeg.add(kneeLightR);

  const shinR = new THREE.Mesh(shinGeo, slateArmorMat);
  shinR.position.y = -0.7;
  rightLeg.add(shinR);

  const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.26), cobaltArmorMat);
  bootR.position.set(0, -0.92, 0.05);
  rightLeg.add(bootR);

  const soleR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.27), cyanGlowMat);
  soleR.position.set(0, -0.99, 0.05);
  rightLeg.add(soleR);

  return { root, body, head, leftArm, rightArm, leftLeg, rightLeg, coreMesh };
}

/**
 * Builds a realistic demonic villain silhouette for THE DREAD LORD.
 * Matches the user's provided photo:
 * - Demonic horned visage with fierce glowing ruby eyes
 * - Large sweeping curved horns curling backwards and up
 * - Menacing jagged crimson & volcanic obsidian spiked plate armor
 * - Spiked flared pauldrons with upward horn blades, glowing magma chest core
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
  root.scale.set(1.5, 1.5, 1.5); // Imposing boss stature

  const body = new THREE.Group();
  root.add(body);

  const darkObsidianMat = new THREE.MeshStandardMaterial({
    color: 0x140608,
    metalness: 0.92,
    roughness: 0.28,
  });

  const bloodArmorMat = new THREE.MeshStandardMaterial({
    color: 0x4a0912,
    metalness: 0.88,
    roughness: 0.26,
  });

  const demonSkinMat = new THREE.MeshStandardMaterial({
    color: 0x451a20,
    roughness: 0.65,
    metalness: 0.15,
  });

  const rubyGlowMat = new THREE.MeshStandardMaterial({
    color: 0xff002b,
    emissive: 0xff0022,
    emissiveIntensity: 4.8,
    roughness: 0.05,
  });

  // Broad Demonic Torso with jagged rib-plates
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 1.45;
  body.add(torsoGroup);

  const torsoGeo = new THREE.CapsuleGeometry(0.38, 0.46, 8, 16);
  torsoGeo.scale(1.25, 1, 0.92);
  const torsoMesh = new THREE.Mesh(torsoGeo, darkObsidianMat);
  torsoMesh.castShadow = true;
  torsoGroup.add(torsoMesh);

  // Spiked Chest Crest & Glowing Magma Core
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.32, 0.18), bloodArmorMat);
  chestPlate.position.set(0, 0.12, 0.25);
  torsoGroup.add(chestPlate);

  const coreGeo = new THREE.OctahedronGeometry(0.14, 0);
  const coreMesh = new THREE.Mesh(coreGeo, rubyGlowMat);
  coreMesh.position.set(0, 0.12, 0.36);
  torsoGroup.add(coreMesh);

  // Jagged rib spikes
  for (let s = 0; s < 3; s++) {
    const spikeGeo = new THREE.ConeGeometry(0.04, 0.22, 6);
    spikeGeo.rotateX(-Math.PI / 3);

    const spikeL = new THREE.Mesh(spikeGeo, bloodArmorMat);
    spikeL.position.set(0.24, -0.05 - s * 0.1, 0.22);
    spikeL.rotation.z = -0.4;
    torsoGroup.add(spikeL);

    const spikeR = new THREE.Mesh(spikeGeo, bloodArmorMat);
    spikeR.position.set(-0.24, -0.05 - s * 0.1, 0.22);
    spikeR.rotation.z = 0.4;
    torsoGroup.add(spikeR);
  }

  // --- Demonic Visage, Sweeping Horns & Glowing Ruby Eyes (Matching photo) ---
  const head = new THREE.Group();
  head.position.set(0, 2.08, 0);
  body.add(head);

  // Dark Ashen Demon Face
  const demonFaceGeo = new THREE.SphereGeometry(0.22, 16, 16);
  demonFaceGeo.scale(0.9, 1.2, 1.05);
  const demonFace = new THREE.Mesh(demonFaceGeo, demonSkinMat);
  head.add(demonFace);

  // Spiked Brow Ridge & Forehead Rune
  const browRidge = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.08), darkObsidianMat);
  browRidge.position.set(0, 0.08, 0.2);
  head.add(browRidge);

  const foreheadRune = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), rubyGlowMat);
  foreheadRune.position.set(0, 0.14, 0.22);
  head.add(foreheadRune);

  // Fierce Glowing Slit Ruby Eyes (Matching photo)
  const eyeGeo = new THREE.SphereGeometry(0.042, 8, 8);
  eyeGeo.scale(1.8, 0.45, 0.8);
  const eyeL = new THREE.Mesh(eyeGeo, rubyGlowMat);
  eyeL.position.set(0.09, 0.05, 0.21);
  head.add(eyeL);

  const eyeR = eyeL.clone();
  eyeR.position.x = -0.09;
  head.add(eyeR);

  // Large Sweeping Curved Horns (Curving back & upward as in photo)
  const createCurvedHorn = (isRight: boolean) => {
    const horn = new THREE.Group();
    const sign = isRight ? -1 : 1;

    // Multi-segmented curved demonic horn
    const b1 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 12), darkObsidianMat);
    b1.position.set(sign * 0.18, 0.22, 0.02);
    b1.rotation.z = sign * -0.55;
    b1.rotation.x = -0.3;
    horn.add(b1);

    const b2 = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.44, 12), bloodArmorMat);
    b2.position.set(sign * 0.35, 0.52, -0.12);
    b2.rotation.z = sign * -0.92;
    b2.rotation.x = -0.55;
    horn.add(b2);

    const b3 = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.42, 12), darkObsidianMat);
    b3.position.set(sign * 0.48, 0.82, -0.22);
    b3.rotation.z = sign * -0.6; // curves back upward at the tip
    b3.rotation.x = -0.75;
    horn.add(b3);

    // Glowing tip
    const bTip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.25, 8), rubyGlowMat);
    bTip.position.set(sign * 0.52, 1.05, -0.26);
    bTip.rotation.z = sign * -0.3;
    bTip.rotation.x = -0.85;
    horn.add(bTip);

    return horn;
  };

  head.add(createCurvedHorn(false));
  head.add(createCurvedHorn(true));

  // --- Massive Spiked Pauldrons (Flared Horn Spikes matching photo) ---
  const leftArm = new THREE.Group();
  leftArm.position.set(0.62, 1.68, 0);
  body.add(leftArm);

  const pauldronL = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), bloodArmorMat);
  pauldronL.scale.set(1.2, 0.85, 1.2);
  leftArm.add(pauldronL);

  // Upward outward curved spikes on shoulder
  for (let sp = 0; sp < 3; sp++) {
    const pSpike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.38 + sp * 0.1, 8), darkObsidianMat);
    pSpike.position.set(0.12 + sp * 0.08, 0.18 + sp * 0.06, (sp - 1) * 0.1);
    pSpike.rotation.z = -0.6 - sp * 0.15;
    leftArm.add(pSpike);
  }

  const armGeo = new THREE.CapsuleGeometry(0.12, 0.38, 6, 12);
  leftArm.add(new THREE.Mesh(armGeo, darkObsidianMat));

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.46, 0);
  leftArm.add(leftForearm);

  const forearmL = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.36, 6, 12), bloodArmorMat);
  forearmL.position.y = -0.16;
  leftForearm.add(forearmL);

  // Flared Elbow blade
  const elbowL = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.25, 6), darkObsidianMat);
  elbowL.position.set(0, 0, -0.15);
  elbowL.rotation.x = -Math.PI / 2.5;
  leftForearm.add(elbowL);

  // Clawed demon hand
  const clawL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), darkObsidianMat);
  clawL.position.y = -0.38;
  leftForearm.add(clawL);

  // Right Arm (Similar with Spiked Pauldron)
  const rightArm = new THREE.Group();
  rightArm.position.set(-0.62, 1.68, 0);
  body.add(rightArm);

  const pauldronR = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), bloodArmorMat);
  pauldronR.scale.set(1.2, 0.85, 1.2);
  rightArm.add(pauldronR);

  for (let sp = 0; sp < 3; sp++) {
    const pSpike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.38 + sp * 0.1, 8), darkObsidianMat);
    pSpike.position.set(-0.12 - sp * 0.08, 0.18 + sp * 0.06, (sp - 1) * 0.1);
    pSpike.rotation.z = 0.6 + sp * 0.15;
    rightArm.add(pSpike);
  }

  rightArm.add(new THREE.Mesh(armGeo, darkObsidianMat));

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.46, 0);
  rightArm.add(rightForearm);

  const forearmR = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.36, 6, 12), bloodArmorMat);
  forearmR.position.y = -0.16;
  rightForearm.add(forearmR);

  const elbowR = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.25, 6), darkObsidianMat);
  elbowR.position.set(0, 0, -0.15);
  elbowR.rotation.x = -Math.PI / 2.5;
  rightForearm.add(elbowR);

  const clawR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), darkObsidianMat);
  clawR.position.y = -0.38;
  rightForearm.add(clawR);

  // --- Sturdy Spiked Legs & Greaves ---
  const legGeo = new THREE.CapsuleGeometry(0.16, 0.46, 6, 12);
  const shinGeo = new THREE.CapsuleGeometry(0.14, 0.46, 6, 12);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(0.28, 0.95, 0);
  body.add(leftLeg);
  leftLeg.add(new THREE.Mesh(legGeo, bloodArmorMat));

  const lShin = new THREE.Mesh(shinGeo, darkObsidianMat);
  lShin.position.y = -0.52;
  leftLeg.add(lShin);

  // Knee spike
  const kneeSpikeL = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 6), bloodArmorMat);
  kneeSpikeL.position.set(0, -0.32, 0.16);
  kneeSpikeL.rotation.x = Math.PI / 3;
  leftLeg.add(kneeSpikeL);

  const bootDemL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.32), darkObsidianMat);
  bootDemL.position.set(0, -0.78, 0.06);
  leftLeg.add(bootDemL);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(-0.28, 0.95, 0);
  body.add(rightLeg);
  rightLeg.add(new THREE.Mesh(legGeo, bloodArmorMat));

  const rShin = new THREE.Mesh(shinGeo, darkObsidianMat);
  rShin.position.y = -0.52;
  rightLeg.add(rShin);

  const kneeSpikeR = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 6), bloodArmorMat);
  kneeSpikeR.position.set(0, -0.32, 0.16);
  kneeSpikeR.rotation.x = Math.PI / 3;
  rightLeg.add(kneeSpikeR);

  const bootDemR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.32), darkObsidianMat);
  bootDemR.position.set(0, -0.78, 0.06);
  rightLeg.add(bootDemR);

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
  let primaryColor = 0xb91c1c; // Vivid Crimson Vanguard
  let glowColor = 0xff2244;

  if (type === 'dark_guardian') {
    scale = 1.35;
    primaryColor = 0x581c87; // Dark Amethyst Juggernaut
    glowColor = 0xf97316; // Molten core
  } else if (type === 'shadow_archer') {
    scale = 0.92;
    primaryColor = 0x3b0764; // Cyber Violet
    glowColor = 0xd946ef; // Fuchsia bow & visor
  } else if (type === 'aura_hunter') {
    scale = 0.96;
    primaryColor = 0x064e3b; // Cyber Emerald Stalker
    glowColor = 0x10b981; // Neon mint blades
  } else if (type === 'demon_beast') {
    scale = 1.2;
    primaryColor = 0x991b1b; // Blood Fiend
    glowColor = 0xff0055;
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

        // Auto-fit: normalize scale to a standard hero height and plant feet on the ground.
        // This keeps custom/replacement models (which may be authored at any arbitrary
        // scale/pivot) sized and positioned consistently with the rest of the game world.
        const HERO_TARGET_HEIGHT = 1.9;
        const rawBox = new THREE.Box3().setFromObject(clonedModel);
        const rawSize = rawBox.getSize(new THREE.Vector3());
        if (rawSize.y > 0.0001) {
          const fitScale = HERO_TARGET_HEIGHT / rawSize.y;
          clonedModel.scale.setScalar(fitScale);
        }
        const fittedBox = new THREE.Box3().setFromObject(clonedModel);
        clonedModel.position.y -= fittedBox.min.y;
        // Re-center on X/Z so an off-center pivot doesn't offset the character from the rig root.
        const fittedCenter = fittedBox.getCenter(new THREE.Vector3());
        clonedModel.position.x -= fittedCenter.x;
        clonedModel.position.z -= fittedCenter.z;

        // Hide procedural silhouette and mount high-fidelity model
        silhouette.body.visible = false;
        rig.root.add(clonedModel);
        rig.isAssetLoaded = true;
        rig.meshGroup = clonedModel;
        rig.meshBasePosition = clonedModel.position.clone();
        rig.meshBaseRotationY = clonedModel.rotation.y;

        // Re-anchor the weapon and shield onto dedicated hand points attached directly to the
        // rig root (rather than the now-hidden silhouette arms) so they stay visible and keep
        // swinging with the existing walk/attack swing logic, regardless of whether the mounted
        // model has its own skeleton.
        const rightHandAnchor = new THREE.Group();
        rightHandAnchor.position.set(-0.42, 1.52, 0);
        const leftHandAnchor = new THREE.Group();
        leftHandAnchor.position.set(0.42, 1.52, 0);
        rig.root.add(rightHandAnchor, leftHandAnchor);

        weaponGroup.position.set(0, -0.42, 0.14);
        weaponGroup.rotation.set(Math.PI / 2, 0, 0);
        rightHandAnchor.add(weaponGroup);

        shieldGroup.position.set(0.12, -0.32, 0.15);
        shieldGroup.rotation.set(0, Math.PI / 4, 0);
        leftHandAnchor.add(shieldGroup);

        // The custom hero model already sculpts its own weapon held in-hand, so hide the
        // game's separate glowing energy-sword overlay to avoid showing two weapons at once.
        // The holographic shield is kept since it's a distinct ability effect (block), not
        // a static hand prop.
        weaponGroup.visible = false;

        // Existing GameEngine walk/attack code animates rig.leftArm / rig.rightArm rotation —
        // point those at the new visible hand anchors instead of the hidden silhouette arms.
        rig.rightArm = rightHandAnchor;
        rig.leftArm = leftHandAnchor;

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
        } else {
          // No baked animations on this model (e.g. a static/unrigged custom mesh) — drive
          // procedural whole-body motion instead so walking/attacking still reads as motion.
          rig.needsProceduralMotion = true;
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
