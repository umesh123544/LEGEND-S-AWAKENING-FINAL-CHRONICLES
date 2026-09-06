import { AbilityId, DamageNumber, EnemyState, EnemyType, PlayerStats } from '../types';
import { soundManager } from './audio';
import { getFrames, getPortrait } from './portraits';

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

type ActionState = 'idle' | 'walk' | 'attack' | 'jump' | 'hurt' | 'dead';

interface Sprite2D {
  frames: Record<'idle' | 'walk' | 'attack' | 'jump', HTMLImageElement[]>;
  fallbackColor: string;
  label: string;
}

interface Enemy2D {
  id: string;
  type: EnemyType;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  x: number;
  facing: 1 | -1;
  state: ActionState;
  frameIndex: number;
  frameTimer: number;
  attackCooldown: number;
  hurtTimer: number;
  isBoss: boolean;
  sprite: Sprite2D;
}

const GROUND_Y_RATIO = 0.74; // fraction of canvas height where the ground line sits
const CHAR_HEIGHT_PX = 160;
const ATTACK_RANGE_PX = 90;
const ATTACK_DURATION = 0.32;
const JUMP_VELOCITY = 620;
const GRAVITY = 1700;
const WALK_SPEED = 210;
const SPRINT_MULT = 1.55;
const WORLD_WIDTH = 4200;

