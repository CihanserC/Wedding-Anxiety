import * as THREE from 'three';
import type { AtmosphereConfig } from '../data/maps';

export interface SceneLighting {
  ambient: THREE.AmbientLight;
  sun: THREE.DirectionalLight;
  fill: THREE.DirectionalLight;
  apply(atmosphere: AtmosphereConfig): void;
}

export function createLighting(scene: THREE.Scene, initial?: AtmosphereConfig): SceneLighting {
  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(28, 40, 18);
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(-20, 20, -12);
  scene.add(fill);

  const apply = (atmosphere: AtmosphereConfig): void => {
    ambient.color.setHex(atmosphere.ambientColor);
    ambient.intensity = atmosphere.ambientIntensity;
    sun.color.setHex(atmosphere.sunColor);
    sun.intensity = atmosphere.sunIntensity;
    sun.position.set(...atmosphere.sunPosition);
    fill.color.setHex(atmosphere.fillColor);
    fill.intensity = atmosphere.fillIntensity;
    scene.fog = new THREE.Fog(atmosphere.fogColor, atmosphere.fogNear, atmosphere.fogFar);
    scene.background = new THREE.Color(atmosphere.skyColor);
  };

  if (initial) apply(initial);

  return { ambient, sun, fill, apply };
}
