import * as THREE from 'three';
import type { NpcType } from '../../data/npcs';
import { buildBrideCharacter } from '../../rendering/BrideCharacter';
import { buildGroomCharacter } from '../../rendering/GroomCharacter';

export function buildNpcMesh(type: NpcType): THREE.Group {
  switch (type) {
    case 'bride':
      return buildBrideCharacter();
    case 'groom':
      return buildGroomCharacter();
  }
}
