import * as THREE from 'three';
import { BLOCKS, type BlockId } from '../data/blocks';

/**
 * Builds one InstancedMesh per block type from a list of positions.
 * The arena is small enough that a flat instanced pool per block type
 * is sufficient; no chunking required.
 */
export interface VoxelInstanceInput {
  blockId: BlockId;
  positions: Array<[number, number, number]>;
}

export interface BuildResult {
  meshes: THREE.InstancedMesh[];
  group: THREE.Group;
}

const BLOCK_SIZE = 1;

export function buildVoxelMeshes(inputs: VoxelInstanceInput[]): BuildResult {
  const group = new THREE.Group();
  group.name = 'VoxelWorld';
  const meshes: THREE.InstancedMesh[] = [];

  const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

  for (const input of inputs) {
    if (input.positions.length === 0) continue;
    const def = BLOCKS[input.blockId];
    if (!def) continue;

    const material = new THREE.MeshLambertMaterial({
      color: def.color,
      transparent: def.opacity < 1,
      opacity: def.opacity,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, input.positions.length);
    mesh.name = `blocks:${def.name}`;
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < input.positions.length; i++) {
      const [x, y, z] = input.positions[i];
      dummy.position.set(x + 0.5, y + 0.5, z + 0.5);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    group.add(mesh);
    meshes.push(mesh);
  }

  return { meshes, group };
}
