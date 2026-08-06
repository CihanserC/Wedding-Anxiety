import * as THREE from 'three';
import { Npc } from '../entities/Npc';
import type { InteractableSpec, NpcSpec } from './worldGen/types';
import type { World } from './World';

export class NpcManager {
  readonly npcs: Npc[] = [];
  private readonly scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnAll(specs: NpcSpec[], world?: World): void {
    this.clear();
    for (const spec of specs) {
      const npc = new Npc(
        spec.type,
        new THREE.Vector3(spec.x, spec.y, spec.z),
        spec.rotationY,
        spec.pose ?? 'standing',
        spec.wander ?? false,
        spec.wanderRadius ?? 6,
        spec.variant ?? 0,
      );
      if (world && npc.wander) {
        // Prefer a clear nearby pad if the spawn tile is jammed in floor/wall
        const cleared = world.resolveStandingPoint(
          npc.position.x,
          npc.position.z,
          npc.stats.radius,
          npc.stats.height * 0.9,
          8,
        );
        if (cleared) {
          npc.position.copy(cleared);
          npc.root.position.copy(cleared);
        }
        npc.snapToGround(world, true);
      }
      this.npcs.push(npc);
      this.scene.add(npc.root);
    }
  }

  update(dt: number, world: World, interactables?: InteractableSpec[]): void {
    for (const npc of this.npcs) {
      npc.update(dt, world);
    }
    if (interactables) this.syncLocalChatInteractables(interactables);
  }

  /** Keep camel/arab chat zones glued to wandering NPC feet. */
  private syncLocalChatInteractables(interactables: InteractableSpec[]): void {
    const wanderers = this.npcs.filter((n) => n.wander);
    const chats = interactables.filter(
      (i) => i.kind === 'camel-chat' || i.kind === 'arab-chat',
    );
    const n = Math.min(wanderers.length, chats.length);
    for (let i = 0; i < n; i++) {
      chats[i].x = wanderers[i].position.x;
      chats[i].y = wanderers[i].position.y;
      chats[i].z = wanderers[i].position.z;
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
