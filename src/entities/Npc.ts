import * as THREE from 'three';
import { NPC_STATS, type NpcType } from '../data/npcs';
import { buildNpcMesh } from './npcMeshes';

/**
 * Static world NPC; human-scale voxel figure with no AI or interaction.
 */
export class Npc {
  readonly stats;
  readonly root: THREE.Group;
  readonly position: THREE.Vector3;

  constructor(type: NpcType, position: THREE.Vector3, rotationY: number) {
    this.stats = NPC_STATS[type];
    this.position = position.clone();
    this.root = buildNpcMesh(type);
    this.root.position.copy(this.position);
    this.root.rotation.y = rotationY;
  }

  dispose(): void {
    this.root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mat = obj.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
  }
}
