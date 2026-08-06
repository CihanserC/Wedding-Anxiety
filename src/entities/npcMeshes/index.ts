import * as THREE from 'three';
import type { NpcType } from '../../data/npcs';
import type { NpcPose } from '../../game/worldGen/types';
import { buildArabManCharacter, buildArabWomanCharacter } from '../../rendering/ArabCharacter';
import { buildBrideCharacter } from '../../rendering/BrideCharacter';
import { buildCamelCharacter } from '../../rendering/CamelCharacter';
import { buildGroomCharacter } from '../../rendering/GroomCharacter';
import {
  buildCellistCharacter,
  buildConductorCharacter,
  buildPianistCharacter,
  buildViolinistCharacter,
} from '../../rendering/MusicianCharacter';
import {
  buildGuestManCharacter,
  buildGuestWomanCharacter,
} from '../../rendering/WeddingGuestCharacter';

function applySittingPose(model: THREE.Group, type: NpcType): void {
  model.rotation.x = 0.08;
  if (type === 'groom') {
    model.scale.y *= 0.88;
    model.position.y -= 0.1;
    model.position.z -= 0.08;
  } else if (type === 'bride') {
    model.scale.y *= 0.92;
    model.position.y -= 0.08;
    model.position.z -= 0.06;
  } else if (type === 'guest-man' || type === 'guest-woman') {
    model.scale.y *= 0.78;
    model.position.y -= 0.22;
    model.position.z -= 0.04;
  }
}

export function buildNpcMesh(
  type: NpcType,
  pose: NpcPose = 'standing',
  variant = 0,
): THREE.Group {
  const root = (() => {
    switch (type) {
      case 'bride':
        return buildBrideCharacter();
      case 'groom':
        return buildGroomCharacter();
      case 'camel':
        return buildCamelCharacter();
      case 'arab-man':
        return buildArabManCharacter();
      case 'arab-woman':
        return buildArabWomanCharacter();
      case 'conductor':
        return buildConductorCharacter();
      case 'pianist':
        return buildPianistCharacter();
      case 'cellist':
        return buildCellistCharacter();
      case 'violinist':
        return buildViolinistCharacter();
      case 'guest-man':
        return buildGuestManCharacter(variant);
      case 'guest-woman':
        return buildGuestWomanCharacter(variant);
    }
  })();

  if (
    pose === 'sitting' &&
    (type === 'bride' || type === 'groom' || type === 'guest-man' || type === 'guest-woman')
  ) {
    const model = root.children[0];
    if (model instanceof THREE.Group) {
      applySittingPose(model, type);
    }
  }

  return root;
}
