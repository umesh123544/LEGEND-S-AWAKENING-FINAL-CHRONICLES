import { ChapterInfo, DialogueMessage, GameSaveData, PlayerStats, QuestObjective } from '../types';

export const INITIAL_STATS: PlayerStats = {
  hp: 250,
  maxHp: 250,
  energy: 100,
  maxEnergy: 100,
  xp: 0,
  maxXp: 100,
  level: 1,
  attack: 35,
  defense: 12,
  critChance: 0.15,
  moveSpeed: 8.5,
};

export const CHAPTERS: ChapterInfo[] = [
  {
    id: 1,
    title: 'CHAPTER 1: AWAKENING',
    subtitle: 'THE FACILITY OF DAWN',
    description: 'Awaken in the ruined Cyber Research Facility. Calibrate your cybernetic armor, unleash the glowing Aura blade, and neutralize rogue Dark Infiltrators.',
    location: 'AURA Facility Sector 7',
    unlocked: true,
    completed: false,
  },
  {
    id: 2,
    title: 'CHAPTER 2: CITY UNDER ATTACK',
    subtitle: 'NEON CITADEL IN CRISIS',
    description: 'The Dread Lord’s vanguard has breached the sky-bridges of Neo-Kyoto. Defend the central plaza, eliminate swarms of Shadow Archers, and protect the energy core.',
    location: 'Neo-Kyoto Sky Plaza',
    unlocked: false,
    completed: false,
  },
  {
    id: 3,
    title: 'CHAPTER 3: THE LOST CORE',
    subtitle: 'SECRETS OF THE COLLAPSE',
    description: 'Infiltrate the subterranean vault of the Prime Architect. Align ancient resonance pylons and overcome the Corrupted Guardian.',
    location: 'Sub-Terra Vault Prime',
    unlocked: false,
    completed: false,
  },
  {
    id: 4,
    title: 'CHAPTER 4: THE DARK ARMY',
    subtitle: 'ASHES OF VALHALLA',
    description: 'Venture across the desolate wasteland. Overcome elite Dark Sentinels and ranged sniper platforms commanding the perimeter.',
    location: 'Obsidian Crater Rim',
    unlocked: false,
    completed: false,
  },
  {
    id: 5,
    title: 'CHAPTER 5: THE BETRAYAL',
    subtitle: 'SHADOW OF A BROTHER',
    description: 'Commander Jax reveals his dark pact with the Dread Lord. Escape the collapsing vortex before your AURA core is severed.',
    location: 'Void Spire Gate',
    unlocked: false,
    completed: false,
  },
  {
    id: 6,
    title: 'CHAPTER 6: THE FINAL CHRONICLES',
    subtitle: 'THE DREAD LORD CONFRONTATION',
    description: 'Enter the Crimson Abyss of the Dark Realm. Confront the Dread Lord across his 5 terrifying combat phases to seal the portal forever.',
    location: 'Dark Realm Throne of Ruin',
    unlocked: false,
    completed: false,
  },
];

export const CHAPTER_DIALOGUES: Record<number, DialogueMessage[]> = {
  1: [
    {
      speaker: 'A.U.R.A.',
      portrait: 'aura',
      text: 'Neural interface syncing... Welcome back, Operative. Your AURA Core has miraculously stabilized after 50 years of stasis.',
      voicePitch: 520,
    },
    {
      speaker: 'Hero',
      portrait: 'hero',
      text: 'My armor... it feels different. What happened to the world? What was "The Collapse"?',
      voicePitch: 320,
    },
    {
      speaker: 'A.U.R.A.',
      portrait: 'aura',
      text: 'Hostile biosignatures detected! The Dread Lord’s Dark Soldiers are breaching the quarantine blast doors. Draw your Energy Blade!',
      voicePitch: 580,
    },
  ],
  2: [
    {
      speaker: 'Hero',
      portrait: 'hero',
      text: 'The city... the skies are burning red. They’re hunting for the other AURA fragments.',
      voicePitch: 320,
    },
    {
      speaker: 'A.U.R.A.',
      portrait: 'aura',
      text: 'Long-range Shadow Archers are targeting civilians on the upper concourse. Engage your Holographic Energy Shield with Right Click to deflect fire!',
      voicePitch: 540,
    },
  ],
  6: [
    {
      speaker: 'The Dread Lord',
      portrait: 'villain',
      text: 'At last, the prodigal warrior arrives! Do you still not remember who forged that shining blue armor on your flesh?!',
      voicePitch: 120,
    },
    {
      speaker: 'Hero',
      portrait: 'hero',
      text: 'I don’t need to remember the past to know you belong in it! Your reign over this world ends today!',
      voicePitch: 340,
    },
    {
      speaker: 'The Dread Lord',
      portrait: 'villain',
      text: 'Fool! Your precious AURA was born from my abyss! WITNESS THE MIGHT OF THE DARK REALM!',
      voicePitch: 110,
    },
  ],
};

const STORAGE_KEY = 'legends_awakening_save_v1';

export function loadGameSave(): GameSaveData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load save data:', e);
    return null;
  }
}

export function saveGameData(data: GameSaveData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to write save data:', e);
  }
}

export function calculateLevelFromXp(xp: number, currentLevel: number): { level: number; didLevelUp: boolean; remainingXp: number; maxXp: number } {
  let level = currentLevel;
  let didLevelUp = false;
  let maxXp = level * 100;

  while (xp >= maxXp) {
    xp -= maxXp;
    level++;
    didLevelUp = true;
    maxXp = level * 100;
  }

  return { level, didLevelUp, remainingXp: xp, maxXp };
}
