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
    title: 'CHAPTER 1: EXILE INTO THE FOREST',
    subtitle: 'THE DANDAKA VAN',
    description: 'Banished from Ayodhya for fourteen years, Ram enters the deep Dandaka forest with Sita and Lakshman. Drive back the first Rakshasa raiders who stalk the woods.',
    location: 'Dandaka Van, the Great Forest',
    unlocked: true,
    completed: false,
  },
  {
    id: 2,
    title: 'CHAPTER 2: THE GOLDEN DEER',
    subtitle: "MARICHA'S ILLUSION",
    description: 'A dazzling golden deer draws Ram deep into the trees — a trap set by the demon Maricha. Fight through the illusion before it is too late for Sita.',
    location: 'Panchavati Woods',
    unlocked: false,
    completed: false,
  },
  {
    id: 3,
    title: "CHAPTER 3: SITA'S ABDUCTION",
    subtitle: 'THE FALL OF JATAYU',
    description: 'Ravan strikes while Ram is away. The noble vulture Jatayu battles the Rakshasa king to protect Sita and falls in the attempt. Ram vows to bring her home.',
    location: 'The Skies Above Panchavati',
    unlocked: false,
    completed: false,
  },
  {
    id: 4,
    title: 'CHAPTER 4: ALLIANCE OF THE VANARAS',
    subtitle: "HANUMAN'S OATH",
    description: 'Ram allies with Sugriva and the Vanara army. Hanuman leaps across the ocean to find Sita in captivity, and swears to help reclaim her.',
    location: 'Kishkindha & the Southern Shore',
    unlocked: false,
    completed: false,
  },
  {
    id: 5,
    title: 'CHAPTER 5: THE BRIDGE TO LANKA',
    subtitle: 'RAM SETU',
    description: "Vibhishan, Ravan's own brother, defects and warns Ram of Lanka's defenses. The Vanara army builds a bridge across the sea as Rakshasa forces guard the shore.",
    location: 'Ram Setu, the Ocean Crossing',
    unlocked: false,
    completed: false,
  },
  {
    id: 6,
    title: 'CHAPTER 6: THE BATTLE OF LANKA',
    subtitle: 'THE FALL OF RAVAN',
    description: 'Within the golden walls of Lanka, Ram confronts Ravan himself in single combat to free Sita and restore dharma to the world.',
    location: 'Lanka, the Golden City',
    unlocked: false,
    completed: false,
  },
];

export const CHAPTER_DIALOGUES: Record<number, DialogueMessage[]> = {
  1: [
    {
      speaker: 'Hanuman',
      portrait: 'aura',
      text: "Lord Ram, this forest hides many dangers. I will watch over you and Sita on this path, as I have sworn.",
      voicePitch: 420,
    },
    {
      speaker: 'Ram',
      portrait: 'hero',
      text: "Fourteen years of exile will not break my resolve, Hanuman. Wherever dharma calls, I will answer.",
      voicePitch: 320,
    },
    {
      speaker: 'Hanuman',
      portrait: 'aura',
      text: 'Rakshasa scouts approach through the trees! Draw your bow, Ram — they serve Ravan, King of Lanka.',
      voicePitch: 440,
    },
  ],
  2: [
    {
      speaker: 'Sita',
      portrait: 'sita',
      text: 'Ram, look — a deer of gold moves through the trees! I have never seen its like. Could you bring it to me?',
      voicePitch: 560,
    },
    {
      speaker: 'Ram',
      portrait: 'hero',
      text: "Something about its grace unsettles me... but if it brings you joy, Sita, I will chase it.",
      voicePitch: 320,
    },
    {
      speaker: 'Hanuman',
      portrait: 'aura',
      text: 'Be wary, Ram! This shimmer feels unnatural — it may be Maricha in disguise, sent to lure you away.',
      voicePitch: 440,
    },
  ],
  3: [
    {
      speaker: 'Jatayu',
      portrait: 'npc',
      text: 'Ram! Ravan came in the guise of a wandering ascetic and seized Sita while you were drawn away! I fought him with every feather I had...',
      voicePitch: 300,
    },
    {
      speaker: 'Ram',
      portrait: 'hero',
      text: 'Noble Jatayu, you gave everything to protect her. I swear on my father\'s name — I will bring Sita home, whatever the cost.',
      voicePitch: 320,
    },
    {
      speaker: 'Hanuman',
      portrait: 'aura',
      text: 'His trail leads south, toward the sea. Ravan\'s Rakshasa soldiers will guard every step of the way. Stay close, Ram.',
      voicePitch: 440,
    },
  ],
  4: [
    {
      speaker: 'Ram',
      portrait: 'hero',
      text: 'Hanuman, you crossed the ocean alone and found her. Tell me — is Sita safe?',
      voicePitch: 320,
    },
    {
      speaker: 'Hanuman',
      portrait: 'aura',
      text: 'She is captive in the Ashoka grove, unbroken in spirit, and she waits for you, Ram. The Vanara army stands ready to march.',
      voicePitch: 440,
    },
  ],
  5: [
    {
      speaker: 'Lakshman',
      portrait: 'npc',
      text: "Brother, a Rakshasa noble named Vibhishan has come to our camp. He says he can no longer serve his brother Ravan's cruelty.",
      voicePitch: 300,
    },
    {
      speaker: 'Ram',
      portrait: 'hero',
      text: 'Dharma does not ask where one was born, only where one stands. Welcome, Vibhishan — show us the way across.',
      voicePitch: 320,
    },
  ],
  6: [
    {
      speaker: 'Ravan',
      portrait: 'villain',
      text: 'So the exiled prince crosses the ocean for one woman! Ten heads have I bowed to no one — do you truly believe you can stand against me?',
      voicePitch: 120,
    },
    {
      speaker: 'Ram',
      portrait: 'hero',
      text: 'Power built on cruelty always falls, Ravan. Release Sita, or face the end your pride has written for you.',
      voicePitch: 340,
    },
    {
      speaker: 'Ravan',
      portrait: 'villain',
      text: 'Then let Lanka burn around us! WITNESS THE MIGHT OF THE RAKSHASA KING!',
      voicePitch: 110,
    },
  ],
};

const STORAGE_KEY = 'ramayan_rescue_of_sita_save_v1';

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
