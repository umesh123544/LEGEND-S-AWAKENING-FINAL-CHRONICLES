/**
 * Procedural 3D Asset Generator for Project A.U.R.A.
 * Generates true binary GLB files with detailed geometry, materials, and skeletal animations.
 */
import fs from 'fs';
import path from 'path';
import * as THREE from 'three';

// Node 22 Web API polyfill for GLTFExporter
globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
      if (this.onload) this.onload();
    });
  }
};

const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function saveGLB(scene, animations, outputPath) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (gltf) => {
        try {
          const buffer = Buffer.from(gltf);
          ensureDir(path.dirname(outputPath));
          fs.writeFileSync(outputPath, buffer);
          console.log(`Saved: ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
          resolve(outputPath);
        } catch (err) {
          reject(err);
        }
      },
      (err) => reject(err),
      { binary: true, animations: animations || [] }
    );
  });
}

// -------------------------------------------------------------
// HELPER: ANIMATION CLIP CREATOR (All 11 required clips)
// -------------------------------------------------------------
function createHumanoidClips() {
  const clips = [];

  // 1. IDLE (Breathing, gentle torso rise, slight arm sway)
  {
    const times = [0, 1.2, 2.4];
    const tracks = [
      new THREE.VectorKeyframeTrack('Hips.position', times, [
        0, 0.95, 0,
        0, 0.97, 0,
        0, 0.95, 0
      ]),
      new THREE.QuaternionKeyframeTrack('Chest.quaternion', times, [
        0, 0, 0, 1,
        -0.03, 0, 0, 0.999,
        0, 0, 0, 1
      ]),
      new THREE.QuaternionKeyframeTrack('LeftUpperArm.quaternion', times, [
        0, 0, -0.05, 0.998,
        0, 0, -0.07, 0.997,
        0, 0, -0.05, 0.998
      ]),
      new THREE.QuaternionKeyframeTrack('RightUpperArm.quaternion', times, [
        0, 0, 0.05, 0.998,
        0, 0, 0.07, 0.997,
        0, 0, 0.05, 0.998
      ]),
      new THREE.VectorKeyframeTrack('AuraCore.scale', times, [
        1.0, 1.0, 1.0,
        1.25, 1.25, 1.25,
        1.0, 1.0, 1.0
      ])
    ];
    clips.push(new THREE.AnimationClip('Idle', 2.4, tracks));
  }

  // 2. WALK (Natural humanoid gait cycle)
  {
    const times = [0, 0.3, 0.6, 0.9, 1.2];
    const qL0 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.35);
    const qL1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);
    const qL2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.35);
    const qL3 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);

    const qR0 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.35);
    const qR1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);
    const qR2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.35);
    const qR3 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);

    const tracks = [
      new THREE.QuaternionKeyframeTrack('LeftThigh.quaternion', times, [
        qL0.x, qL0.y, qL0.z, qL0.w,
        qL1.x, qL1.y, qL1.z, qL1.w,
        qL2.x, qL2.y, qL2.z, qL2.w,
        qL3.x, qL3.y, qL3.z, qL3.w,
        qL0.x, qL0.y, qL0.z, qL0.w
      ]),
      new THREE.QuaternionKeyframeTrack('RightThigh.quaternion', times, [
        qR0.x, qR0.y, qR0.z, qR0.w,
        qR1.x, qR1.y, qR1.z, qR1.w,
        qR2.x, qR2.y, qR2.z, qR2.w,
        qR3.x, qR3.y, qR3.z, qR3.w,
        qR0.x, qR0.y, qR0.z, qR0.w
      ]),
      new THREE.QuaternionKeyframeTrack('LeftUpperArm.quaternion', times, [
        qR0.x * 0.7, qR0.y, qR0.z, qR0.w,
        qR1.x * 0.7, qR1.y, qR1.z, qR1.w,
        qR2.x * 0.7, qR2.y, qR2.z, qR2.w,
        qR3.x * 0.7, qR3.y, qR3.z, qR3.w,
        qR0.x * 0.7, qR0.y, qR0.z, qR0.w
      ]),
      new THREE.QuaternionKeyframeTrack('RightUpperArm.quaternion', times, [
        qL0.x * 0.7, qL0.y, qL0.z, qL0.w,
        qL1.x * 0.7, qL1.y, qL1.z, qL1.w,
        qL2.x * 0.7, qL2.y, qL2.z, qL2.w,
        qL3.x * 0.7, qL3.y, qL3.z, qL3.w,
        qL0.x * 0.7, qL0.y, qL0.z, qL0.w
      ]),
      new THREE.VectorKeyframeTrack('Hips.position', times, [
        0, 0.95, 0,
        0, 0.98, 0,
        0, 0.95, 0,
        0, 0.98, 0,
        0, 0.95, 0
      ])
    ];
    clips.push(new THREE.AnimationClip('Walk', 1.2, tracks));
  }

  // 3. RUN (Dynamic sprint with high knee drive)
  {
    const times = [0, 0.2, 0.4, 0.6, 0.8];
    const qL0 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.6);
    const qL1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);
    const qL2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.6);
    const qL3 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);

    const qR0 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.6);
    const qR1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);
    const qR2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.6);
    const qR3 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);

    const tracks = [
      new THREE.QuaternionKeyframeTrack('LeftThigh.quaternion', times, [
        qL0.x, qL0.y, qL0.z, qL0.w,
        qL1.x, qL1.y, qL1.z, qL1.w,
        qL2.x, qL2.y, qL2.z, qL2.w,
        qL3.x, qL3.y, qL3.z, qL3.w,
        qL0.x, qL0.y, qL0.z, qL0.w
      ]),
      new THREE.QuaternionKeyframeTrack('RightThigh.quaternion', times, [
        qR0.x, qR0.y, qR0.z, qR0.w,
        qR1.x, qR1.y, qR1.z, qR1.w,
        qR2.x, qR2.y, qR2.z, qR2.w,
        qR3.x, qR3.y, qR3.z, qR3.w,
        qR0.x, qR0.y, qR0.z, qR0.w
      ]),
      new THREE.QuaternionKeyframeTrack('LeftUpperArm.quaternion', times, [
        qR0.x * 1.1, qR0.y, qR0.z, qR0.w,
        qR1.x * 1.1, qR1.y, qR1.z, qR1.w,
        qR2.x * 1.1, qR2.y, qR2.z, qR2.w,
        qR3.x * 1.1, qR3.y, qR3.z, qR3.w,
        qR0.x * 1.1, qR0.y, qR0.z, qR0.w
      ]),
      new THREE.QuaternionKeyframeTrack('RightUpperArm.quaternion', times, [
        qL0.x * 1.1, qL0.y, qL0.z, qL0.w,
        qL1.x * 1.1, qL1.y, qL1.z, qL1.w,
        qL2.x * 1.1, qL2.y, qL2.z, qL2.w,
        qL3.x * 1.1, qL3.y, qL3.z, qL3.w,
        qL0.x * 1.1, qL0.y, qL0.z, qL0.w
      ]),
      new THREE.QuaternionKeyframeTrack('Spine.quaternion', times, [
        0.1, 0, 0, 0.995,
        0.1, 0, 0, 0.995,
        0.1, 0, 0, 0.995,
        0.1, 0, 0, 0.995,
        0.1, 0, 0, 0.995
      ])
    ];
    clips.push(new THREE.AnimationClip('Run', 0.8, tracks));
  }

  // 4. ATTACK (Fast slash arc)
  {
    const times = [0, 0.15, 0.35, 0.55];
    const qArm0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
    const qArm1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI * 0.4, 0.5, -0.3));
    const qArm2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI * 0.2, -1.2, 0.4));
    const qArm3 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));

    const tracks = [
      new THREE.QuaternionKeyframeTrack('RightUpperArm.quaternion', times, [
        qArm0.x, qArm0.y, qArm0.z, qArm0.w,
        qArm1.x, qArm1.y, qArm1.z, qArm1.w,
        qArm2.x, qArm2.y, qArm2.z, qArm2.w,
        qArm3.x, qArm3.y, qArm3.z, qArm3.w
      ]),
      new THREE.QuaternionKeyframeTrack('Chest.quaternion', times, [
        0, 0, 0, 1,
        0, -0.2, 0, 0.98,
        0, 0.35, 0, 0.94,
        0, 0, 0, 1
      ])
    ];
    clips.push(new THREE.AnimationClip('Attack', 0.55, tracks));
  }

  // 5. HEAVY ATTACK (Overhead power slam)
  {
    const times = [0, 0.3, 0.55, 0.85];
    const qArm0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
    const qArm1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI * 0.9, 0, 0));
    const qArm2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI * 0.4, 0, 0));
    const qArm3 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));

    const tracks = [
      new THREE.QuaternionKeyframeTrack('RightUpperArm.quaternion', times, [
        qArm0.x, qArm0.y, qArm0.z, qArm0.w,
        qArm1.x, qArm1.y, qArm1.z, qArm1.w,
        qArm2.x, qArm2.y, qArm2.z, qArm2.w,
        qArm3.x, qArm3.y, qArm3.z, qArm3.w
      ]),
      new THREE.QuaternionKeyframeTrack('LeftUpperArm.quaternion', times, [
        qArm0.x, qArm0.y, qArm0.z, qArm0.w,
        qArm1.x, qArm1.y, qArm1.z, qArm1.w,
        qArm2.x, qArm2.y, qArm2.z, qArm2.w,
        qArm3.x, qArm3.y, qArm3.z, qArm3.w
      ]),
      new THREE.VectorKeyframeTrack('Hips.position', times, [
        0, 0.95, 0,
        0, 1.05, 0,
        0, 0.75, 0,
        0, 0.95, 0
      ])
    ];
    clips.push(new THREE.AnimationClip('Heavy Attack', 0.85, tracks));
  }

  // 6. BLOCK (Braced shield raise)
  {
    const times = [0, 0.2, 0.8];
    const qBlock = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI * 0.45, 0.3, -0.6));
    const tracks = [
      new THREE.QuaternionKeyframeTrack('LeftUpperArm.quaternion', times, [
        0, 0, 0, 1,
        qBlock.x, qBlock.y, qBlock.z, qBlock.w,
        qBlock.x, qBlock.y, qBlock.z, qBlock.w
      ]),
      new THREE.VectorKeyframeTrack('Hips.position', times, [
        0, 0.95, 0,
        0, 0.88, 0,
        0, 0.88, 0
      ])
    ];
    clips.push(new THREE.AnimationClip('Block', 0.8, tracks));
  }

  // 7. DODGE (Acrobatic evasive roll/slide)
  {
    const times = [0, 0.2, 0.45, 0.65];
    const tracks = [
      new THREE.VectorKeyframeTrack('Hips.position', times, [
        0, 0.95, 0,
        0, 0.45, 0.6,
        0, 0.55, 1.2,
        0, 0.95, 1.6
      ]),
      new THREE.QuaternionKeyframeTrack('Spine.quaternion', times, [
        0, 0, 0, 1,
        0.5, 0, 0, 0.866,
        0.8, 0, 0, 0.6,
        0, 0, 0, 1
      ])
    ];
    clips.push(new THREE.AnimationClip('Dodge', 0.65, tracks));
  }

  // 8. HIT REACTION (Stagger impact)
  {
    const times = [0, 0.1, 0.35];
    const tracks = [
      new THREE.QuaternionKeyframeTrack('Chest.quaternion', times, [
        0, 0, 0, 1,
        -0.3, 0.1, 0, 0.95,
        0, 0, 0, 1
      ]),
      new THREE.VectorKeyframeTrack('Hips.position', times, [
        0, 0.95, 0,
        0, 0.92, -0.2,
        0, 0.95, 0
      ])
    ];
    clips.push(new THREE.AnimationClip('Hit Reaction', 0.35, tracks));
  }

  // 9. DEATH (Knees buckle and fall)
  {
    const times = [0, 0.4, 0.9, 1.5];
    const tracks = [
      new THREE.VectorKeyframeTrack('Hips.position', times, [
        0, 0.95, 0,
        0, 0.55, -0.1,
        0, 0.2, -0.4,
        0, 0.1, -0.6
      ]),
      new THREE.QuaternionKeyframeTrack('Chest.quaternion', times, [
        0, 0, 0, 1,
        0.3, 0, 0, 0.95,
        0.6, 0, 0, 0.8,
        0.8, 0, 0, 0.6
      ])
    ];
    clips.push(new THREE.AnimationClip('Death', 1.5, tracks));
  }

  // 10. SPECIAL ATTACK (Aura surge ground slam)
  {
    const times = [0, 0.35, 0.65, 0.9, 1.3];
    const qSurge = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI * 0.95, 0, 0.3));
    const qSlam = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI * 0.45, 0, 0));

    const tracks = [
      new THREE.QuaternionKeyframeTrack('RightUpperArm.quaternion', times, [
        0, 0, 0, 1,
        qSurge.x, qSurge.y, qSurge.z, qSurge.w,
        qSlam.x, qSlam.y, qSlam.z, qSlam.w,
        qSlam.x, qSlam.y, qSlam.z, qSlam.w,
        0, 0, 0, 1
      ]),
      new THREE.VectorKeyframeTrack('AuraCore.scale', times, [
        1.0, 1.0, 1.0,
        2.5, 2.5, 2.5,
        3.2, 3.2, 3.2,
        1.8, 1.8, 1.8,
        1.0, 1.0, 1.0
      ]),
      new THREE.VectorKeyframeTrack('Hips.position', times, [
        0, 0.95, 0,
        0, 1.2, 0,
        0, 0.6, 0.3,
        0, 0.7, 0.2,
        0, 0.95, 0
      ])
    ];
    clips.push(new THREE.AnimationClip('Special Attack', 1.3, tracks));
  }

  // 11. VICTORY (Flourish into ready triumph)
  {
    const times = [0, 0.5, 1.0, 1.8];
    const qV1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI * 0.6, -0.4, 0));
    const qV2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI * 0.85, 0.2, -0.2));

    const tracks = [
      new THREE.QuaternionKeyframeTrack('RightUpperArm.quaternion', times, [
        0, 0, 0, 1,
        qV1.x, qV1.y, qV1.z, qV1.w,
        qV2.x, qV2.y, qV2.z, qV2.w,
        qV2.x, qV2.y, qV2.z, qV2.w
      ]),
      new THREE.QuaternionKeyframeTrack('LeftUpperArm.quaternion', times, [
        0, 0, 0, 1,
        0, 0, -0.3, 0.95,
        -0.2, 0, -0.4, 0.9,
        -0.2, 0, -0.4, 0.9
      ])
    ];
    clips.push(new THREE.AnimationClip('Victory', 1.8, tracks));
  }

  return clips;
}

// -------------------------------------------------------------
// 1. HERO BUILDER (Aura Vanguard)
// -------------------------------------------------------------
function buildHeroScene() {
  const root = new THREE.Group();
  root.name = 'Hero';

  // Materials
  const cobaltArmorMat = new THREE.MeshStandardMaterial({
    color: 0x0a66c2,
    metalness: 0.92,
    roughness: 0.18,
    name: 'CobaltArmorMat',
  });

  const slateArmorMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.75,
    roughness: 0.35,
    name: 'SlateArmorMat',
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xd9a47c,
    roughness: 0.65,
    metalness: 0.05,
    name: 'SkinMat',
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.8,
    metalness: 0.1,
    name: 'HairMat',
  });

  const cyanGlowMat = new THREE.MeshStandardMaterial({
    color: 0x00f7ff,
    emissive: 0x00f7ff,
    emissiveIntensity: 3.6,
    roughness: 0.1,
    name: 'CyanGlowMat',
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.1,
    name: 'ChromeMat',
  });

  // Root Bone Hierarchy
  const hips = new THREE.Group();
  hips.name = 'Hips';
  hips.position.set(0, 0.95, 0);
  root.add(hips);

  // Pelvis / Groin Armor
  const pelvisGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.22, 12);
  const pelvis = new THREE.Mesh(pelvisGeo, slateArmorMat);
  pelvis.name = 'PelvisMesh';
  hips.add(pelvis);

  // Belt with Energy Battery Cells and Buckle
  const beltGeo = new THREE.TorusGeometry(0.2, 0.035, 8, 24);
  beltGeo.rotateX(Math.PI / 2);
  const belt = new THREE.Mesh(beltGeo, chromeMat);
  belt.position.y = 0.1;
  hips.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.04), cyanGlowMat);
  buckle.position.set(0, 0.1, 0.2);
  hips.add(buckle);

  // Spine
  const spine = new THREE.Group();
  spine.name = 'Spine';
  spine.position.set(0, 0.14, 0);
  hips.add(spine);

  // Segmented 6-Pack Abdominal Armor Plates
  for (let r = 0; r < 3; r++) {
    for (let c = -1; c <= 1; c += 2) {
      const abGeo = new THREE.BoxGeometry(0.085, 0.065, 0.04);
      const abMesh = new THREE.Mesh(abGeo, cobaltArmorMat);
      abMesh.position.set(c * 0.052, r * 0.075 + 0.04, 0.16);
      spine.add(abMesh);
    }
  }

  // Chest
  const chest = new THREE.Group();
  chest.name = 'Chest';
  chest.position.set(0, 0.32, 0);
  spine.add(chest);

  // Broad Athletic Pectoral Armor
  const chestPlates = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.28, 0.24),
    cobaltArmorMat
  );
  chestPlates.position.set(0, 0.08, 0);
  chest.add(chestPlates);

  // AURA Core - Bright Cyan Arc Reactor in center of chest
  const auraCoreGroup = new THREE.Group();
  auraCoreGroup.name = 'AuraCore';
  auraCoreGroup.position.set(0, 0.1, 0.14);
  chest.add(auraCoreGroup);

  const coreRim = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 12, 32), chromeMat);
  auraCoreGroup.add(coreRim);

  const coreLens = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 24), cyanGlowMat);
  coreLens.rotateX(Math.PI / 2);
  auraCoreGroup.add(coreLens);

  // Glowing Conduit Channels flowing from Core down chest
  const conduitL = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.24, 0.02), cyanGlowMat);
  conduitL.position.set(0.12, -0.05, 0.13);
  chest.add(conduitL);

  const conduitR = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.24, 0.02), cyanGlowMat);
  conduitR.position.set(-0.12, -0.05, 0.13);
  chest.add(conduitR);

  // Neck
  const neck = new THREE.Group();
  neck.name = 'Neck';
  neck.position.set(0, 0.26, 0);
  chest.add(neck);

  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.12, 12), skinMat);
  neck.add(neckMesh);

  // Head with Realistic Human Face
  const head = new THREE.Group();
  head.name = 'Head';
  head.position.set(0, 0.12, 0);
  neck.add(head);

  // Sculpted Cranium & Jaw
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 16), skinMat);
  head.add(cranium);

  const jawGeo = new THREE.ConeGeometry(0.09, 0.14, 5);
  jawGeo.rotateX(Math.PI);
  const jaw = new THREE.Mesh(jawGeo, skinMat);
  jaw.position.set(0, -0.07, 0.04);
  head.add(jaw);

  // Eyes (Eyeballs, Iris, Pupils)
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), chromeMat);
  eyeL.position.set(0.042, 0.01, 0.105);
  head.add(eyeL);

  const irisL = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.005, 12), cyanGlowMat);
  irisL.rotateX(Math.PI / 2);
  irisL.position.set(0.042, 0.01, 0.122);
  head.add(irisL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), chromeMat);
  eyeR.position.set(-0.042, 0.01, 0.105);
  head.add(eyeR);

  const irisR = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.005, 12), cyanGlowMat);
  irisR.rotateX(Math.PI / 2);
  irisR.position.set(-0.042, 0.01, 0.122);
  head.add(irisR);

  // Sculpted Nose
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 4), skinMat);
  nose.position.set(0, -0.015, 0.128);
  nose.rotateX(-Math.PI / 6);
  head.add(nose);

  // Mouth & Lips
  const lips = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.012, 0.02), skinMat);
  lips.position.set(0, -0.06, 0.115);
  head.add(lips);

  // Short Futuristic Hair Strands
  const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.125, 14, 14), hairMat);
  hairBase.position.set(0, 0.035, -0.015);
  head.add(hairBase);

  // Side-swept spikes
  for (let s = 0; s < 5; s++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 4), hairMat);
    spike.position.set(-0.06 + s * 0.03, 0.13, 0.03 + (s % 2) * 0.02);
    spike.rotateZ(0.2 - s * 0.1);
    head.add(spike);
  }

  // Futuristic Spectacles / Visor Frames
  const glassesFrame = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.032, 0.015), slateArmorMat);
  glassesFrame.position.set(0, 0.012, 0.125);
  head.add(glassesFrame);

  // Left Arm (Shoulder -> Upper Arm -> Forearm -> Hand)
  const leftShoulder = new THREE.Group();
  leftShoulder.name = 'LeftShoulder';
  leftShoulder.position.set(0.26, 0.16, 0);
  chest.add(leftShoulder);

  // Layered Pauldron (Shoulder Armor) with Cyan Accent Trim
  const pauldronL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), cobaltArmorMat);
  pauldronL.scale.set(1.2, 0.8, 1.1);
  pauldronL.position.set(0.04, 0.02, 0);
  leftShoulder.add(pauldronL);

  const pauldronTrimL = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.015, 6, 16), cyanGlowMat);
  pauldronTrimL.rotateX(Math.PI / 2);
  leftShoulder.add(pauldronTrimL);

  const leftUpperArm = new THREE.Group();
  leftUpperArm.name = 'LeftUpperArm';
  leftUpperArm.position.set(0.06, -0.06, 0);
  leftShoulder.add(leftUpperArm);

  const bicepMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.22, 10), slateArmorMat);
  bicepMeshL.position.set(0, -0.11, 0);
  leftUpperArm.add(bicepMeshL);

  const leftForearm = new THREE.Group();
  leftForearm.name = 'LeftForearm';
  leftForearm.position.set(0, -0.22, 0);
  leftUpperArm.add(leftForearm);

  const gauntletL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.22, 10), cobaltArmorMat);
  gauntletL.position.set(0, -0.11, 0);
  leftForearm.add(gauntletL);

  const armLightL = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.18, 0.02), cyanGlowMat);
  armLightL.position.set(0.05, -0.11, 0);
  leftForearm.add(armLightL);

  const leftHand = new THREE.Group();
  leftHand.name = 'LeftHand';
  leftHand.position.set(0, -0.24, 0);
  leftForearm.add(leftHand);

  // Palm
  const palmL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.035), slateArmorMat);
  leftHand.add(palmL);

  // Individual Articulated Fingers (Thumb + 4 fingers)
  const thumbL = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.04, 6), cobaltArmorMat);
  thumbL.position.set(-0.038, 0.01, 0.015);
  thumbL.rotateZ(Math.PI / 4);
  leftHand.add(thumbL);

  for (let f = 0; f < 4; f++) {
    const fingerL = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 6), cobaltArmorMat);
    fingerL.position.set(-0.025 + f * 0.017, -0.05, 0);
    leftHand.add(fingerL);
  }

  // Left Hand Shield Mount
  const shieldSocket = new THREE.Group();
  shieldSocket.name = 'ShieldSocket';
  shieldSocket.position.set(0.08, 0, 0.05);
  leftHand.add(shieldSocket);

  // Holographic Hex Shield
  const shieldMesh = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 6),
    new THREE.MeshStandardMaterial({
      color: 0x00f7ff,
      emissive: 0x00f7ff,
      emissiveIntensity: 2.2,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      name: 'ShieldMaterial'
    })
  );
  shieldMesh.rotateY(Math.PI / 2);
  shieldSocket.add(shieldMesh);

  // Right Arm (Shoulder -> Upper Arm -> Forearm -> Hand)
  const rightShoulder = new THREE.Group();
  rightShoulder.name = 'RightShoulder';
  rightShoulder.position.set(-0.26, 0.16, 0);
  chest.add(rightShoulder);

  const pauldronR = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), cobaltArmorMat);
  pauldronR.scale.set(1.2, 0.8, 1.1);
  pauldronR.position.set(-0.04, 0.02, 0);
  rightShoulder.add(pauldronR);

  const pauldronTrimR = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.015, 6, 16), cyanGlowMat);
  pauldronTrimR.rotateX(Math.PI / 2);
  rightShoulder.add(pauldronTrimR);

  const rightUpperArm = new THREE.Group();
  rightUpperArm.name = 'RightUpperArm';
  rightUpperArm.position.set(-0.06, -0.06, 0);
  rightShoulder.add(rightUpperArm);

  const bicepMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.22, 10), slateArmorMat);
  bicepMeshR.position.set(0, -0.11, 0);
  rightUpperArm.add(bicepMeshR);

  const rightForearm = new THREE.Group();
  rightForearm.name = 'RightForearm';
  rightForearm.position.set(0, -0.22, 0);
  rightUpperArm.add(rightForearm);

  const gauntletR = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.22, 10), cobaltArmorMat);
  gauntletR.position.set(0, -0.11, 0);
  rightForearm.add(gauntletR);

  const armLightR = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.18, 0.02), cyanGlowMat);
  armLightR.position.set(-0.05, -0.11, 0);
  rightForearm.add(armLightR);

  const rightHand = new THREE.Group();
  rightHand.name = 'RightHand';
  rightHand.position.set(0, -0.24, 0);
  rightForearm.add(rightHand);

  // Palm
  const palmR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.035), slateArmorMat);
  rightHand.add(palmR);

  // Fingers
  const thumbR = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.04, 6), cobaltArmorMat);
  thumbR.position.set(0.038, 0.01, 0.015);
  thumbR.rotateZ(-Math.PI / 4);
  rightHand.add(thumbR);

  for (let f = 0; f < 4; f++) {
    const fingerR = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 6), cobaltArmorMat);
    fingerR.position.set(0.025 - f * 0.017, -0.05, 0);
    rightHand.add(fingerR);
  }

  // Weapon Socket on Right Hand
  const weaponSocket = new THREE.Group();
  weaponSocket.name = 'WeaponSocket';
  weaponSocket.position.set(0, -0.06, 0.08);
  weaponSocket.rotateX(Math.PI / 2);
  rightHand.add(weaponSocket);

  // Cyber Energy Greatsword attached to weapon socket
  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.28, 10), chromeMat);
  hilt.position.set(0, -0.14, 0);
  weaponSocket.add(hilt);

  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.06), cobaltArmorMat);
  weaponSocket.add(guard);

  const guardCore = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), cyanGlowMat);
  guardCore.position.z = 0.03;
  weaponSocket.add(guardCore);

  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.1, 0.018), cyanGlowMat);
  blade.position.set(0, 0.58, 0);
  weaponSocket.add(blade);

  const bladeSpine = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.95, 0.03), chromeMat);
  bladeSpine.position.set(0, 0.5, 0);
  weaponSocket.add(bladeSpine);

  // Legs & Boots
  // Left Leg
  const leftThigh = new THREE.Group();
  leftThigh.name = 'LeftThigh';
  leftThigh.position.set(0.14, -0.1, 0);
  hips.add(leftThigh);

  const thighMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.38, 12), cobaltArmorMat);
  thighMeshL.position.set(0, -0.19, 0);
  leftThigh.add(thighMeshL);

  const leftCalf = new THREE.Group();
  leftCalf.name = 'LeftCalf';
  leftCalf.position.set(0, -0.38, 0);
  leftThigh.add(leftCalf);

  // Knee Armor with Power Crystal
  const kneeGuardL = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), slateArmorMat);
  kneeGuardL.position.set(0, 0, 0.06);
  leftCalf.add(kneeGuardL);

  const kneeLightL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.02), cyanGlowMat);
  kneeLightL.position.set(0, 0, 0.11);
  leftCalf.add(kneeLightL);

  const shinMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.36, 12), slateArmorMat);
  shinMeshL.position.set(0, -0.18, 0);
  leftCalf.add(shinMeshL);

  const leftFoot = new THREE.Group();
  leftFoot.name = 'LeftFoot';
  leftFoot.position.set(0, -0.36, 0);
  leftCalf.add(leftFoot);

  const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 0.24), cobaltArmorMat);
  bootL.position.set(0, -0.06, 0.05);
  leftFoot.add(bootL);

  const bootSoleL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.02, 0.25), cyanGlowMat);
  bootSoleL.position.set(0, -0.12, 0.05);
  leftFoot.add(bootSoleL);

  // Right Leg
  const rightThigh = new THREE.Group();
  rightThigh.name = 'RightThigh';
  rightThigh.position.set(-0.14, -0.1, 0);
  hips.add(rightThigh);

  const thighMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.38, 12), cobaltArmorMat);
  thighMeshR.position.set(0, -0.19, 0);
  rightThigh.add(thighMeshR);

  const rightCalf = new THREE.Group();
  rightCalf.name = 'RightCalf';
  rightCalf.position.set(0, -0.38, 0);
  rightThigh.add(rightCalf);

  const kneeGuardR = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), slateArmorMat);
  kneeGuardR.position.set(0, 0, 0.06);
  rightCalf.add(kneeGuardR);

  const kneeLightR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.02), cyanGlowMat);
  kneeLightR.position.set(0, 0, 0.11);
  rightCalf.add(kneeLightR);

  const shinMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.36, 12), slateArmorMat);
  shinMeshR.position.set(0, -0.18, 0);
  rightCalf.add(shinMeshR);

  const rightFoot = new THREE.Group();
  rightFoot.name = 'RightFoot';
  rightFoot.position.set(0, -0.36, 0);
  rightCalf.add(rightFoot);

  const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 0.24), cobaltArmorMat);
  bootR.position.set(0, -0.06, 0.05);
  rightFoot.add(bootR);

  const bootSoleR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.02, 0.25), cyanGlowMat);
  bootSoleR.position.set(0, -0.12, 0.05);
  rightFoot.add(bootSoleR);

  return root;
}

// -------------------------------------------------------------
// 2. DREAD LORD BUILDER (Villain Boss)
// -------------------------------------------------------------
function buildDreadLordScene() {
  const root = new THREE.Group();
  root.name = 'DreadLord';
  root.scale.set(1.35, 1.35, 1.35); // Imposing boss stature

  // Materials
  const obsidianArmorMat = new THREE.MeshStandardMaterial({
    color: 0x140608,
    metalness: 0.94,
    roughness: 0.22,
    name: 'ObsidianArmorMat',
  });

  const bloodArmorMat = new THREE.MeshStandardMaterial({
    color: 0x5a0a14,
    metalness: 0.88,
    roughness: 0.28,
    name: 'BloodArmorMat',
  });

  const demonSkinMat = new THREE.MeshStandardMaterial({
    color: 0x481e24,
    roughness: 0.7,
    metalness: 0.12,
    name: 'DemonSkinMat',
  });

  const rubyGlowMat = new THREE.MeshStandardMaterial({
    color: 0xff002b,
    emissive: 0xff0022,
    emissiveIntensity: 4.8,
    roughness: 0.05,
    name: 'RubyGlowMat',
  });

  // Root Bone Hierarchy
  const hips = new THREE.Group();
  hips.name = 'Hips';
  hips.position.set(0, 1.0, 0);
  root.add(hips);

  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.26, 12), obsidianArmorMat);
  hips.add(pelvis);

  // Spiked Waist Tassets
  for (let t = 0; t < 4; t++) {
    const tasset = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.26, 4), bloodArmorMat);
    const ang = (t * Math.PI) / 2 + Math.PI / 4;
    tasset.position.set(Math.cos(ang) * 0.22, -0.1, Math.sin(ang) * 0.22);
    tasset.rotation.z = Math.cos(ang) * 0.4;
    tasset.rotation.x = Math.sin(ang) * 0.4;
    hips.add(tasset);
  }

  // Spine
  const spine = new THREE.Group();
  spine.name = 'Spine';
  spine.position.set(0, 0.16, 0);
  hips.add(spine);

  const abdomen = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.25, 12), demonSkinMat);
  abdomen.position.y = 0.12;
  spine.add(abdomen);

  // Chest
  const chest = new THREE.Group();
  chest.name = 'Chest';
  chest.position.set(0, 0.32, 0);
  spine.add(chest);

  // Menacing Jagged Cuirass
  const cuirass = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.36, 0.32), obsidianArmorMat);
  cuirass.position.set(0, 0.12, 0);
  chest.add(cuirass);

  // Radiant Magma Core with Cracks
  const auraCoreGroup = new THREE.Group();
  auraCoreGroup.name = 'AuraCore';
  auraCoreGroup.position.set(0, 0.14, 0.18);
  chest.add(auraCoreGroup);

  const magmaCore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 1), rubyGlowMat);
  auraCoreGroup.add(magmaCore);

  // Glowing red volcanic cracks
  for (let c = 0; c < 6; c++) {
    const crack = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.02), rubyGlowMat);
    crack.position.set((Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.2, 0.17);
    crack.rotation.z = Math.random() * Math.PI;
    chest.add(crack);
  }

  // Neck
  const neck = new THREE.Group();
  neck.name = 'Neck';
  neck.position.set(0, 0.3, 0);
  chest.add(neck);

  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.14, 12), demonSkinMat);
  neck.add(neckMesh);

  // Demonic Head & Horns
  const head = new THREE.Group();
  head.name = 'Head';
  head.position.set(0, 0.14, 0);
  neck.add(head);

  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 14), demonSkinMat);
  head.add(cranium);

  const jaw = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 5), obsidianArmorMat);
  jaw.rotateX(Math.PI);
  jaw.position.set(0, -0.09, 0.05);
  head.add(jaw);

  // Glowing Ruby Slit Eyes
  const eyeL = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 4), rubyGlowMat);
  eyeL.rotateZ(-Math.PI / 4);
  eyeL.position.set(0.055, 0.02, 0.13);
  head.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 4), rubyGlowMat);
  eyeR.rotateZ(Math.PI / 4);
  eyeR.position.set(-0.055, 0.02, 0.13);
  head.add(eyeR);

  // Forehead Horn Crest
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 4), bloodArmorMat);
  crest.position.set(0, 0.14, 0.12);
  crest.rotateX(Math.PI / 6);
  head.add(crest);

  // Swept-Back Curved Demonic Horns
  [-1, 1].forEach((side) => {
    const hornGroup = new THREE.Group();
    hornGroup.position.set(side * 0.12, 0.14, -0.02);
    head.add(hornGroup);

    for (let h = 0; h < 6; h++) {
      const segR = 0.055 * (1 - h * 0.14);
      const segGeo = new THREE.CylinderGeometry(segR * 0.8, segR, 0.12, 8);
      const seg = new THREE.Mesh(segGeo, h % 2 === 0 ? obsidianArmorMat : bloodArmorMat);
      seg.position.set(side * h * 0.055, h * 0.08, -h * 0.08);
      seg.rotation.set(-0.4, 0, side * 0.35);
      hornGroup.add(seg);
    }
  });

  // Shoulders & Massive Spiked Pauldrons
  const leftShoulder = new THREE.Group();
  leftShoulder.name = 'LeftShoulder';
  leftShoulder.position.set(0.36, 0.22, 0);
  chest.add(leftShoulder);

  const pauldronL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), obsidianArmorMat);
  leftShoulder.add(pauldronL);

  // Upward Horn Spike on Shoulder
  const spikeL = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.32, 6), bloodArmorMat);
  spikeL.position.set(0.08, 0.22, 0);
  spikeL.rotateZ(-0.3);
  leftShoulder.add(spikeL);

  const leftUpperArm = new THREE.Group();
  leftUpperArm.name = 'LeftUpperArm';
  leftUpperArm.position.set(0.08, -0.1, 0);
  leftShoulder.add(leftUpperArm);

  const bicepL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.28, 10), demonSkinMat);
  bicepL.position.set(0, -0.14, 0);
  leftUpperArm.add(bicepL);

  const leftForearm = new THREE.Group();
  leftForearm.name = 'LeftForearm';
  leftForearm.position.set(0, -0.28, 0);
  leftUpperArm.add(leftForearm);

  const gauntletL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.28, 10), obsidianArmorMat);
  gauntletL.position.set(0, -0.14, 0);
  leftForearm.add(gauntletL);

  const leftHand = new THREE.Group();
  leftHand.name = 'LeftHand';
  leftHand.position.set(0, -0.3, 0);
  leftForearm.add(leftHand);

  const palmL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), bloodArmorMat);
  leftHand.add(palmL);

  // Clawed Talons
  for (let c = 0; c < 4; c++) {
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.1, 4), rubyGlowMat);
    claw.position.set(-0.04 + c * 0.026, -0.08, 0.02);
    claw.rotateX(Math.PI);
    leftHand.add(claw);
  }

  // Right Arm
  const rightShoulder = new THREE.Group();
  rightShoulder.name = 'RightShoulder';
  rightShoulder.position.set(-0.36, 0.22, 0);
  chest.add(rightShoulder);

  const pauldronR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), obsidianArmorMat);
  rightShoulder.add(pauldronR);

  const spikeR = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.32, 6), bloodArmorMat);
  spikeR.position.set(-0.08, 0.22, 0);
  spikeR.rotateZ(0.3);
  rightShoulder.add(spikeR);

  const rightUpperArm = new THREE.Group();
  rightUpperArm.name = 'RightUpperArm';
  rightUpperArm.position.set(-0.08, -0.1, 0);
  rightShoulder.add(rightUpperArm);

  const bicepR = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.28, 10), demonSkinMat);
  bicepR.position.set(0, -0.14, 0);
  rightUpperArm.add(bicepR);

  const rightForearm = new THREE.Group();
  rightForearm.name = 'RightForearm';
  rightForearm.position.set(0, -0.28, 0);
  rightUpperArm.add(rightForearm);

  const gauntletR = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.28, 10), obsidianArmorMat);
  gauntletR.position.set(0, -0.14, 0);
  rightForearm.add(gauntletR);

  const rightHand = new THREE.Group();
  rightHand.name = 'RightHand';
  rightHand.position.set(0, -0.3, 0);
  rightForearm.add(rightHand);

  const palmR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), bloodArmorMat);
  rightHand.add(palmR);

  for (let c = 0; c < 4; c++) {
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.1, 4), rubyGlowMat);
    claw.position.set(0.04 - c * 0.026, -0.08, 0.02);
    claw.rotateX(Math.PI);
    rightHand.add(claw);
  }

  // Two-Handed Dread Battle Axe in Right Hand Socket
  const weaponSocket = new THREE.Group();
  weaponSocket.name = 'WeaponSocket';
  weaponSocket.position.set(0, -0.08, 0.1);
  weaponSocket.rotateX(Math.PI / 2);
  rightHand.add(weaponSocket);

  const haft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.8, 10), obsidianArmorMat);
  weaponSocket.add(haft);

  // Skull Pommel
  const pommel = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09, 1), bloodArmorMat);
  pommel.position.set(0, -0.9, 0);
  weaponSocket.add(pommel);

  // Giant Double Crescent Blades
  [-1, 1].forEach((side) => {
    const bladeCurve = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.1, 8, 24, Math.PI), bloodArmorMat);
    bladeCurve.position.set(side * 0.18, 0.65, 0);
    bladeCurve.rotation.z = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    weaponSocket.add(bladeCurve);

    // Glowing Blood Runes on Blade Edge
    const rune = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 0.04), rubyGlowMat);
    rune.position.set(side * 0.42, 0.65, 0);
    weaponSocket.add(rune);
  });

  // Legs & Spiked Greaves
  const leftThigh = new THREE.Group();
  leftThigh.name = 'LeftThigh';
  leftThigh.position.set(0.18, -0.14, 0);
  hips.add(leftThigh);

  const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.46, 12), obsidianArmorMat);
  thighL.position.set(0, -0.23, 0);
  leftThigh.add(thighL);

  const leftCalf = new THREE.Group();
  leftCalf.name = 'LeftCalf';
  leftCalf.position.set(0, -0.46, 0);
  leftThigh.add(leftCalf);

  const kneeL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), bloodArmorMat);
  kneeL.position.set(0, 0, 0.09);
  kneeL.rotateX(Math.PI / 3);
  leftCalf.add(kneeL);

  const shinL = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.08, 0.44, 12), obsidianArmorMat);
  shinL.position.set(0, -0.22, 0);
  leftCalf.add(shinL);

  const leftFoot = new THREE.Group();
  leftFoot.name = 'LeftFoot';
  leftFoot.position.set(0, -0.44, 0);
  leftCalf.add(leftFoot);

  const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.16, 0.32), obsidianArmorMat);
  bootL.position.set(0, -0.08, 0.06);
  leftFoot.add(bootL);

  // Right Leg
  const rightThigh = new THREE.Group();
  rightThigh.name = 'RightThigh';
  rightThigh.position.set(-0.18, -0.14, 0);
  hips.add(rightThigh);

  const thighR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.46, 12), obsidianArmorMat);
  thighR.position.set(0, -0.23, 0);
  rightThigh.add(thighR);

  const rightCalf = new THREE.Group();
  rightCalf.name = 'RightCalf';
  rightCalf.position.set(0, -0.46, 0);
  rightThigh.add(rightCalf);

  const kneeR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), bloodArmorMat);
  kneeR.position.set(0, 0, 0.09);
  kneeR.rotateX(Math.PI / 3);
  rightCalf.add(kneeR);

  const shinR = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.08, 0.44, 12), obsidianArmorMat);
  shinR.position.set(0, -0.22, 0);
  rightCalf.add(shinR);

  const rightFoot = new THREE.Group();
  rightFoot.name = 'RightFoot';
  rightFoot.position.set(0, -0.44, 0);
  rightCalf.add(rightFoot);

  const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.16, 0.32), obsidianArmorMat);
  bootR.position.set(0, -0.08, 0.06);
  rightFoot.add(bootR);

  return root;
}

// -------------------------------------------------------------
// 3. ENEMY BUILDERS (All 5 distinct archetypes)
// -------------------------------------------------------------
function buildEnemyScene(type) {
  const root = new THREE.Group();
  root.name = type;

  // Base humanoid bones
  const hips = new THREE.Group();
  hips.name = 'Hips';
  hips.position.set(0, 0.9, 0);
  root.add(hips);

  const spine = new THREE.Group();
  spine.name = 'Spine';
  spine.position.set(0, 0.12, 0);
  hips.add(spine);

  const chest = new THREE.Group();
  chest.name = 'Chest';
  chest.position.set(0, 0.28, 0);
  spine.add(chest);

  const neck = new THREE.Group();
  neck.name = 'Neck';
  neck.position.set(0, 0.24, 0);
  chest.add(neck);

  const head = new THREE.Group();
  head.name = 'Head';
  head.position.set(0, 0.1, 0);
  neck.add(head);

  const leftShoulder = new THREE.Group();
  leftShoulder.name = 'LeftShoulder';
  leftShoulder.position.set(0.24, 0.14, 0);
  chest.add(leftShoulder);

  const leftUpperArm = new THREE.Group();
  leftUpperArm.name = 'LeftUpperArm';
  leftUpperArm.position.set(0.04, -0.06, 0);
  leftShoulder.add(leftUpperArm);

  const rightShoulder = new THREE.Group();
  rightShoulder.name = 'RightShoulder';
  rightShoulder.position.set(-0.24, 0.14, 0);
  chest.add(rightShoulder);

  const rightUpperArm = new THREE.Group();
  rightUpperArm.name = 'RightUpperArm';
  rightUpperArm.position.set(-0.04, -0.06, 0);
  rightShoulder.add(rightUpperArm);

  const leftThigh = new THREE.Group();
  leftThigh.name = 'LeftThigh';
  leftThigh.position.set(0.12, -0.1, 0);
  hips.add(leftThigh);

  const rightThigh = new THREE.Group();
  rightThigh.name = 'RightThigh';
  rightThigh.position.set(-0.12, -0.1, 0);
  hips.add(rightThigh);

  const auraCore = new THREE.Group();
  auraCore.name = 'AuraCore';
  auraCore.position.set(0, 0.1, 0.12);
  chest.add(auraCore);

  if (type === 'dark-soldier') {
    // Heavy Ballistic Armor + Combat Visor Helmet + Assault Power Lance
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 });
    const redGlow = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 3.5 });

    chest.add(new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.3, 0.22), steelMat));
    auraCore.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), redGlow));

    // Full Combat Helmet with Glowing Horizontal Slit Visor
    head.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.24), steelMat));
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.04), redGlow);
    visor.position.set(0, 0.02, 0.11);
    head.add(visor);

    // Lance Weapon in Right Hand
    const lance = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.8, 8), steelMat);
    lance.position.set(-0.06, -0.4, 0.4);
    lance.rotateX(Math.PI / 2);
    rightUpperArm.add(lance);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 6), redGlow);
    tip.position.set(0, 0.9, 0);
    lance.add(tip);
  } else if (type === 'shadow-archer') {
    // Sleek Scout + Target Visor + High-Energy Composite Bow
    const stealthMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const amberGlow = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 3.8 });

    chest.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.3, 10), stealthMat));
    auraCore.add(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 6, 16), amberGlow));

    // Sleek Mask with Optical Target Sensor
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), stealthMat));
    const sensor = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 12), amberGlow);
    sensor.rotateX(Math.PI / 2);
    sensor.position.set(0.03, 0.02, 0.1);
    head.add(sensor);

    // High-Energy Recurve Bow on Left Arm
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.035, 6, 24, Math.PI), stealthMat);
    bow.position.set(0.05, -0.3, 0.15);
    bow.rotateY(Math.PI / 2);
    leftUpperArm.add(bow);

    const bowString = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.96, 4), amberGlow);
    bowString.position.set(0, 0, 0);
    bow.add(bowString);
  } else if (type === 'aura-hunter') {
    // Dual-Blade Assassin Silhouette + Violet Digital Optics
    const assassinMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.8, roughness: 0.25 });
    const violetGlow = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0xa855f7, emissiveIntensity: 4.0 });

    chest.add(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.18), assassinMat));
    auraCore.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), violetGlow));

    // Faceless Stealth Hood
    head.add(new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.28, 6), assassinMat));
    const optic = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.02), violetGlow);
    optic.position.set(0, -0.02, 0.11);
    head.add(optic);

    // Twin Curved Daggers on both arms
    [-1, 1].forEach((side) => {
      const arm = side > 0 ? leftUpperArm : rightUpperArm;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.55, 0.015), violetGlow);
      blade.position.set(side * 0.04, -0.4, 0.1);
      blade.rotateX(0.2);
      arm.add(blade);
    });
  } else if (type === 'dark-guardian') {
    // Heavy Bulwark Juggernaut + Tower Shield + War Hammer
    const fortMat = new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.95, roughness: 0.15 });
    const yellowGlow = new THREE.MeshStandardMaterial({ color: 0xeab308, emissive: 0xeab308, emissiveIntensity: 3.2 });

    root.scale.set(1.25, 1.25, 1.25);
    chest.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.38, 0.32), fortMat));
    auraCore.add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 16), yellowGlow));

    head.add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), fortMat));

    // Massive Fortress Tower Shield on Left Arm
    const towerShield = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.08), fortMat);
    towerShield.position.set(0.15, -0.3, 0.25);
    leftUpperArm.add(towerShield);

    const shieldRune = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 0.09), yellowGlow);
    towerShield.add(shieldRune);
  } else if (type === 'demon-beast') {
    // Monstrous Alien Quadrupedal Predator with Horned Skull and Spines
    const chitinMat = new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.6, metalness: 0.3 });
    const lavaGlow = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xf97316, emissiveIntensity: 4.2 });

    root.scale.set(1.2, 1.2, 1.2);
    spine.rotation.x = Math.PI / 4; // Hunched quadruped posture

    chest.add(new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 6), chitinMat));
    auraCore.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), lavaGlow));

    // Spines along back
    for (let s = 0; s < 5; s++) {
      const spineSpike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.25, 4), lavaGlow);
      spineSpike.position.set(0, s * 0.1 - 0.1, -0.15);
      spineSpike.rotateX(-Math.PI / 3);
      chest.add(spineSpike);
    }

    // Bestial Horned Skull
    head.add(new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.35, 5), chitinMat));
    const beastJaw = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.18), lavaGlow);
    beastJaw.position.set(0, -0.1, 0.1);
    head.add(beastJaw);
  }

  return root;
}

// -------------------------------------------------------------
// 4. WEAPONS GENERATOR
// -------------------------------------------------------------
function buildEnergySwordScene() {
  const root = new THREE.Group();
  root.name = 'EnergySword';

  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.95, roughness: 0.1 });
  const cobaltMat = new THREE.MeshStandardMaterial({ color: 0x0a66c2, metalness: 0.85, roughness: 0.25 });
  const cyanGlowMat = new THREE.MeshStandardMaterial({ color: 0x00f7ff, emissive: 0x00f7ff, emissiveIntensity: 4.2 });

  // Handle
  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.32, 12), chromeMat);
  root.add(hilt);

  // Crossguard
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.045, 0.07), cobaltMat);
  guard.position.y = 0.16;
  root.add(guard);

  const emitterCore = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), cyanGlowMat);
  emitterCore.position.set(0, 0.16, 0.035);
  root.add(emitterCore);

  // Plasma Blade
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.25, 0.02), cyanGlowMat);
  blade.position.y = 0.82;
  root.add(blade);

  // Chrome Central Fuller
  const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.05, 0.032), chromeMat);
  fuller.position.y = 0.72;
  root.add(fuller);

  return root;
}

function buildAuraShieldScene() {
  const root = new THREE.Group();
  root.name = 'AuraShield';

  const cyanMat = new THREE.MeshStandardMaterial({
    color: 0x00f7ff,
    emissive: 0x00f7ff,
    emissiveIntensity: 3.2,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });

  const shield = new THREE.Mesh(new THREE.CircleGeometry(0.48, 6), cyanMat);
  root.add(shield);

  const outerRim = new THREE.Mesh(new THREE.RingGeometry(0.44, 0.5, 6), cyanMat);
  root.add(outerRim);

  return root;
}

function buildDreadAxeScene() {
  const root = new THREE.Group();
  root.name = 'DreadAxe';

  const obsidianMat = new THREE.MeshStandardMaterial({ color: 0x140608, metalness: 0.95, roughness: 0.2 });
  const bloodMat = new THREE.MeshStandardMaterial({ color: 0x5a0a14, metalness: 0.85, roughness: 0.3 });
  const rubyGlowMat = new THREE.MeshStandardMaterial({ color: 0xff002b, emissive: 0xff0022, emissiveIntensity: 4.5 });

  const haft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 2.0, 10), obsidianMat);
  root.add(haft);

  const pommel = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1, 1), bloodMat);
  pommel.position.y = -1.0;
  root.add(pommel);

  [-1, 1].forEach((side) => {
    const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.12, 8, 24, Math.PI), bloodMat);
    crescent.position.set(side * 0.2, 0.75, 0);
    crescent.rotation.z = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    root.add(crescent);

    const rune = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.6, 0.05), rubyGlowMat);
    rune.position.set(side * 0.48, 0.75, 0);
    root.add(rune);
  });

  return root;
}

// -------------------------------------------------------------
// 5. CINEMATIC FUTURISTIC CITY ENVIRONMENT (Sector-1)
// -------------------------------------------------------------
function buildFuturisticCityScene() {
  const root = new THREE.Group();
  root.name = 'NeoMetropolis';

  const roadMat = new THREE.MeshStandardMaterial({ color: 0x0b0f17, roughness: 0.4, metalness: 0.8 });
  const cyanLaneMat = new THREE.MeshStandardMaterial({ color: 0x00f7ff, emissive: 0x00f7ff, emissiveIntensity: 3.5 });
  const amberLaneMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 3.5 });
  const buildingMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.85 });
  const windowGlowMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.2 });
  const pinkGlowMat = new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xdb2777, emissiveIntensity: 4.0 });

  // 1. Cyber Highway Roadway
  const road = new THREE.Mesh(new THREE.PlaneGeometry(16, 120), roadMat);
  road.rotateX(-Math.PI / 2);
  root.add(road);

  // Glowing Cyan / Amber Highway Dividers
  for (let z = -55; z < 55; z += 6) {
    const laneL = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 3.5), cyanLaneMat);
    laneL.rotateX(-Math.PI / 2);
    laneL.position.set(-2.5, 0.02, z);
    root.add(laneL);

    const laneR = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 3.5), amberLaneMat);
    laneR.rotateX(-Math.PI / 2);
    laneR.position.set(2.5, 0.02, z);
    root.add(laneR);
  }

  // 2. High-Tech Skyscrapers lining the avenue
  const buildingPositions = [
    { x: -22, z: -40, w: 18, h: 55, d: 18 },
    { x: -24, z: -10, w: 16, h: 72, d: 20 },
    { x: -22, z: 24, w: 18, h: 62, d: 18 },
    { x: -25, z: 50, w: 16, h: 48, d: 18 },
    { x: 22, z: -40, w: 18, h: 64, d: 18 },
    { x: 24, z: -10, w: 16, h: 80, d: 20 },
    { x: 22, z: 24, w: 18, h: 58, d: 18 },
    { x: 25, z: 50, w: 16, h: 68, d: 18 },
  ];

  buildingPositions.forEach((bp, idx) => {
    const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bp.w, bp.h, bp.d), buildingMat);
    bMesh.position.set(bp.x, bp.h / 2, bp.z);
    root.add(bMesh);

    // Glowing Window Matrix Grids
    for (let floor = 4; floor < bp.h - 4; floor += 4) {
      const winStrip = new THREE.Mesh(new THREE.BoxGeometry(bp.w + 0.1, 0.8, bp.d + 0.1), windowGlowMat);
      winStrip.position.set(bp.x, floor, bp.z);
      root.add(winStrip);
    }

    // Neon Rooftop Advertisements / Billboards
    const billboard = new THREE.Mesh(
      new THREE.BoxGeometry(bp.w * 0.7, 3.2, 0.4),
      idx % 2 === 0 ? pinkGlowMat : cyanLaneMat
    );
    billboard.position.set(bp.x, bp.h + 2.5, bp.z);
    root.add(billboard);

    // Communication Antenna Mast
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.3, 14, 8), buildingMat);
    antenna.position.set(bp.x, bp.h + 7, bp.z);
    root.add(antenna);
  });

  // 3. Hover Vehicles parked along sidewalk curbs
  const carPositions = [
    { x: -9.5, z: -25 },
    { x: -9.5, z: 15 },
    { x: 9.5, z: -15 },
    { x: 9.5, z: 35 },
  ];

  carPositions.forEach((cp) => {
    const carGroup = new THREE.Group();
    carGroup.position.set(cp.x, 0.7, cp.z);
    root.add(carGroup);

    // Aerodynamic Cyber Chassis
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.85, 4.8), buildingMat);
    carGroup.add(body);

    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.65, 2.4), windowGlowMat);
    cockpit.position.set(0, 0.65, -0.2);
    carGroup.add(cockpit);

    // Glowing Headlights and Taillights
    const headlights = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 0.1), cyanLaneMat);
    headlights.position.set(0, 0, 2.42);
    carGroup.add(headlights);

    const taillights = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 0.1), pinkGlowMat);
    taillights.position.set(0, 0, -2.42);
    carGroup.add(taillights);
  });

  return root;
}

// -------------------------------------------------------------
// MAIN EXECUTION PIPELINE
// -------------------------------------------------------------
async function run() {
  console.log('--- Generating High-Fidelity 3D Assets ---');
  const humanoidClips = createHumanoidClips();

  // 1. Hero
  const heroScene = buildHeroScene();
  await saveGLB(heroScene, humanoidClips, 'public/assets/characters/hero.glb');

  // 2. Dread Lord
  const dreadLordScene = buildDreadLordScene();
  await saveGLB(dreadLordScene, humanoidClips, 'public/assets/characters/dread-lord.glb');

  // 3. Enemies
  const enemyTypes = ['dark-soldier', 'shadow-archer', 'aura-hunter', 'dark-guardian', 'demon-beast'];
  for (const enemy of enemyTypes) {
    const enemyScene = buildEnemyScene(enemy);
    await saveGLB(enemyScene, humanoidClips, `public/assets/characters/${enemy}.glb`);
    // Also save to public/assets/enemies/ to satisfy both paths
    await saveGLB(enemyScene, humanoidClips, `public/assets/enemies/${enemy}.glb`);
  }

  // 4. Weapons
  const swordScene = buildEnergySwordScene();
  await saveGLB(swordScene, [], 'public/assets/weapons/energy-sword.glb');

  const shieldScene = buildAuraShieldScene();
  await saveGLB(shieldScene, [], 'public/assets/weapons/aura-shield.glb');

  const axeScene = buildDreadAxeScene();
  await saveGLB(axeScene, [], 'public/assets/weapons/dread-axe.glb');

  // 5. City Environment
  const cityScene = buildFuturisticCityScene();
  await saveGLB(cityScene, [], 'public/assets/environment/city/sector-1.glb');

  console.log('All 3D GLB assets generated successfully!');
}

run().catch((err) => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
