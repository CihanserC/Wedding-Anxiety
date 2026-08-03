import * as THREE from 'three';

export function createLighting(scene: THREE.Scene): void {
  const ambient = new THREE.AmbientLight(0xf0e6ff, 0.55);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff3d0, 0.9);
  sun.position.set(28, 40, 18);
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xa8c8ff, 0.35);
  fill.position.set(-20, 20, -12);
  scene.add(fill);

  scene.fog = new THREE.Fog(0xb8a8e0, 30, 90);
  scene.background = new THREE.Color(0xd6c8ff);
}