const ENEMY_BASE_STATS: Record<EnemyType, { hp: number; attack: number; defense: number; speed: number; xp: number; label: string }> = {
  dark_soldier: { hp: 60, attack: 8, defense: 2, speed: 90, xp: 15, label: 'Dark Soldier' },
  shadow_archer: { hp: 45, attack: 10, defense: 1, speed: 100, xp: 18, label: 'Shadow Archer' },
  aura_hunter: { hp: 70, attack: 9, defense: 3, speed: 110, xp: 20, label: 'Aura Hunter' },
  dark_guardian: { hp: 110, attack: 11, defense: 6, speed: 70, xp: 28, label: 'Dark Guardian' },
  demon_beast: { hp: 90, attack: 13, defense: 4, speed: 130, xp: 26, label: 'Demon Beast' },
  mini_boss: { hp: 320, attack: 16, defense: 8, speed: 95, xp: 90, label: 'Dread Lieutenant' },
  dread_lord: { hp: 900, attack: 22, defense: 12, speed: 100, xp: 500, label: 'The Dread Lord' },
};

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export class Game2DEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLElement;
  private callbacks: CombatEventCallbacks;
  private playerStats: PlayerStats;

  private running = false;
  private rafId = 0;
  private lastTime = 0;
  private resizeObserver: ResizeObserver;

  // Player
  private playerX = 400;
  private playerY = 0; // height above ground (px), 0 = grounded
  private playerVY = 0;
  private isGrounded = true;
  private facing: 1 | -1 = 1;
  private state: ActionState = 'idle';
  private frameIndex = 0;
  private frameTimer = 0;
  private attackTimer = 0;
  private comboStep = 0;
  private comboResetTimer = 0;
  private isBlocking = false;
  private isSprinting = false;
  private hurtTimer = 0;
  private invulnTimer = 0;
  private dashTimer = 0;
  private screenShake = 0;

  private joystickX = 0;
  private keys: Record<string, boolean> = {};

  private abilityCooldowns: Record<AbilityId, number> = {
    energySlash: 0,
    auraDash: 0,
    groundBreaker: 0,
    ultimate: 0,
  };

  private cameraX = 0;
  private currentChapter = 1;
  private enemies: Enemy2D[] = [];
  private boss: Enemy2D | null = null;
  private chapterComplete = false;

  private heroSprite: Sprite2D = { frames: { idle: [], walk: [], attack: [], jump: [] }, fallbackColor: '#38bdf8', label: 'Hero' };
  private enemySprites: Partial<Record<EnemyType, Sprite2D>> = {};
  private backgroundImg: HTMLImageElement | null = null;

  constructor(container: HTMLElement, initialStats: PlayerStats, callbacks: CombatEventCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.playerStats = { ...initialStats };

    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    container.appendChild(this.canvas);
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas not supported');
    this.ctx = ctx;

    this.resizeCanvas();
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(container);

    this.setupInput();
    this.loadAssets();
  }

  private resizeCanvas() {
    const rect = this.container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private get viewW() {
    return this.canvas.width / (Math.min(window.devicePixelRatio || 1, 2));
  }
  private get viewH() {
    return this.canvas.height / (Math.min(window.devicePixelRatio || 1, 2));
  }

  private async loadSpriteSet(key: string, fallbackColor: string, label: string): Promise<Sprite2D> {
    const sprite: Sprite2D = { frames: { idle: [], walk: [], attack: [], jump: [] }, fallbackColor, label };
    const frameUrls = getFrames(key as any);
    try {
      if (frameUrls) {
        for (const action of ['idle', 'walk', 'attack', 'jump'] as const) {
          const urls = frameUrls[action] || [];
          sprite.frames[action] = await Promise.all(urls.map(loadImage)).catch(() => []);
        }
      }
      if (sprite.frames.idle.length === 0) {
        const single = getPortrait(key as any);
        if (single) {
          const img = await loadImage(single).catch(() => null);
          if (img) {
            sprite.frames.idle = [img];
            sprite.frames.walk = [img];
            sprite.frames.attack = [img];
            sprite.frames.jump = [img];
          }
        }
      }
    } catch {
      // fall through to color-block placeholder rendering
    }
    return sprite;
  }

  private async loadAssets() {
    this.heroSprite = await this.loadSpriteSet('hero', '#38bdf8', 'Hero');

    const bgUrl = getPortrait('background' as any);
    if (bgUrl) {
      this.backgroundImg = await loadImage(bgUrl).catch(() => null);
    }
  }

  private async getEnemySprite(type: EnemyType): Promise<Sprite2D> {
    if (this.enemySprites[type]) return this.enemySprites[type]!;
    const base = ENEMY_BASE_STATS[type];
    const key = type === 'dread_lord' ? 'villain' : type === 'mini_boss' ? 'enemy_mini_boss' : `enemy_${type}`;
    const sprite = await this.loadSpriteSet(key, type === 'dread_lord' || type === 'mini_boss' ? '#ef4444' : '#f59e0b', base.label);
    this.enemySprites[type] = sprite;
    return sprite;
  }

  // ---------------------------------------------------------------------------
  // Public API (matches the old 3D GameEngine's interface)
  // ---------------------------------------------------------------------------

  public initChapter(chapterId: number) {
    this.currentChapter = chapterId;
    this.chapterComplete = false;
    this.enemies = [];
    this.boss = null;
    this.playerX = 300;
    this.cameraX = 0;
    this.callbacks.onBossStateChange(null);

    const regularCount = Math.min(3 + chapterId, 7);
    const pool: EnemyType[] = ['dark_soldier', 'shadow_archer', 'aura_hunter', 'dark_guardian', 'demon_beast'];
    for (let i = 0; i < regularCount; i++) {
      const type = pool[i % pool.length];
      this.spawnEnemy(type, 900 + i * 380 + Math.random() * 120, false);
    }

    const isFinalChapter = chapterId >= 5;
    const bossType: EnemyType = isFinalChapter ? 'dread_lord' : 'mini_boss';
    this.spawnEnemy(bossType, 900 + regularCount * 380 + 500, true);
  }

  private spawnEnemy(type: EnemyType, x: number, isBoss: boolean) {
    const base = ENEMY_BASE_STATS[type];
    const scale = 1 + (this.currentChapter - 1) * 0.12;
    const enemy: Enemy2D = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      name: base.label,
      hp: Math.round(base.hp * scale),
      maxHp: Math.round(base.hp * scale),
      attack: Math.round(base.attack * scale),
      defense: base.defense,
      speed: base.speed,
      x,
      facing: -1,
      state: 'idle',
      frameIndex: 0,
      frameTimer: 0,
      attackCooldown: 1,
      hurtTimer: 0,
      isBoss,
      sprite: { frames: { idle: [], walk: [], attack: [], jump: [] }, fallbackColor: '#f59e0b', label: base.label },
    };
    this.enemies.push(enemy);
    if (isBoss) this.boss = enemy;

    this.getEnemySprite(type).then((sprite) => {
      enemy.sprite = sprite;
    });
  }

  public start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  public destroy() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.resizeObserver.disconnect();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.remove();
  }

  public setJoystick(x: number, _y: number) {
    this.joystickX = x;
  }

  public triggerAttack() {
    if (this.state === 'dead' || this.attackTimer > 0) return;
    this.comboStep = this.comboStep >= 3 ? 1 : this.comboStep + 1;
    this.comboResetTimer = 1.1;
    this.attackTimer = ATTACK_DURATION;
    this.state = 'attack';
    this.frameIndex = 0;
    this.frameTimer = 0;
    soundManager.playSwordSwing(this.comboStep);
    this.resolveMeleeHit();
  }

  public triggerJump() {
    if (!this.isGrounded || this.state === 'dead') return;
    this.isGrounded = false;
    this.playerVY = JUMP_VELOCITY;
    this.state = 'jump';
    soundManager.playDash();
  }

  public setShield(blocking: boolean) {
    this.isBlocking = blocking;
    if (blocking) soundManager.playShield();
  }

  public triggerAbility(id: AbilityId) {
    if (this.abilityCooldowns[id] > 0 || this.state === 'dead') return;

    if (id === 'auraDash') {
      if (this.playerStats.energy < 20) return;
      this.consumeEnergy(20);
      this.abilityCooldowns.auraDash = 3.5;
      this.dashTimer = 0.22;
      this.invulnTimer = Math.max(this.invulnTimer, 0.25);
      soundManager.playDash();
    } else if (id === 'energySlash') {
      if (this.playerStats.energy < 25) return;
      this.consumeEnergy(25);
      this.abilityCooldowns.energySlash = 4.0;
      soundManager.playEnergySlash();
      this.areaDamage(ATTACK_RANGE_PX * 2.2, this.playerStats.attack * 1.6, false);
    } else if (id === 'groundBreaker') {
      if (this.playerStats.energy < 40) return;
      this.consumeEnergy(40);
      this.abilityCooldowns.groundBreaker = 7.0;
      soundManager.playGroundBreaker();
      this.screenShake = Math.max(this.screenShake, 0.6);
      this.areaDamage(ATTACK_RANGE_PX * 2.8, this.playerStats.attack * 2.2, true);
    } else if (id === 'ultimate') {
      if (this.playerStats.energy < 75) return;
      this.consumeEnergy(75);
      this.abilityCooldowns.ultimate = 20.0;
      soundManager.playUltimate();
      this.screenShake = Math.max(this.screenShake, 0.9);
      this.areaDamage(9999, this.playerStats.attack * 3.5, true);
    }
  }

  // ---------------------------------------------------------------------------
  // Combat
  // ---------------------------------------------------------------------------

  private consumeEnergy(amount: number) {
    this.playerStats.energy = Math.max(0, this.playerStats.energy - amount);
    this.callbacks.onStatsUpdate({ ...this.playerStats });
  }

  private resolveMeleeHit() {
    let hitAny = false;
    for (const enemy of this.enemies) {
      if (enemy.state === 'dead') continue;
      const dx = enemy.x - this.playerX;
      const facingTowards = Math.sign(dx || 1) === this.facing;
      if (Math.abs(dx) <= ATTACK_RANGE_PX && facingTowards) {
        hitAny = true;
        const isCrit = Math.random() < this.playerStats.critChance;
        const raw = this.playerStats.attack * (1 + (this.comboStep - 1) * 0.3);
        const dmg = Math.max(6, Math.round(raw - enemy.defense * 0.5)) * (isCrit ? 1.75 : 1);
        this.damageEnemy(enemy, Math.round(dmg), isCrit);
        this.screenShake = Math.max(this.screenShake, isCrit ? 0.35 : 0.15);
      }
    }
    this.callbacks.onComboUpdate(hitAny ? this.comboStep + (this.comboStep === 0 ? 1 : 0) : 0);
  }

  private areaDamage(range: number, amount: number, canHitMultiple: boolean) {
    for (const enemy of this.enemies) {
      if (enemy.state === 'dead') continue;
      const dx = Math.abs(enemy.x - this.playerX);
      if (dx <= range) {
        const isCrit = Math.random() < this.playerStats.critChance;
        this.damageEnemy(enemy, Math.round(amount * (isCrit ? 1.5 : 1)), isCrit);
        if (!canHitMultiple) break;
      }
    }
  }

  private damageEnemy(enemy: Enemy2D, amount: number, isCrit: boolean) {
    enemy.hp = Math.max(0, enemy.hp - amount);
    enemy.hurtTimer = 0.2;

    const screenX = enemy.x - this.cameraX;
    this.callbacks.onDamageNumber({
      id: `${enemy.id}-${Date.now()}-${Math.random()}`,
      value: amount,
      x: screenX,
      y: this.viewH * GROUND_Y_RATIO - CHAR_HEIGHT_PX,
      isCrit,
      opacity: 1,
    });

    if (enemy.hp <= 0 && enemy.state !== 'dead') {
      enemy.state = 'dead';
      const state = this.toEnemyState(enemy);
      this.callbacks.onEnemyKilled(state, ENEMY_BASE_STATS[enemy.type].xp);
      if (enemy.isBoss) {
        this.boss = null;
        this.callbacks.onBossStateChange(null);
        this.maybeCompleteChapter();
      }
    } else if (enemy.isBoss) {
      this.callbacks.onBossStateChange(this.toEnemyState(enemy));
    }
  }

  private maybeCompleteChapter() {
    const allDead = this.enemies.every((e) => e.state === 'dead');
    if (allDead && !this.chapterComplete) {
      this.chapterComplete = true;
      this.callbacks.onChapterComplete(this.currentChapter);
    }
  }

  private toEnemyState(enemy: Enemy2D): EnemyState {
    return {
      id: enemy.id,
      type: enemy.type,
      name: enemy.name,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      attack: enemy.attack,
      defense: enemy.defense,
      speed: enemy.speed,
      position: [enemy.x / 40, 0, 0],
      rotation: 0,
      state: enemy.state === 'dead' ? 'dead' : enemy.attackCooldown < 0.3 ? 'attack' : 'chase',
      isBoss: enemy.isBoss,
    };
  }

  private damagePlayer(amount: number) {
    if (this.invulnTimer > 0 || this.playerStats.hp <= 0) return;
    const reduced = this.isBlocking ? Math.round(amount * 0.3) : amount;
    this.playerStats.hp = Math.max(0, this.playerStats.hp - reduced);
    this.hurtTimer = 0.25;
    this.screenShake = Math.max(this.screenShake, 0.3);
    soundManager.playHit(false);
    this.callbacks.onStatsUpdate({ ...this.playerStats });
    this.callbacks.onDamageNumber({
      id: `player-${Date.now()}-${Math.random()}`,
      value: reduced,
      x: this.viewW / 2,
      y: this.viewH * GROUND_Y_RATIO - CHAR_HEIGHT_PX,
      isCrit: false,
      isPlayerDamage: true,
      isBlocked: this.isBlocking,
      opacity: 1,
    });
    if (this.playerStats.hp <= 0 && this.state !== 'dead') {
      this.state = 'dead';
      this.callbacks.onPlayerDied();
    }
  }

  // ---------------------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------------------

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;
    if (e.code === 'Space') {
      e.preventDefault();
      this.triggerAbility('auraDash');
    }
    if (e.code === 'KeyF') this.triggerJump();
    if (e.code === 'KeyQ') this.triggerAbility('energySlash');
    if (e.code === 'KeyE') this.triggerAbility('groundBreaker');
    if (e.code === 'KeyR') this.triggerAbility('ultimate');
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.isSprinting = true;
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.isSprinting = false;
  };

  private setupInput() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.canvas.addEventListener('mousedown', () => this.triggerAttack());
  }

  // ---------------------------------------------------------------------------
  // Update loop
  // ---------------------------------------------------------------------------

  private loop = (time: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;
    this.update(dt);
    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    for (const key of Object.keys(this.abilityCooldowns) as AbilityId[]) {
      this.abilityCooldowns[key] = Math.max(0, this.abilityCooldowns[key] - dt);
    }
    if (this.attackTimer > 0) this.attackTimer -= dt;
    if (this.comboResetTimer > 0) {
      this.comboResetTimer -= dt;
      if (this.comboResetTimer <= 0) {
        this.comboStep = 0;
        this.callbacks.onComboUpdate(0);
      }
    }
    if (this.hurtTimer > 0) this.hurtTimer -= dt;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.dashTimer > 0) this.dashTimer -= dt;
    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 1.5);

    this.updatePlayer(dt);
    this.updateEnemies(dt);

    this.cameraX += ((this.playerX - this.viewW / 2) - this.cameraX) * Math.min(1, dt * 6);
    this.cameraX = Math.max(0, Math.min(WORLD_WIDTH - this.viewW, this.cameraX));

    // Energy regen
    if (this.playerStats.energy < this.playerStats.maxEnergy) {
      this.playerStats.energy = Math.min(this.playerStats.maxEnergy, this.playerStats.energy + dt * 6);
      this.callbacks.onStatsUpdate({ ...this.playerStats });
    }
  }

  private updatePlayer(dt: number) {
    if (this.state === 'dead') return;

    let moveX = this.dashTimer > 0 ? this.facing * 900 : this.joystickX * WALK_SPEED * (this.isSprinting ? SPRINT_MULT : 1);
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX = -WALK_SPEED * (this.isSprinting ? SPRINT_MULT : 1);
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX = WALK_SPEED * (this.isSprinting ? SPRINT_MULT : 1);

    const isMoving = Math.abs(moveX) > 5 && this.attackTimer <= 0 && !this.isBlocking;
    if (isMoving) {
      this.playerX += moveX * dt;
      this.playerX = Math.max(60, Math.min(WORLD_WIDTH - 60, this.playerX));
      this.facing = moveX < 0 ? -1 : 1;
    }

    // Gravity / jump
    if (!this.isGrounded) {
      this.playerVY -= GRAVITY * dt;
      this.playerY += this.playerVY * dt;
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVY = 0;
        this.isGrounded = true;
      }
    }

    if (this.attackTimer > 0) this.state = 'attack';
    else if (!this.isGrounded) this.state = 'jump';
    else if (this.hurtTimer > 0) this.state = 'hurt';
    else if (isMoving) this.state = 'walk';
    else this.state = 'idle';

    this.advanceFrame(this as unknown as { state: ActionState; frameIndex: number; frameTimer: number }, dt, this.isSprinting);
  }

  private updateEnemies(dt: number) {
    for (const enemy of this.enemies) {
      if (enemy.state === 'dead') continue;
      if (enemy.hurtTimer > 0) enemy.hurtTimer -= dt;

      const dx = this.playerX - enemy.x;
      const dist = Math.abs(dx);
      enemy.facing = dx < 0 ? -1 : 1;

      if (dist > ATTACK_RANGE_PX * 0.9) {
        enemy.x += Math.sign(dx) * enemy.speed * dt;
        enemy.state = 'walk';
        enemy.attackCooldown = Math.max(enemy.attackCooldown, 0.4);
      } else {
        enemy.attackCooldown -= dt;
        if (enemy.attackCooldown <= 0) {
          enemy.attackCooldown = enemy.isBoss ? 1.6 : 2.1;
          enemy.state = 'attack';
          enemy.frameIndex = 0;
          enemy.frameTimer = 0;
          this.damagePlayer(enemy.attack);
        } else if (enemy.hurtTimer <= 0) {
          enemy.state = 'idle';
        }
      }

      this.advanceFrame(enemy, dt, false);
    }
  }

  private advanceFrame(entity: { state: ActionState; frameIndex: number; frameTimer: number }, dt: number, sprinting: boolean) {
    const duration = entity.state === 'attack' ? 0.1 : entity.state === 'walk' ? (sprinting ? 0.09 : 0.14) : entity.state === 'jump' ? 0.18 : 0.45;
    entity.frameTimer += dt;
    if (entity.frameTimer >= duration) {
      entity.frameTimer = 0;
      entity.frameIndex++;
    }
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  private getFrameImage(sprite: Sprite2D, state: ActionState, frameIndex: number): HTMLImageElement | null {
    const action = state === 'hurt' || state === 'dead' ? 'idle' : state;
    const frames = sprite.frames[action as 'idle' | 'walk' | 'attack' | 'jump'];
    if (!frames || frames.length === 0) return null;
    return frames[frameIndex % frames.length];
  }

  private drawCharacter(
    x: number,
    yOffset: number,
    facing: 1 | -1,
    sprite: Sprite2D,
    state: ActionState,
    frameIndex: number,
    hurt: boolean
  ) {
    const ctx = this.ctx;
    const screenX = x - this.cameraX;
    const groundY = this.viewH * GROUND_Y_RATIO;
    const img = this.getFrameImage(sprite, state, frameIndex);

    ctx.save();
    if (hurt) ctx.filter = 'brightness(1.8) saturate(0.3) sepia(1) hue-rotate(-40deg)';

    if (img) {
      const aspect = img.width / img.height;
      const h = CHAR_HEIGHT_PX;
      const w = h * aspect;
      ctx.translate(screenX, groundY - yOffset);
      ctx.scale(facing, 1);
      ctx.drawImage(img, -w / 2, -h, w, h);
    } else {
      // Placeholder block with label initial, so gameplay works before art is uploaded
      const h = CHAR_HEIGHT_PX;
      const w = h * 0.55;
      ctx.translate(screenX, groundY - yOffset);
      ctx.fillStyle = sprite.fallbackColor;
      ctx.beginPath();
      const r = 14;
      ctx.moveTo(-w / 2 + r, -h);
      ctx.arcTo(w / 2, -h, w / 2, -h + r, r);
      ctx.arcTo(w / 2, 0, w / 2 - r, 0, r);
      ctx.arcTo(-w / 2, 0, -w / 2, -r, r);
      ctx.arcTo(-w / 2, -h, -w / 2 + r, -h, r);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = `bold ${Math.round(h * 0.3)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(sprite.label.charAt(0), 0, -h / 2 + h * 0.1);
    }
    ctx.restore();
  }

  private render() {
    const ctx = this.ctx;
    const w = this.viewW;
    const h = this.viewH;

    ctx.save();
    const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 20 : 0;
    const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 20 : 0;
    ctx.translate(shakeX, shakeY);

    // Background
    if (this.backgroundImg) {
      const parallax = this.cameraX * 0.3;
      const offset = -(parallax % w);
      ctx.drawImage(this.backgroundImg, offset - w, 0, w, h);
      ctx.drawImage(this.backgroundImg, offset, 0, w, h);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1e3a5f');
      grad.addColorStop(1, '#0b1220');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // Ground
    const groundY = h * GROUND_Y_RATIO;
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, groundY, w, h - groundY);
    ctx.strokeStyle = 'rgba(56,189,248,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();

    // Enemies
    for (const enemy of this.enemies) {
      if (enemy.state === 'dead') continue;
      const screenX = enemy.x - this.cameraX;
      if (screenX < -200 || screenX > w + 200) continue;
      this.drawCharacter(enemy.x, 0, enemy.facing, enemy.sprite, enemy.state, enemy.frameIndex, enemy.hurtTimer > 0);

      // Mini health bar above regular enemies (boss uses the HUD bar instead)
      if (!enemy.isBoss) {
        const barW = 60;
        const barX = screenX - barW / 2;
        const barY = groundY - CHAR_HEIGHT_PX - 16;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barW, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(barX, barY, barW * (enemy.hp / enemy.maxHp), 6);
      }
    }

    // Player
    this.drawCharacter(this.playerX, this.playerY, this.facing, this.heroSprite, this.state, this.frameIndex, this.hurtTimer > 0);

    ctx.restore();
  }
}
