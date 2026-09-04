import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export interface AssetLoadProgress {
  loaded: number;
  total: number;
  percentage: number;
  currentItem: string;
}

export class AssetManager {
  private static instance: AssetManager;
  private loader: GLTFLoader;
  private cache: Map<string, GLTF> = new Map();
  private failedAssets: Set<string> = new Set();
  private isPreloaded: boolean = false;

  private constructor() {
    this.loader = new GLTFLoader();
  }

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  /**
   * Safely loads a GLTF/GLB model from URL.
   * If the file is missing or returns a 404/network error, returns null gracefully without throwing.
   */
  public async loadGLTF(url: string): Promise<GLTF | null> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }
    if (this.failedAssets.has(url)) {
      return null;
    }

    try {
      // In Vite SPA environments, non-existent files return 200 with text/html.
      // Pre-check with fetch HEAD to avoid GLTFLoader parsing HTML as GLTF binary.
      try {
        const headResp = await fetch(url, { method: 'HEAD' });
        const contentType = headResp.headers.get('content-type') || '';
        if (!headResp.ok || contentType.includes('text/html')) {
          this.failedAssets.add(url);
          return null;
        }
      } catch {
        this.failedAssets.add(url);
        return null;
      }

      const gltf = await new Promise<GLTF>((resolve, reject) => {
        this.loader.load(
          url,
          (data) => resolve(data),
          undefined,
          (err) => reject(err)
        );
      });

      this.cache.set(url, gltf);
      return gltf;
    } catch {
      // Gracefully mark as failed so we do not spam network requests
      this.failedAssets.add(url);
      return null;
    }
  }

  /**
   * Safely clones a loaded GLTF scene, ensuring SkinnedMesh and bones are duplicated properly.
   */
  public cloneScene(gltf: GLTF): THREE.Group {
    const clonedScene = SkeletonUtils.clone(gltf.scene) as THREE.Group;
    
    // Enable shadow casting and receiving on all child meshes
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return clonedScene;
  }

  /**
   * Checks if an asset is cached.
   */
  public hasAsset(url: string): boolean {
    return this.cache.has(url);
  }

  /**
   * Preloads critical game assets and reports progress.
   */
  public async preloadAssets(
    onProgress?: (progress: AssetLoadProgress) => void
  ): Promise<void> {
    if (this.isPreloaded) {
      if (onProgress) {
        onProgress({ loaded: 1, total: 1, percentage: 100, currentItem: 'Ready' });
      }
      return;
    }

    const assetsToLoad = [
      { name: 'Hero Exosuit Model', url: '/assets/characters/hero.glb' },
      { name: 'The Dread Lord (Final Boss)', url: '/assets/characters/dread-lord.glb' },
      { name: 'Dark Vanguard Soldier', url: '/assets/enemies/dark-soldier.glb' },
      { name: 'Shadow Archer Drone', url: '/assets/enemies/shadow-archer.glb' },
      { name: 'Aura Hunter Assassin', url: '/assets/enemies/aura-hunter.glb' },
      { name: 'Dark Guardian Juggernaut', url: '/assets/enemies/dark-guardian.glb' },
      { name: 'Demon Beast Unit', url: '/assets/enemies/demon-beast.glb' },
      { name: 'Plasma Energy Sword', url: '/assets/weapons/energy-sword.glb' },
      { name: 'Holographic Hex Shield', url: '/assets/weapons/aura-shield.glb' },
      { name: 'Demonic Dread Axe', url: '/assets/weapons/dread-axe.glb' },
      { name: 'Neo-Metropolis Sector Map', url: '/assets/environment/city/sector-1.glb' },
    ];

    const total = assetsToLoad.length;
    let loaded = 0;

    for (const item of assetsToLoad) {
      if (onProgress) {
        onProgress({
          loaded,
          total,
          percentage: Math.round((loaded / total) * 100),
          currentItem: `Synthesizing ${item.name}...`,
        });
      }

      await this.loadGLTF(item.url);
      loaded++;

      if (onProgress) {
        onProgress({
          loaded,
          total,
          percentage: Math.round((loaded / total) * 100),
          currentItem: `${item.name} synchronized.`,
        });
      }

      // Small tick for smooth animation of loading bar
      await new Promise((r) => setTimeout(r, 40));
    }

    this.isPreloaded = true;
    if (onProgress) {
      onProgress({
        loaded: total,
        total,
        percentage: 100,
        currentItem: 'A.U.R.A. Matrix Fully Synchronized',
      });
    }
  }
}

export const assetManager = AssetManager.getInstance();
