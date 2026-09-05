import * as THREE from 'three';
import { AbilityId, DamageNumber, EnemyState, EnemyType, PlayerStats } from '../types';
import { soundManager } from './audio';
import { CharacterRig, createDreadLordCharacter, createEnemyMesh, createHeroCharacter } from './characterBuilder';
import { buildEnvironment, WorldProps } from './world';
import { getPortrait } from './portraits';

export interface CombatEventCallbacks {
  onStatsUpdate: (stats: PlayerStats) => void;
  onDamageNumber: (dmg: DamageNumber) => void;
  onEnemyKilled: (enemy: EnemyState, xpGained: number) => void;
  onBossStateChange: (boss: EnemyState | null) => void;
  onQuestProgress: (stepType: string, count: number) => void;
  onChapterComplete: (chapterId: number) => void;
  onPlayerDied: () => void;
  onComboUpdate: (comboCount: number) => void;
}

export interface EnemyEntity {
  state: EnemyState;
  rig: CharacterRig;
  attackCooldown: number;
  isStaggered: boolean;
  staggerTimer: number;
  mesh: THREE.Group;
}

export interface Projectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  isHero: boolean;
  damage: number;
}

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animFrameId: number = 0;
  private lastTime: number = 0;

  // Environment & Colliders
  private world: WorldProps | null = null;
  private currentChapter: number = 1;

  // Hero
  private heroRig: CharacterRig;
  private playerStats: PlayerStats;
  private playerVelocity: THREE.Vector3 = new THREE.Vector3();
  private playerYaw: number = 0;
  private isBlocking: boolean = false;
  private isDashing: boolean = false;
  private dashTimer: number = 0;
  private dashDirection: THREE.Vector3 = new THREE.Vector3();

  // Attack Combos
  private comboStep: number = 0;
  private comboTimer: number = 0;
  private isAttacking: boolean = false;
  private attackAnimTime: number = 0;
  private comboHitCounter: number = 0;
  private comboResetTimer: number = 0;

  // Abilities
  private abilityCooldowns: Record<AbilityId, number> = {
    energySlash: 0,
    auraDash: 0,
    groundBreaker: 0,
    ultimate: 0,
  };
  private isUltimateActive: boolean = false;
  private ultimateTimer: number = 0;

  // Camera Orbit
  private cameraPitch: number = 0.25;
  private cameraYaw: number = 0;
  private cameraDistance: number = 7.5;
  private targetCameraDistance: number = 7.5;
  private screenShake: number = 0;

  // Controls input state
  private keys: Record<string, boolean> = {};
  private joystickVector: { x: number; y: number } = { x: 0, y: 0 };
  private isPointerLocked: boolean = false;
  private isDraggingCamera: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  // Entities
  private enemies: EnemyEntity[] = [];
  private activeBoss: EnemyEntity | null = null;
  private projectiles: Projectile[] = [];

  // Particles
  private shockwaves: { mesh: THREE.Mesh; life: number; maxLife: number; maxRadius: number }[] = [];

  // Throttled stats update timer
  private statsUpdateTimer: number = 0;
  private resizeObserver: ResizeObserver | null = null;
  private sunLight: THREE.DirectionalLight | null = null;
  private hemiLight: THREE.HemisphereLight | null = null;
  private isSprinting: boolean = false;
  private victoryTriggered: boolean = false;

  // Callbacks
  private callbacks: CombatEventCallbacks;

  constructor(container: HTMLElement, initialStats: PlayerStats, callbacks: CombatEventCallbacks) {
    this.container = container;
    this.playerStats = { ...initialStats };
    this.callbacks = callbacks;

    // Scene with beautiful natural sky background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x72a8e2);
    this.scene.fog = new THREE.FogExp2(0x93c5fd, 0.007);

    // If the admin generated a Battle Background image, use it as the backdrop instead
    // of the flat sky color (kept behind the 3D terrain/props, doesn't affect gameplay).
    const backgroundUrl = getPortrait('background');
    if (backgroundUrl) {
      new THREE.TextureLoader().load(backgroundUrl, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        this.scene.background = texture;
      });
    }

    // Camera
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 300);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    // Hero Setup
    this.heroRig = createHeroCharacter();
    this.scene.add(this.heroRig.root);

    // Lighting
    this.setupLighting();

    // Input listeners
    this.setupInputs();

    // Resize observer for robust responsive scaling
    window.addEventListener('resize', this.onResize);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.onResize();
      });
      this.resizeObserver.observe(this.container);
    }
  }

  private setupLighting() {
    // Ambient light with clear contrast
    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(ambient);

    // Hemisphere light: Natural Sky / Grass Ground
    this.hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x284218, 1.4);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // Directional Sun with optimized soft shadows (1024 for high mobile FPS)
    this.sunLight = new THREE.DirectionalLight(0xfffae6, 2.2);
    this.sunLight.position.set(30, 48, 24);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 160;
    const d = 42;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Dedicated Cyan Aura fill light following Hero
    const cyanPoint = new THREE.PointLight(0x00f0ff, 4.0, 16);
    cyanPoint.position.set(0, 2.2, 0.8);
    this.heroRig.root.add(cyanPoint);
  }

  public initChapter(chapterId: number) {
    this.currentChapter = chapterId;

    // Clear previous world cleanly without leaks
    if (this.world) {
      this.world.destroy();
      this.world = null;
    }
    this.world = buildEnvironment(this.scene, chapterId);

    // Update atmospheric lighting for chapter
    if (this.hemiLight && this.sunLight) {
      if (chapterId === 6) {
        this.hemiLight.color.setHex(0xff3b4e);
        this.hemiLight.groundColor.setHex(0x180508);
        this.sunLight.color.setHex(0xff4422);
        this.sunLight.intensity = 2.4;
      } else {
        this.hemiLight.color.setHex(0x93c5fd);
        this.hemiLight.groundColor.setHex(0x284218);
        this.sunLight.color.setHex(0xfffae6);
        this.sunLight.intensity = 2.2;
      }
    }

    // Ensure camera and viewport are synchronized
    this.onResize();

    // Reset Hero Position
    this.heroRig.root.position.set(0, 0, 0);
    this.heroRig.root.rotation.set(0, 0, 0);
    this.playerYaw = 0;
    this.cameraYaw = 0;
    this.cameraPitch = 0.25;
    this.victoryTriggered = false;

    // Clear existing enemies
    this.enemies.forEach(e => this.scene.remove(e.mesh));
    this.enemies = [];
    this.activeBoss = null;
    this.callbacks.onBossStateChange(null);

    // Spawn chapter specific enemies
    this.spawnChapterEntities(chapterId);

    // Start appropriate music
    soundManager.startMusic(chapterId === 6);
  }

  private spawnChapterEntities(chapterId: number) {
    if (chapterId === 1) {
      // Chapter 1: AWAKENING (3 Dark Soldiers, 1 Shadow Archer, 1 Mini-Boss Dark Guardian)
      this.spawnEnemy('dark_soldier', 'Dark Infiltrator A', -8, 8, 120);
      this.spawnEnemy('dark_soldier', 'Dark Infiltrator B', 8, 8, 120);
      this.spawnEnemy('dark_soldier', 'Dark Infiltrator C', 0, 14, 140);
      this.spawnEnemy('shadow_archer', 'Shadow Sniper Drone', 14, -6, 90);
      this.spawnEnemy('dark_guardian', 'Dread Lieutenant [Mini-Boss]', 0, 22, 380, true);
    } else if (chapterId === 2) {
      // Chapter 2: CITY UNDER ATTACK
      this.spawnEnemy('dark_soldier', 'Vanguard Trooper 1', -12, 10, 150);
      this.spawnEnemy('dark_soldier', 'Vanguard Trooper 2', 12, 10, 150);
      this.spawnEnemy('shadow_archer', 'Sky Archer Alpha', -15, -12, 120);
      this.spawnEnemy('shadow_archer', 'Sky Archer Beta', 15, -12, 120);
      this.spawnEnemy('aura_hunter', 'Aura Stalker', 0, 18, 190);
      this.spawnEnemy('dark_guardian', 'Siege Golem', 0, 28, 480, true);
    } else if (chapterId === 6) {
      // Chapter 6: FINAL CHRONICLES - THE DREAD LORD
      this.spawnBoss();
      // Also spawn two dread adds
      this.spawnEnemy('dark_soldier', 'Abyssal Minion', -10, 15, 200);
      this.spawnEnemy('dark_soldier', 'Abyssal Minion', 10, 15, 200);
    } else {
      // Chapters 3, 4, 5 default wave
      this.spawnEnemy('dark_soldier', 'Elite Vanguard', -10, 12, 180);
      this.spawnEnemy('aura_hunter', 'Dark Assassin', 10, 12, 180);
      this.spawnEnemy('shadow_archer', 'Void Archer', 0, -14, 140);
      this.spawnEnemy('dark_guardian', 'Void Behemoth', 0, 24, 600, true);
    }
  }

  private spawnEnemy(type: EnemyType, name: string, x: number, z: number, hp: number, isMiniBoss: boolean = false) {
    const rig = createEnemyMesh(type);
    rig.root.position.set(x, 0, z);
    this.scene.add(rig.root);

    const state: EnemyState = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      name,
      hp,
      maxHp: hp,
      attack: isMiniBoss ? 28 : (type === 'shadow_archer' ? 18 : 22),
      defense: isMiniBoss ? 16 : 8,
      speed: type === 'aura_hunter' ? 6.5 : (isMiniBoss ? 3.5 : 4.8),
      position: [x, 0, z],
      rotation: 0,
      state: 'idle',
      isBoss: isMiniBoss,
    };

    const entity: EnemyEntity = {
      state,
      rig,
      attackCooldown: 1.5,
      isStaggered: false,
      staggerTimer: 0,
      mesh: rig.root,
    };

    this.enemies.push(entity);
    if (isMiniBoss && this.currentChapter !== 6) {
      this.activeBoss = entity;
      this.callbacks.onBossStateChange(state);
    }
  }

  private spawnBoss() {
    const bossRig = createDreadLordCharacter();
    bossRig.root.position.set(0, 0, 22);
    this.scene.add(bossRig.root);

    // Villain Crimson Aura Point Light
    const bossAura = new THREE.PointLight(0xff002b, 4.0, 25);
    bossAura.position.set(0, 3.5, 0);
    bossRig.root.add(bossAura);

    const state: EnemyState = {
      id: 'dread_lord_boss',
      type: 'dread_lord',
      name: 'THE DREAD LORD - Harbinger of Ruin',
      hp: 1800,
      maxHp: 1800,
      attack: 42,
      defense: 25,
      speed: 4.8,
      position: [0, 0, 22],
      rotation: Math.PI,
      state: 'idle',
      phase: 1,
      maxPhase: 5,
      isBoss: true,
    };

    const bossEntity: EnemyEntity = {
      state,
      rig: bossRig,
      attackCooldown: 2.0,
      isStaggered: false,
      staggerTimer: 0,
      mesh: bossRig.root,
    };

    this.enemies.push(bossEntity);
    this.activeBoss = bossEntity;
    this.callbacks.onBossStateChange(state);
    soundManager.setBossMusic(true);
    soundManager.playBossRoar();
  }

  private setupInputs() {
    const canvas = this.renderer.domElement;

    window.addEventListener('keydown', (e) => {
      const code = e.code;
      this.keys[code] = true;

      // Abilities Hotkeys
      if (code === 'KeyQ') this.triggerAbility('energySlash');
      if (code === 'KeyE') this.triggerAbility('groundBreaker');
      if (code === 'KeyR') this.triggerAbility('ultimate');
      if (code === 'Space') {
        e.preventDefault();
        this.triggerAbility('auraDash');
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse controls on canvas
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        // Left Click: Attack
        this.triggerAttack();
      } else if (e.button === 2) {
        // Right Click: Shield
        e.preventDefault();
        this.setShield(true);
      }
      this.isDraggingCamera = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        this.setShield(false);
      }
      this.isDraggingCamera = false;
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('mousemove', (e) => {
      if (this.isDraggingCamera) {
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;
        this.cameraYaw -= deltaX * 0.005;
        this.cameraPitch = Math.max(-0.2, Math.min(0.9, this.cameraPitch + deltaY * 0.004));
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    });

    // Touch controls for camera swipe
    let touchStartX = 0;
    let touchStartY = 0;
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        this.cameraYaw -= dx * 0.004;
        this.cameraPitch = Math.max(-0.2, Math.min(0.9, this.cameraPitch + dy * 0.003));
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      }
    }, { passive: true });
  }

  // --- MOBILE JOYSTICK & BUTTON HOOKS ---
  public setJoystick(x: number, y: number) {
    this.joystickVector = { x, y };
  }

  public triggerAttack() {
    if (this.isAttacking || this.isBlocking) return;

    this.isAttacking = true;
    this.attackAnimTime = 0;
    this.comboStep = (this.comboStep % 3) + 1;
    this.comboTimer = 0.65;

    soundManager.playSwordSwing(this.comboStep);

    // Check hit immediately along forward arc
    setTimeout(() => this.performMeleeHitCheck(), 120);
  }

  public setShield(blocking: boolean) {
    if (this.isBlocking === blocking) return;
    this.isBlocking = blocking;

    if (blocking) {
      soundManager.playShield();
    }
  }

  public triggerAbility(id: AbilityId) {
    if (this.abilityCooldowns[id] > 0) return;

    if (id === 'auraDash') {
      if (this.playerStats.energy < 20) return;
      this.consumeEnergy(20);
      this.abilityCooldowns.auraDash = 3.5;
      this.isDashing = true;
      this.dashTimer = 0.28;

      // Dash in current move direction or facing direction
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerYaw);
      this.dashDirection.copy(forward).normalize();
      soundManager.playDash();

      // Dash attack hitbox
      this.checkDashHit();
    } else if (id === 'energySlash') {
      if (this.playerStats.energy < 25) return;
      this.consumeEnergy(25);
      this.abilityCooldowns.energySlash = 4.0;
      this.fireEnergySlash();
    } else if (id === 'groundBreaker') {
      if (this.playerStats.energy < 40) return;
      this.consumeEnergy(40);
      this.abilityCooldowns.groundBreaker = 7.0;
      this.performGroundBreaker();
    } else if (id === 'ultimate') {
      if (this.playerStats.energy < 75) return;
      this.consumeEnergy(75);
      this.abilityCooldowns.ultimate = 20.0;
      this.performUltimate();
    }
  }

  private consumeEnergy(amount: number) {
    this.playerStats.energy = Math.max(0, this.playerStats.energy - amount);
    this.callbacks.onStatsUpdate({ ...this.playerStats });
  }

  private performMeleeHitCheck() {
    const heroPos = this.heroRig.root.position;
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerYaw);

    const hitRange = 3.2;
    let hitCount = 0;

    for (const enemy of this.enemies) {
      if (enemy.state.state === 'dead') continue;

      const ePos = enemy.mesh.position;
      const dist = heroPos.distanceTo(ePos);

      if (dist <= hitRange) {
        const toEnemy = new THREE.Vector3().subVectors(ePos, heroPos).normalize();
        const dot = forward.dot(toEnemy);

        if (dot > 0.35) {
          // Hit connected!
          hitCount++;
          const isCrit = Math.random() < this.playerStats.critChance;
          const rawDamage = this.playerStats.attack * (1 + (this.comboStep - 1) * 0.3);
          const finalDamage = Math.max(8, Math.round(rawDamage - enemy.state.defense * 0.5)) * (isCrit ? 1.75 : 1);

          this.damageEnemy(enemy, Math.round(finalDamage), isCrit);
          this.screenShake = Math.max(this.screenShake, isCrit ? 0.35 : 0.15);

          // Knockback
          enemy.mesh.position.addScaledVector(toEnemy, 0.4);
          enemy.isStaggered = true;
          enemy.staggerTimer = 0.35;
        }
      }
    }

    if (hitCount > 0) {
      this.comboHitCounter += hitCount;
      this.comboResetTimer = 3.0;
      this.callbacks.onComboUpdate(this.comboHitCounter);
    }
  }

  private checkDashHit() {
    const heroPos = this.heroRig.root.position;
    for (const enemy of this.enemies) {
      if (enemy.state.state === 'dead') continue;
      if (heroPos.distanceTo(enemy.mesh.position) < 3.0) {
        this.damageEnemy(enemy, Math.round(this.playerStats.attack * 0.9), true);
      }
    }
  }

  private fireEnergySlash() {
    soundManager.playEnergySlash();

    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerYaw);
    const startPos = this.heroRig.root.position.clone().add(new THREE.Vector3(0, 1.3, 0)).addScaledVector(forward, 1.2);

    // Cyan crescent slash geometry
    const slashGeo = new THREE.TorusGeometry(1.2, 0.14, 8, 24, Math.PI);
    slashGeo.rotateX(Math.PI / 2);
    slashGeo.rotateZ(this.playerYaw + Math.PI / 2);

    const slashMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.9,
    });
    const slashMesh = new THREE.Mesh(slashGeo, slashMat);
    slashMesh.position.copy(startPos);
    this.scene.add(slashMesh);

    this.projectiles.push({
      mesh: slashMesh,
      velocity: forward.clone().multiplyScalar(24),
      life: 1.2,
      isHero: true,
      damage: Math.round(this.playerStats.attack * 1.8),
    });
  }

  private performGroundBreaker() {
    soundManager.playGroundBreaker();
    this.screenShake = 0.45;

    // Create radial shockwave mesh
    const waveGeo = new THREE.RingGeometry(0.5, 1.2, 32);
    waveGeo.rotateX(-Math.PI / 2);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0x00f7ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const waveMesh = new THREE.Mesh(waveGeo, waveMat);
    waveMesh.position.copy(this.heroRig.root.position).setY(0.08);
    this.scene.add(waveMesh);

    this.shockwaves.push({
      mesh: waveMesh,
      life: 0,
      maxLife: 0.6,
      maxRadius: 10,
    });

    // Damage and knock airborne all nearby enemies
    const heroPos = this.heroRig.root.position;
    for (const enemy of this.enemies) {
      if (enemy.state.state === 'dead') continue;
      const dist = heroPos.distanceTo(enemy.mesh.position);
      if (dist <= 8.5) {
        const dmg = Math.round(this.playerStats.attack * 1.5 * (1 - dist / 10));
        this.damageEnemy(enemy, dmg, true);
        enemy.isStaggered = true;
        enemy.staggerTimer = 0.8;
      }
    }
  }

  private performUltimate() {
    this.isUltimateActive = true;
    this.ultimateTimer = 1.4;
    soundManager.playUltimate();
    this.targetCameraDistance = 12.0;

    setTimeout(() => {
      this.screenShake = 0.7;

      // Giant cyan shockwave
      const waveGeo = new THREE.RingGeometry(1, 2.5, 48);
      waveGeo.rotateX(-Math.PI / 2);
      const waveMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1.0,
      });
      const waveMesh = new THREE.Mesh(waveGeo, waveMat);
      waveMesh.position.copy(this.heroRig.root.position).setY(0.12);
      this.scene.add(waveMesh);

      this.shockwaves.push({
        mesh: waveMesh,
        life: 0,
        maxLife: 1.0,
        maxRadius: 26,
      });

      // Massive damage to all enemies on battlefield
      const heroPos = this.heroRig.root.position;
      for (const enemy of this.enemies) {
        if (enemy.state.state === 'dead') continue;
        const dist = heroPos.distanceTo(enemy.mesh.position);
        if (dist <= 22) {
          const dmg = Math.round(this.playerStats.attack * 4.2);
          this.damageEnemy(enemy, dmg, true);
          enemy.isStaggered = true;
          enemy.staggerTimer = 1.2;
        }
      }

      this.targetCameraDistance = 7.5;
      this.isUltimateActive = false;
    }, 650);
  }

  private damageEnemy(enemy: EnemyEntity, damage: number, isCrit: boolean) {
    soundManager.playHit(isCrit);
    enemy.state.hp = Math.max(0, enemy.state.hp - damage);

    // Spawn 2D floating damage number
    const screenPos = this.toScreenPosition(enemy.mesh.position);
    this.callbacks.onDamageNumber({
      id: Math.random().toString(),
      value: damage,
      x: screenPos.x,
      y: screenPos.y - 40,
      isCrit,
      opacity: 1,
    });

    // Check boss phase transition
    if (enemy.state.isBoss && enemy.state.type === 'dread_lord') {
      const maxHp = enemy.state.maxHp;
      const hp = enemy.state.hp;
      let newPhase = 1;
      if (hp <= maxHp * 0.2) newPhase = 5;
      else if (hp <= maxHp * 0.4) newPhase = 4;
      else if (hp <= maxHp * 0.6) newPhase = 3;
      else if (hp <= maxHp * 0.8) newPhase = 2;

      if (newPhase !== enemy.state.phase) {
        enemy.state.phase = newPhase;
        soundManager.playBossRoar();
        this.screenShake = 0.5;

        // Phase 3 summon
        if (newPhase === 3) {
          const bx = enemy.mesh.position.x;
          const bz = enemy.mesh.position.z;
          this.spawnEnemy('dark_soldier', 'Shadow Fiend', bx - 5, bz + 3, 140);
          this.spawnEnemy('dark_soldier', 'Shadow Fiend', bx + 5, bz + 3, 140);
        }
      }
      this.callbacks.onBossStateChange({ ...enemy.state });
    }

    if (enemy.state.hp <= 0 && enemy.state.state !== 'dead') {
      enemy.state.state = 'dead';
      const xp = enemy.state.isBoss ? 450 : 65;
      this.callbacks.onEnemyKilled(enemy.state, xp);

      // Restore some energy to hero on kill
      this.playerStats.energy = Math.min(this.playerStats.maxEnergy, this.playerStats.energy + 20);
      this.callbacks.onStatsUpdate({ ...this.playerStats });

      // If all enemies dead or boss dead, check victory
      const allDead = this.enemies.every(e => e.state.hp <= 0);
      if (allDead) {
        this.victoryTriggered = true;
        this.playRigAnimation(this.heroRig, 'victory', true, 0.3);
        setTimeout(() => this.callbacks.onChapterComplete(this.currentChapter), 1200);
      }
    }
  }

  private toScreenPosition(worldPos: THREE.Vector3): { x: number; y: number } {
    const vector = worldPos.clone();
    vector.y += 1.8;
    vector.project(this.camera);

    const widthHalf = (this.container.clientWidth || window.innerWidth) / 2;
    const heightHalf = (this.container.clientHeight || window.innerHeight) / 2;

    return {
      x: vector.x * widthHalf + widthHalf,
      y: -(vector.y * heightHalf) + heightHalf,
    };
  }

  // --- MAIN LOOP ---
  public start() {
    this.lastTime = performance.now();
    const animate = (time: number) => {
      this.animFrameId = requestAnimationFrame(animate);
      const delta = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;

      this.update(delta);
      this.render();
    };
    this.animFrameId = requestAnimationFrame(animate);
  }

  public stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  private update(dt: number) {
    // Ability cooldowns
    for (const key of Object.keys(this.abilityCooldowns) as AbilityId[]) {
      if (this.abilityCooldowns[key] > 0) {
        this.abilityCooldowns[key] = Math.max(0, this.abilityCooldowns[key] - dt);
      }
    }

    // Energy regeneration (passive)
    if (!this.isBlocking && this.playerStats.energy < this.playerStats.maxEnergy) {
      this.playerStats.energy = Math.min(this.playerStats.maxEnergy, this.playerStats.energy + dt * 8);
      this.statsUpdateTimer += dt;
      if (this.statsUpdateTimer >= 0.12) {
        this.statsUpdateTimer = 0;
        this.callbacks.onStatsUpdate({ ...this.playerStats });
      }
    }

    // Shield active drains small energy
    if (this.isBlocking) {
      this.playerStats.energy = Math.max(0, this.playerStats.energy - dt * 10);
      if (this.playerStats.energy <= 0) {
        this.setShield(false);
      }
      this.statsUpdateTimer += dt;
      if (this.statsUpdateTimer >= 0.12) {
        this.statsUpdateTimer = 0;
        this.callbacks.onStatsUpdate({ ...this.playerStats });
      }
    }

    // Combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboStep = 0;
      }
    }
    if (this.comboResetTimer > 0) {
      this.comboResetTimer -= dt;
      if (this.comboResetTimer <= 0) {
        this.comboHitCounter = 0;
        this.callbacks.onComboUpdate(0);
      }
    }

    // Dash update
    if (this.isDashing) {
      this.dashTimer -= dt;
      this.heroRig.root.position.addScaledVector(this.dashDirection, this.playerStats.moveSpeed * 2.8 * dt);
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }

    // Hero Movement
    this.updateHeroMovement(dt);

    // World animation (flying cyber traffic, particles)
    if (this.world) {
      this.world.update(dt);
    }

    // Hero Animation
    this.updateHeroAnimation(dt);

    // Enemies AI & Animation
    this.updateEnemies(dt);

    // Projectiles
    this.updateProjectiles(dt);

    // Shockwaves
    this.updateShockwaves(dt);

    // Camera follow & shake
    this.updateCamera(dt);
  }

  private updateHeroMovement(dt: number) {
    if (this.isDashing) return;

    let moveX = 0;
    let moveZ = 0;

    // Desktop WASD
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    // Mobile Joystick
    if (Math.abs(this.joystickVector.x) > 0.05 || Math.abs(this.joystickVector.y) > 0.05) {
      moveX = this.joystickVector.x;
      moveZ = -this.joystickVector.y;
    }

    const inputLen = Math.hypot(moveX, moveZ);
    if (inputLen > 0.05 && !this.isAttacking) {
      const normX = moveX / Math.max(1, inputLen);
      const normZ = moveZ / Math.max(1, inputLen);

      // Relative to camera yaw
      const camYaw = this.cameraYaw;
      const worldDirX = normX * Math.cos(camYaw) + normZ * Math.sin(camYaw);
      const worldDirZ = -normX * Math.sin(camYaw) + normZ * Math.cos(camYaw);

      const isSprinting = (this.keys['ShiftLeft'] || this.keys['ShiftRight']) && !this.isBlocking;
      this.isSprinting = isSprinting;
      const speedMult = this.isBlocking ? 0.45 : (isSprinting ? 1.4 : 1.0);
      const speed = this.playerStats.moveSpeed * speedMult;

      const nextX = this.heroRig.root.position.x + worldDirX * speed * dt;
      const nextZ = this.heroRig.root.position.z + worldDirZ * speed * dt;

      // Simple arena boundary collision clamp
      const bound = 55;
      this.heroRig.root.position.x = Math.max(-bound, Math.min(bound, nextX));
      this.heroRig.root.position.z = Math.max(-bound, Math.min(bound, nextZ));

      // Turn hero towards movement direction
      const targetAngle = Math.atan2(worldDirX, -worldDirZ);
      this.playerYaw = targetAngle;
      this.heroRig.root.rotation.y = targetAngle;
    } else {
      this.isSprinting = false;
    }
  }

  private playRigAnimation(rig: CharacterRig, actionName: string, loop = true, fadeDuration = 0.2): void {
    if (!rig.mixer || !rig.actions) return;
    const key = actionName.toLowerCase();
    const nextAction = rig.actions[key];
    if (!nextAction) return;

    if (rig.currentAction === key && nextAction.isRunning()) {
      return;
    }

    const currentAction = rig.currentAction ? rig.actions[rig.currentAction] : null;
    if (currentAction && currentAction !== nextAction) {
      currentAction.fadeOut(fadeDuration);
    }

    nextAction.reset();
    nextAction.setEffectiveTimeScale(1);
    nextAction.setEffectiveWeight(1);
    nextAction.clampWhenFinished = !loop;
    nextAction.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
    nextAction.fadeIn(fadeDuration);
    nextAction.play();

    rig.currentAction = key;
  }

  private updateHeroAnimation(dt: number) {
    this.heroRig.animTime += dt;
    const t = this.heroRig.animTime;

    // GLTF Animation Mixer update when GLB model is active
    if (this.heroRig.mixer) {
      this.heroRig.mixer.update(dt);
    }

    // Breathing / Idle Core Pulse
    if (this.heroRig.coreMesh) {
      const pulse = 1.0 + 0.25 * Math.sin(t * 4);
      this.heroRig.coreMesh.scale.set(pulse, pulse, pulse);
    }

    // Shield Hologram Expansion
    if (this.heroRig.shield) {
      const targetScale = this.isBlocking ? 1.0 : 0.0;
      this.heroRig.shield.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), dt * 15);
      if (this.heroRig.shieldGlow) {
        (this.heroRig.shieldGlow.material as THREE.MeshStandardMaterial).opacity = this.isBlocking ? 0.85 : 0;
      }
    }

    // Walking / Running swing
    const isMoving = Math.hypot(this.joystickVector.x, this.joystickVector.y) > 0.05 ||
      this.keys['KeyW'] || this.keys['KeyS'] || this.keys['KeyA'] || this.keys['KeyD'];

    // Update 3D Skeletal Animation Action State
    if (this.playerStats.hp <= 0) {
      this.playRigAnimation(this.heroRig, 'death', false, 0.2);
    } else if (this.victoryTriggered) {
      this.playRigAnimation(this.heroRig, 'victory', true, 0.3);
    } else if (this.isAttacking) {
      if (this.comboStep === 3) {
        this.playRigAnimation(this.heroRig, 'heavy attack', false, 0.1);
      } else {
        this.playRigAnimation(this.heroRig, 'attack', false, 0.1);
      }
    } else if (this.isBlocking) {
      this.playRigAnimation(this.heroRig, 'block', true, 0.15);
    } else if (this.isDashing) {
      this.playRigAnimation(this.heroRig, 'dodge', false, 0.1);
    } else if (isMoving) {
      this.playRigAnimation(this.heroRig, this.isSprinting ? 'run' : 'walk', true, 0.18);
    } else {
      this.playRigAnimation(this.heroRig, 'idle', true, 0.25);
    }

    if (isMoving && !this.isAttacking) {
      const walkSpeed = 10;
      this.heroRig.leftLeg.rotation.x = Math.sin(t * walkSpeed) * 0.65;
      this.heroRig.rightLeg.rotation.x = -Math.sin(t * walkSpeed) * 0.65;

      if (!this.isBlocking) {
        this.heroRig.leftArm.rotation.x = -Math.sin(t * walkSpeed) * 0.45;
        this.heroRig.rightArm.rotation.x = Math.sin(t * walkSpeed) * 0.45;
      }
    } else if (!this.isAttacking) {
      // Idle return
      this.heroRig.leftLeg.rotation.x = THREE.MathUtils.lerp(this.heroRig.leftLeg.rotation.x, 0, dt * 10);
      this.heroRig.rightLeg.rotation.x = THREE.MathUtils.lerp(this.heroRig.rightLeg.rotation.x, 0, dt * 10);
      if (!this.isBlocking) {
        this.heroRig.leftArm.rotation.x = THREE.MathUtils.lerp(this.heroRig.leftArm.rotation.x, 0, dt * 10);
        this.heroRig.rightArm.rotation.x = THREE.MathUtils.lerp(this.heroRig.rightArm.rotation.x, 0, dt * 10);
      }
    }

    // --- Procedural whole-body motion for the mounted custom mesh ---
    // Used when the loaded GLB has no bone-driven animation clips (e.g. a static/unrigged
    // custom model): fakes walk bob/lean, attack lunge + spin, block crouch, dodge dip,
    // idle breathing and a death topple directly on the mesh transform, so it still reads
    // as a moving, fighting character rather than a frozen statue. The weapon/shield still
    // swing via the hand-anchor rotations above; this adds motion to the body itself.
    if (this.heroRig.needsProceduralMotion && this.heroRig.meshGroup && this.heroRig.meshBasePosition) {
      const mesh = this.heroRig.meshGroup;
      const basePos = this.heroRig.meshBasePosition;
      const baseRotY = this.heroRig.meshBaseRotationY ?? 0;
      // For a 2D sprite billboard, rotating the mesh group's own X/Y axes has no visual
      // effect (a THREE.Sprite always faces the camera) — use the material's own 2D roll
      // instead to get an equivalent lean/tilt/spin feel.
      const spriteMat = this.heroRig.isSprite ? this.heroRig.spriteMaterial : undefined;

      if (this.playerStats.hp <= 0) {
        // Death: topple forward and settle to the ground
        mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, Math.PI / 2, dt * 3);
        mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, basePos.y - 0.35, dt * 3);
        if (spriteMat) spriteMat.rotation = THREE.MathUtils.lerp(spriteMat.rotation, Math.PI / 2, dt * 3);
      } else if (this.isAttacking) {
        const progress = Math.min(1, this.attackAnimTime / 0.35);
        const lunge = Math.sin(progress * Math.PI) * 0.22;
        mesh.position.z = basePos.z + lunge;
        mesh.position.y = basePos.y + Math.abs(Math.sin(progress * Math.PI)) * 0.05;
        mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, Math.sin(progress * Math.PI) * 0.18, dt * 25);
        if (this.comboStep === 3) {
          // Heavy attack: full body spin to match the 360 sword swing
          mesh.rotation.y = baseRotY + progress * Math.PI * 2;
          if (spriteMat) spriteMat.rotation = progress * Math.PI * 2;
        } else {
          mesh.rotation.y = THREE.MathUtils.lerp(
            mesh.rotation.y,
            baseRotY + (this.comboStep === 1 ? -0.28 : 0.22),
            dt * 20
          );
          if (spriteMat) {
            const tilt = (this.comboStep === 1 ? -0.3 : 0.3) * Math.sin(progress * Math.PI);
            spriteMat.rotation = THREE.MathUtils.lerp(spriteMat.rotation, tilt, dt * 25);
          }
        }
      } else if (this.isBlocking) {
        mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, 0.14, dt * 10);
        mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, basePos.y - 0.05, dt * 10);
        mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, baseRotY, dt * 10);
        mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, basePos.z, dt * 10);
        if (spriteMat) spriteMat.rotation = THREE.MathUtils.lerp(spriteMat.rotation, 0.1, dt * 10);
      } else if (this.isDashing) {
        mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, 0.32, dt * 15);
        mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, basePos.y + 0.05, dt * 15);
        if (spriteMat) spriteMat.rotation = THREE.MathUtils.lerp(spriteMat.rotation, 0.18, dt * 15);
      } else if (isMoving) {
        const strideSpeed = this.isSprinting ? 14 : 10;
        const bobHeight = this.isSprinting ? 0.09 : 0.06;
        mesh.position.y = basePos.y + Math.abs(Math.sin(t * strideSpeed)) * bobHeight;
        mesh.rotation.z = Math.sin(t * strideSpeed) * 0.05;
        mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, this.isSprinting ? 0.15 : 0.07, dt * 8);
        mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, baseRotY, dt * 8);
        mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, basePos.z, dt * 8);
        if (spriteMat) spriteMat.rotation = Math.sin(t * strideSpeed) * 0.05;
      } else if (this.victoryTriggered) {
        mesh.position.y = basePos.y + Math.abs(Math.sin(t * 6)) * 0.12;
        mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, 0, dt * 6);
        if (spriteMat) spriteMat.rotation = THREE.MathUtils.lerp(spriteMat.rotation, 0, dt * 6);
      } else {
        // Idle breathing sway
        mesh.position.y = basePos.y + Math.sin(t * 1.6) * 0.012;
        mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, 0, dt * 6);
        mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, baseRotY + Math.sin(t * 0.8) * 0.02, dt * 4);
        mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, 0, dt * 6);
        mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, basePos.z, dt * 6);
        if (spriteMat) spriteMat.rotation = THREE.MathUtils.lerp(spriteMat.rotation, Math.sin(t * 0.8) * 0.02, dt * 4);
      }
    }

    // Sword Attack Slashing
    if (this.isAttacking) {
      this.attackAnimTime += dt;
      const progress = this.attackAnimTime / 0.35;

      if (this.comboStep === 1) {
        // Horizontal Slash
        this.heroRig.rightArm.rotation.x = Math.PI / 2;
        this.heroRig.rightArm.rotation.y = Math.sin(progress * Math.PI) * 1.6 - 0.8;
      } else if (this.comboStep === 2) {
        // Upward Slash
        this.heroRig.rightArm.rotation.x = (1 - progress) * Math.PI - 0.5;
        this.heroRig.rightArm.rotation.y = 0.4;
      } else {
        // Heavy 360 spin
        this.heroRig.rightArm.rotation.x = Math.PI / 2;
        this.heroRig.body.rotation.y = progress * Math.PI * 2;
      }

      if (progress >= 1.0) {
        this.isAttacking = false;
        this.heroRig.body.rotation.y = 0;
        this.heroRig.rightArm.rotation.set(0, 0, 0);
      }
    }
  }

  private updateEnemies(dt: number) {
    const heroPos = this.heroRig.root.position;

    for (const enemy of this.enemies) {
      if (enemy.rig.mixer) {
        enemy.rig.mixer.update(dt);
      }

      if (enemy.state.state === 'dead') {
        this.playRigAnimation(enemy.rig, 'death', false, 0.2);
        // Fade out
        enemy.mesh.position.y -= dt * 0.8;
        if (enemy.mesh.position.y < -3) {
          this.scene.remove(enemy.mesh);
        }
        continue;
      }

      // Handle Stagger
      if (enemy.isStaggered) {
        this.playRigAnimation(enemy.rig, 'hit reaction', false, 0.1);
        enemy.staggerTimer -= dt;
        if (enemy.staggerTimer <= 0) {
          enemy.isStaggered = false;
        }
        continue;
      }

      const ePos = enemy.mesh.position;
      const distToHero = ePos.distanceTo(heroPos);

      // Turn towards hero
      const targetAngle = Math.atan2(heroPos.x - ePos.x, heroPos.z - ePos.z);
      enemy.mesh.rotation.y = targetAngle;

      const isRanged = enemy.state.type === 'shadow_archer';
      const attackDist = isRanged ? 14 : (enemy.state.isBoss ? 4.2 : 2.5);

      // AI States
      if (distToHero > attackDist) {
        // Chase hero
        this.playRigAnimation(enemy.rig, enemy.state.isBoss ? 'run' : 'walk', true, 0.2);
        const dir = new THREE.Vector3().subVectors(heroPos, ePos).normalize();
        ePos.addScaledVector(dir, enemy.state.speed * dt);

        // Leg walk swing
        enemy.rig.animTime += dt * 8;
        enemy.rig.leftLeg.rotation.x = Math.sin(enemy.rig.animTime) * 0.5;
        enemy.rig.rightLeg.rotation.x = -Math.sin(enemy.rig.animTime) * 0.5;

        if (enemy.rig.needsProceduralMotion && enemy.rig.meshGroup && enemy.rig.meshBasePosition) {
          const mesh = enemy.rig.meshGroup;
          const basePos = enemy.rig.meshBasePosition;
          mesh.position.y = basePos.y + Math.abs(Math.sin(enemy.rig.animTime)) * 0.06;
        }
      } else {
        // In Attack Range
        enemy.attackCooldown -= dt;
        if (enemy.attackCooldown <= 0) {
          enemy.attackCooldown = enemy.state.isBoss ? 1.8 : 2.2;
          this.playRigAnimation(enemy.rig, 'attack', false, 0.1);
          this.performEnemyAttack(enemy);
          enemy.rig.attackPulseTime = 0.35;
        } else {
          this.playRigAnimation(enemy.rig, 'idle', true, 0.25);
        }

        if (enemy.rig.needsProceduralMotion && enemy.rig.meshGroup && enemy.rig.meshBasePosition) {
          const mesh = enemy.rig.meshGroup;
          const basePos = enemy.rig.meshBasePosition;
          if (enemy.rig.attackPulseTime && enemy.rig.attackPulseTime > 0) {
            enemy.rig.attackPulseTime -= dt;
            const progress = 1 - Math.max(0, enemy.rig.attackPulseTime) / 0.35;
            mesh.position.z = basePos.z + Math.sin(progress * Math.PI) * 0.18;
          } else {
            mesh.position.y = basePos.y + Math.sin(this.heroRig.animTime * 1.6) * 0.012;
            mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, basePos.z, dt * 6);
          }
        }
      }
    }
  }

  private performEnemyAttack(enemy: EnemyEntity) {
    if (enemy.state.type === 'shadow_archer') {
      // Fire ranged red energy bolt
      const dir = new THREE.Vector3().subVectors(this.heroRig.root.position, enemy.mesh.position).normalize();
      const boltGeo = new THREE.SphereGeometry(0.3, 8, 8);
      const boltMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
      const bolt = new THREE.Mesh(boltGeo, boltMat);
      bolt.position.copy(enemy.mesh.position).setY(1.4);
      this.scene.add(bolt);

      this.projectiles.push({
        mesh: bolt,
        velocity: dir.multiplyScalar(16),
        life: 2.0,
        isHero: false,
        damage: enemy.state.attack,
      });
    } else {
      // Melee Swing
      const dist = enemy.mesh.position.distanceTo(this.heroRig.root.position);
      if (dist <= (enemy.state.isBoss ? 4.8 : 3.0)) {
        let dmg = enemy.state.attack;

        if (this.isBlocking) {
          soundManager.playShieldBlock();
          dmg = Math.round(dmg * 0.15); // 85% reduction
          this.callbacks.onDamageNumber({
            id: Math.random().toString(),
            value: 0,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2 - 30,
            isCrit: false,
            isBlocked: true,
            opacity: 1,
          });
        } else {
          soundManager.playHit(false);
          this.screenShake = 0.25;
        }

        this.playerStats.hp = Math.max(0, this.playerStats.hp - dmg);
        this.callbacks.onStatsUpdate({ ...this.playerStats });

        if (this.playerStats.hp <= 0) {
          this.callbacks.onPlayerDied();
        }
      }
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.velocity, dt);

      if (p.isHero) {
        // Check hits against enemies
        for (const enemy of this.enemies) {
          if (enemy.state.state === 'dead') continue;
          if (p.mesh.position.distanceTo(enemy.mesh.position) < 2.0) {
            this.damageEnemy(enemy, p.damage, true);
            p.life = 0;
            break;
          }
        }
      } else {
        // Enemy projectile hits Hero
        if (p.mesh.position.distanceTo(this.heroRig.root.position) < 1.6) {
          p.life = 0;
          let dmg = p.damage;
          if (this.isBlocking) {
            soundManager.playShieldBlock();
            dmg = Math.round(dmg * 0.15);
          } else {
            soundManager.playHit(false);
          }
          this.playerStats.hp = Math.max(0, this.playerStats.hp - dmg);
          this.callbacks.onStatsUpdate({ ...this.playerStats });

          if (this.playerStats.hp <= 0) {
            this.callbacks.onPlayerDied();
          }
        }
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateShockwaves(dt: number) {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.life += dt;
      const progress = s.life / s.maxLife;
      const radius = progress * s.maxRadius;
      s.mesh.scale.set(radius, radius, radius);
      (s.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - progress;

      if (s.life >= s.maxLife) {
        this.scene.remove(s.mesh);
        this.shockwaves.splice(i, 1);
      }
    }
  }

  private updateCamera(dt: number) {
    const heroPos = this.heroRig.root.position;
    const targetLookAt = heroPos.clone().setY(heroPos.y + 1.6);

    // Dynamic combat zoom (5-7 meters behind Hero)
    if (!this.isUltimateActive) {
      let hasNearEnemy = false;
      let closestEnemyPos: THREE.Vector3 | null = null;
      let closestDist = 9.0;

      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.state.state !== 'dead') {
          const d = e.mesh.position.distanceTo(heroPos);
          if (d < 7.0) {
            hasNearEnemy = true;
          }
          if (d < closestDist) {
            closestDist = d;
            closestEnemyPos = e.mesh.position;
          }
        }
      }

      // 5-7m distance as requested by user
      this.targetCameraDistance = hasNearEnemy ? 5.6 : 6.8;

      // Smooth combat auto-framing: offset lookAt towards closest enemy to keep both Hero and Enemy in frame
      if (closestEnemyPos) {
        const combatMidPoint = new THREE.Vector3().addVectors(heroPos, closestEnemyPos).multiplyScalar(0.5);
        combatMidPoint.y = heroPos.y + 1.5;
        targetLookAt.lerp(combatMidPoint, 0.35);
      }
    }

    // Smooth camera distance lerp
    this.cameraDistance = THREE.MathUtils.lerp(this.cameraDistance, this.targetCameraDistance, dt * 6);

    // Calculate camera position based on yaw, pitch, and distance
    const cx = heroPos.x + Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;
    const cy = heroPos.y + 1.6 + Math.sin(this.cameraPitch) * this.cameraDistance;
    const cz = heroPos.z + Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;

    // Apply Screen Shake
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      this.camera.position.set(cx + shakeX, cy + shakeY, cz);
      this.screenShake = Math.max(0, this.screenShake - dt * 1.5);
    } else {
      this.camera.position.set(cx, cy, cz);
    }

    this.camera.lookAt(targetLookAt);
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public destroy() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.world) {
      this.world.destroy();
      this.world = null;
    }
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
    soundManager.stopMusic();
  }
}
