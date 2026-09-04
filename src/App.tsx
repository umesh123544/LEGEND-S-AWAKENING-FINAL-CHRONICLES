import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { soundManager } from './game/audio';
import {
  CHAPTERS,
  CHAPTER_DIALOGUES,
  INITIAL_STATS,
  calculateLevelFromXp,
  loadGameSave,
  saveGameData,
} from './game/gameState';
import { DamageNumber, DialogueMessage, EnemyState, PlayerStats } from './types';

// UI Components
import { MainMenu } from './components/MainMenu';
import { HUD } from './components/HUD';
import { DialogueModal } from './components/DialogueModal';
import { LevelUpModal } from './components/LevelUpModal';
import { ChapterVictoryModal } from './components/ChapterVictoryModal';
import { GameOverModal } from './components/GameOverModal';
import { CharacterModal } from './components/CharacterModal';
import { AbilitiesModal } from './components/AbilitiesModal';
import { ChapterSelectModal } from './components/ChapterSelectModal';
import { SettingsModal } from './components/SettingsModal';
import { PauseModal } from './components/PauseModal';
import { VirtualJoystick } from './components/VirtualJoystick';
import { LoadingScreen } from './components/LoadingScreen';
import { assetManager } from './game/AssetManager';

export default function App() {
  // Screen States
  const [screen, setScreen] = useState<'menu' | 'playing'>('menu');
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('Initializing A.U.R.A. Matrix...');

  // Modals
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isAbilitiesModalOpen, setIsAbilitiesModalOpen] = useState(false);
  const [isChapterSelectModalOpen, setIsChapterSelectModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);

  // Game Progress
  const [currentChapter, setCurrentChapter] = useState(1);
  const [unlockedChapters, setUnlockedChapters] = useState<number[]>([1, 6]);
  const [playerStats, setPlayerStats] = useState<PlayerStats>(INITIAL_STATS);
  const [activeDialogue, setActiveDialogue] = useState<DialogueMessage[] | null>(null);

  // Live HUD States
  const [bossState, setBossState] = useState<EnemyState | null>(null);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [comboCount, setComboCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Engine instance reference
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Load existing save on mount
  useEffect(() => {
    const save = loadGameSave();
    if (save) {
      setPlayerStats(save.stats);
      setCurrentChapter(save.currentChapter);
      setUnlockedChapters(save.completedChapters.length > 0 ? [...new Set([...save.completedChapters, 1, 6])] : [1, 6]);
    }

    // Touch device detection with dynamic resize support
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 840);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    window.addEventListener('touchstart', checkTouch, { once: true });

    return () => {
      window.removeEventListener('resize', checkTouch);
    };
  }, []);

  // Save game helper
  const persistGame = useCallback(
    (stats: PlayerStats, chapter: number, unlocked: number[]) => {
      saveGameData({
        currentChapter: chapter,
        level: stats.level,
        xp: stats.xp,
        stats,
        unlockedAbilities: ['energySlash', 'auraDash', 'groundBreaker', 'ultimate'],
        completedChapters: unlocked,
        highScore: 1000 * stats.level,
      });
    },
    []
  );

  // Start / Deploy a Chapter with cinematic loading screen
  const deployChapter = useCallback(
    (chapterId: number) => {
      setIsLoading(true);
      setLoadingProgress(10);
      setLoadingStatus('Initializing A.U.R.A. 3D Combat Pipeline...');

      // Progressive simulated and asset-tracked loading stages
      setTimeout(() => {
        setLoadingProgress(35);
        setLoadingStatus(chapterId >= 4 ? 'Loading Abyssal Citadel & Void Geometry...' : 'Loading Futuristic Cyber City & Neon Skylines...');
      }, 300);

      setTimeout(() => {
        setLoadingProgress(68);
        setLoadingStatus('Synthesizing Hero Exosuit, Energy Sword & Hologram Shield...');
      }, 650);

      setTimeout(() => {
        setLoadingProgress(92);
        setLoadingStatus('Calibrating Enemy Entities & Dread Lord AI Systems...');
      }, 1000);

      setTimeout(() => {
        setLoadingProgress(100);
        setLoadingStatus('Sector Synchronized. Entering Battlefield.');

        setTimeout(() => {
          setIsLoading(false);
          setCurrentChapter(chapterId);
          setScreen('playing');
          setIsPaused(false);
          setIsVictoryModalOpen(false);
          setIsGameOverModalOpen(false);
          setBossState(null);
          setComboCount(0);
          setDamageNumbers([]);

          // Trigger story cutscene if chapter has dialogue
          const dialogues = CHAPTER_DIALOGUES[chapterId];
          if (dialogues && dialogues.length > 0) {
            setActiveDialogue(dialogues);
          } else {
            setActiveDialogue(null);
          }
        }, 350);
      }, 1300);
    },
    []
  );

  // Instantiate or update 3D Engine when screen becomes 'playing'
  useEffect(() => {
    if (screen !== 'playing' || !containerRef.current) return;

    if (!engineRef.current) {
      const engine = new GameEngine(containerRef.current, playerStats, {
        onStatsUpdate: (updatedStats) => {
          setPlayerStats(updatedStats);
        },
        onDamageNumber: (dmg) => {
          setDamageNumbers((prev) => [...prev.slice(-15), dmg]);
          // auto fadeout
          setTimeout(() => {
            setDamageNumbers((prev) => prev.filter((d) => d.id !== dmg.id));
          }, 650);
        },
        onEnemyKilled: (_enemy, xpGained) => {
          setPlayerStats((prev) => {
            const newTotalXp = prev.xp + xpGained;
            const levelInfo = calculateLevelFromXp(newTotalXp, prev.level);

            let updated: PlayerStats = {
              ...prev,
              xp: levelInfo.remainingXp,
              maxXp: levelInfo.maxXp,
            };

            if (levelInfo.didLevelUp) {
              updated = {
                ...updated,
                level: levelInfo.level,
                maxHp: updated.maxHp + 45,
                hp: updated.maxHp + 45,
                maxEnergy: updated.maxEnergy + 15,
                energy: updated.maxEnergy + 15,
                attack: updated.attack + 8,
                defense: updated.defense + 4,
              };
              setIsLevelUpModalOpen(true);
            }

            persistGame(updated, currentChapter, unlockedChapters);
            return updated;
          });
        },
        onBossStateChange: (boss) => {
          setBossState(boss);
        },
        onQuestProgress: () => {},
        onChapterComplete: (chapId) => {
          setUnlockedChapters((prev) => {
            const nextChap = chapId + 1;
            const updated = prev.includes(nextChap) ? prev : [...prev, nextChap];
            persistGame(playerStats, chapId, updated);
            return updated;
          });
          setIsVictoryModalOpen(true);
        },
        onPlayerDied: () => {
          setIsGameOverModalOpen(true);
        },
        onComboUpdate: (count) => {
          setComboCount(count);
        },
      });

      engineRef.current = engine;
      engine.initChapter(currentChapter);
      engine.start();
    } else {
      engineRef.current.initChapter(currentChapter);
    }

    return () => {
      // Keep alive unless returning to menu
    };
  }, [screen, currentChapter, persistGame, playerStats, unlockedChapters]);

  // Clean up engine on unmount or returning to menu
  const handleReturnToMenu = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    soundManager.stopMusic();
    setScreen('menu');
    setIsPaused(false);
    setIsVictoryModalOpen(false);
    setIsGameOverModalOpen(false);
    setActiveDialogue(null);
  }, []);

  // Keyboard shortcut for ESC to pause/resume
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && screen === 'playing') {
        if (activeDialogue) {
          setActiveDialogue(null);
        } else if (
          isCharacterModalOpen ||
          isAbilitiesModalOpen ||
          isChapterSelectModalOpen ||
          isSettingsModalOpen
        ) {
          setIsCharacterModalOpen(false);
          setIsAbilitiesModalOpen(false);
          setIsChapterSelectModalOpen(false);
          setIsSettingsModalOpen(false);
        } else {
          setIsPaused((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    screen,
    activeDialogue,
    isCharacterModalOpen,
    isAbilitiesModalOpen,
    isChapterSelectModalOpen,
    isSettingsModalOpen,
  ]);

  // Reset Save helper
  const handleResetSave = () => {
    localStorage.removeItem('legends_awakening_save_v1');
    setPlayerStats(INITIAL_STATS);
    setCurrentChapter(1);
    setUnlockedChapters([1, 6]);
    setIsSettingsModalOpen(false);
  };

  const currentChapterObj = CHAPTERS.find((c) => c.id === currentChapter);
  const objectiveText = currentChapterObj
    ? `${currentChapterObj.title}: Purify Sector Hostiles`
    : 'Eliminate Dark Invaders';

  return (
    <div id="game-app-root" className="relative w-screen h-dvh overflow-hidden bg-black select-none">
      {/* 3D WebGL Canvas Viewport */}
      <div
        id="game-canvas-container"
        ref={containerRef}
        className={`absolute inset-0 w-full h-full ${screen === 'playing' ? 'block' : 'hidden'}`}
      />

      {/* --- SCREEN: MAIN MENU --- */}
      {screen === 'menu' && (
        <MainMenu
          hasSaveGame={playerStats.level > 1 || currentChapter > 1}
          playerLevel={playerStats.level}
          onPlay={() => deployChapter(currentChapter)}
          onNewGame={() => {
            setPlayerStats(INITIAL_STATS);
            deployChapter(1);
          }}
          onOpenCharacter={() => setIsCharacterModalOpen(true)}
          onOpenAbilities={() => setIsAbilitiesModalOpen(true)}
          onOpenChapters={() => setIsChapterSelectModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />
      )}

      {/* --- SCREEN: IN-GAME PLAYING OVERLAYS --- */}
      {screen === 'playing' && (
        <>
          {/* Main In-Game HUD */}
          <HUD
            stats={playerStats}
            damageNumbers={damageNumbers}
            bossState={bossState}
            comboCount={comboCount}
            objectiveText={objectiveText}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(soundManager.toggleMute())}
            onPause={() => setIsPaused(true)}
            onAttack={() => engineRef.current?.triggerAttack()}
            onShieldStart={() => engineRef.current?.setShield(true)}
            onShieldEnd={() => engineRef.current?.setShield(false)}
            onDash={() => engineRef.current?.triggerAbility('auraDash')}
            onAbilityQ={() => engineRef.current?.triggerAbility('energySlash')}
            onAbilityE={() => engineRef.current?.triggerAbility('groundBreaker')}
            onAbilityR={() => engineRef.current?.triggerAbility('ultimate')}
            abilityCooldowns={{
              energySlash: 0,
              auraDash: 0,
              groundBreaker: 0,
              ultimate: 0,
            }}
          />

          {/* Mobile Virtual Joystick with Safe-Area Inset Support */}
          {isTouchDevice && (
            <div
              className="absolute z-40 pointer-events-auto"
              style={{
                bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
                left: 'max(16px, env(safe-area-inset-left, 16px))',
              }}
            >
              <VirtualJoystick onMove={(x, y) => engineRef.current?.setJoystick(x, y)} />
            </div>
          )}

          {/* Story Cutscene Dialogue Modal */}
          {activeDialogue && (
            <DialogueModal
              dialogues={activeDialogue}
              onComplete={() => setActiveDialogue(null)}
            />
          )}

          {/* Pause Modal */}
          {isPaused && (
            <PauseModal
              onResume={() => setIsPaused(false)}
              onRestart={() => deployChapter(currentChapter)}
              onSettings={() => setIsSettingsModalOpen(true)}
              onMainMenu={handleReturnToMenu}
            />
          )}

          {/* Victory Modal */}
          {isVictoryModalOpen && (
            <ChapterVictoryModal
              chapterId={currentChapter}
              onNextChapter={() => deployChapter(Math.min(6, currentChapter + 1))}
              onMainMenu={handleReturnToMenu}
            />
          )}

          {/* Game Over Modal */}
          {isGameOverModalOpen && (
            <GameOverModal
              onRetry={() => {
                setPlayerStats((prev) => ({ ...prev, hp: prev.maxHp, energy: prev.maxEnergy }));
                deployChapter(currentChapter);
              }}
              onMainMenu={handleReturnToMenu}
            />
          )}
        </>
      )}

      {/* --- GLOBAL MODALS --- */}
      {isLoading && (
        <LoadingScreen progress={loadingProgress} statusText={loadingStatus} />
      )}

      {isLevelUpModalOpen && (
        <LevelUpModal
          stats={playerStats}
          onClose={() => setIsLevelUpModalOpen(false)}
        />
      )}

      {isCharacterModalOpen && (
        <CharacterModal
          stats={playerStats}
          onClose={() => setIsCharacterModalOpen(false)}
        />
      )}

      {isAbilitiesModalOpen && (
        <AbilitiesModal onClose={() => setIsAbilitiesModalOpen(false)} />
      )}

      {isChapterSelectModalOpen && (
        <ChapterSelectModal
          unlockedChapters={unlockedChapters}
          onSelectChapter={(id) => deployChapter(id)}
          onClose={() => setIsChapterSelectModalOpen(false)}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(soundManager.toggleMute())}
          onResetSave={handleResetSave}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}
    </div>
  );
}
