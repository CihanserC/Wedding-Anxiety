import * as THREE from 'three';
import { Npc } from '../entities/Npc';
import type { NpcSpec } from './worldGen/types';

export class NpcManager {
  readonly npcs: Npc[] = [];
  private readonly scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnAll(specs: NpcSpec[]): void {
    this.clear();
    for (const spec of specs) {
      const npc = new Npc(spec.type, new THREE.Vector3(spec.x, spec.y, spec.z), spec.rotationY);
      this.npcs.push(npc);
      this.scene.add(npc.root);
    }
  }

  clear(): void {
    for (const npc of this.npcs) {
      this.scene.remove(npc.root);
      npc.dispose();
    }
    this.npcs.length = 0;
  }
}
