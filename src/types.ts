export interface PlayerStats {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  xp: number;
  maxXp: number;
  level: number;
  attack: number;
  defense: number;
  critChance: number; // 0 - 1
  moveSpeed: number;
}

export type AbilityId = 'energySlash' | 'auraDash' | 'groundBreaker' | 'ultimate';

export interface AbilityState {
  id: AbilityId;
  name: string;
  description: string;
  key: string;
  energyCost: number;
  cooldown: number; // seconds
  currentCooldown: number;
  icon: string;
  unlocked: boolean;
}

export type EnemyType = 
  | 'dark_soldier' 
  | 'shadow_archer' 
  | 'aura_hunter' 
  | 'dark_guardian' 
  | 'demon_beast' 
  | 'mini_boss' 
  | 'dread_lord';

export interface EnemyState {
  id: string;
  type: EnemyType;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  position: [number, number, number];
  rotation: number;
  state: 'idle' | 'chase' | 'attack' | 'stagger' | 'dead';
  phase?: number; // for bosses
  maxPhase?: number;
  isBoss?: boolean;
}

export interface DamageNumber {
  id: string;
  value: number;
  x: number;
  y: number;
  isCrit: boolean;
  isPlayerDamage?: boolean;
  isBlocked?: boolean;
  opacity: number;
}

export interface DialogueMessage {
  speaker: 'Hero' | 'A.U.R.A.' | 'The Dread Lord' | 'Commander Jax' | 'Shadow Drone';
  portrait: 'hero' | 'aura' | 'villain' | 'npc';
  text: string;
  voicePitch?: number;
}

export interface ChapterInfo {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  location: string;
  unlocked: boolean;
  completed: boolean;
}

export interface QuestObjective {
  id: string;
  text: string;
  current: number;
  total: number;
  completed: boolean;
}

export interface GameSaveData {
  currentChapter: number;
  level: number;
  xp: number;
  stats: PlayerStats;
  unlockedAbilities: AbilityId[];
  completedChapters: number[];
  highScore: number;
}
