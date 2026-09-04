# Legends Awakening: 3D Asset Directory

This directory houses all 3D GLTF / GLB assets, character models, weapon attachments, environmental sets, audio, and visual effects for **Legends Awakening: Final Chronicles**.

## 1. Characters (`/public/assets/characters/`)
- **`hero.glb`**: Futuristic blue powered armor hero with cyan energy core, sleek human-like proportions, helmet visor, and armored plating.
  - **Required Bones / Sockets**: `RightHand` (or `mixamorigRightHand`) for energy sword attachment, `LeftForearm` for holographic shield attachment.
  - **Supported Animations**: `Idle`, `Walk`, `Run`, `Jump`, `Attack1`, `Attack2`, `Attack3`, `HeavyAttack`, `Block`, `Dodge`, `Dash`, `EnergyAttack`, `SpecialAttack`, `Ultimate`, `Hit`, `Death`.
- **`dread-lord.glb`**: The Dark Fantasy / Sci-Fi final boss. Tall armored demonic humanoid with large curved horns, glowing red eyes, red chest core, and dark energy effects.
  - **Sockets**: `RightHand` for Dread Axe.
  - **Supported Animations**: `Idle`, `Walk`, `Run`, `Attack`, `HeavySwing`, `Roar`, `Hit`, `Death`.

## 2. Enemies (`/public/assets/enemies/`)
- **`dark-soldier.glb`**: Standard melee vanguard infantry with dark cybernetic armor.
- **`shadow-archer.glb`**: Ranged sniper with energy bow.
- **`aura-hunter.glb`**: Agile cyber assassin with twin stealth blades.
- **`dark-guardian.glb`**: Heavy armored mini-boss siege juggernaut.
- **`demon-beast.glb`**: Quadruped/hybrid abyssal demonic creature.
  - **Animations**: `Idle`, `Walk`, `Run`, `Attack`, `Hit`, `Death`.

## 3. Weapons (`/public/assets/weapons/`)
- **`energy-sword.glb`**: Plasma/energy katana/blade with cyan emissive glow. Attaches to Hero right hand.
- **`aura-shield.glb`**: Holographic hexagonal deflector shield with emissive pulse. Attaches to Hero left forearm.
- **`dread-axe.glb`**: Massive double-bladed dark battle axe with glowing red runes. Attaches to Dread Lord right hand.

## 4. Environment (`/public/assets/environment/`)
- **`city/`**: Futuristic cyberpunk metropolis arena components (roads, elevated walkways, overpasses).
- **`buildings/`**: Futuristic skyscrapers, corporate arcologies, holographic advertising billboards.
- **`props/`**: Street lamps, ruined cyber-vehicles, barricades, energy conduits.

## 5. Effects & Audio (`/public/assets/effects/`, `/public/assets/audio/`)
- Particle textures and audio stems.

*Note: If any GLB file is omitted or pending download, the engine's built-in AssetManager gracefully loads a sophisticated holographic cyber-nanosuit silhouette and procedural sci-fi environment without disrupting gameplay or throwing fatal errors.*
