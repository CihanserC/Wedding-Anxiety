import * as THREE from 'three';
import type { TheaterSeatSpec } from '../game/worldGen/types';

function lambert(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color });
}

function partMatrix(
  px: number,
  py: number,
  pz: number,
  rotX = 0,
  rotY = 0,
  sx = 1,
  sy = 1,
  sz = 1,
): THREE.Matrix4 {
  const obj = new THREE.Object3D();
  obj.position.set(px, py, pz);
  obj.rotation.set(rotX, rotY, 0);
  obj.scale.set(sx, sy, sz);
  obj.updateMatrix();
  return obj.matrix.clone();
}

interface SeatPartDef {
  geometry: THREE.BoxGeometry;
  material: THREE.MeshLambertMaterial;
  local: THREE.Matrix4;
}

function buildSeatPartDefs(): SeatPartDef[] {
  const maroon = lambert(0x5c1a2a);
  const velvet = lambert(0x8b2840);
  const gold = lambert(0xd4af37);
  const dark = lambert(0x3a1018);

  return [
    { geometry: new THREE.BoxGeometry(0.86, 0.1, 0.86), material: dark, local: partMatrix(0, 0.05, 0) },
    { geometry: new THREE.BoxGeometry(0.8, 0.12, 0.74), material: velvet, local: partMatrix(0, 0.2, 0.05) },
    { geometry: new THREE.BoxGeometry(0.78, 0.34, 0.12), material: maroon, local: partMatrix(0, 0.42, -0.3) },
    {
      geometry: new THREE.BoxGeometry(0.76, 0.26, 0.1),
      material: velvet,
      local: partMatrix(0, 0.66, -0.34, -0.28),
    },
    { geometry: new THREE.BoxGeometry(0.1, 0.26, 0.58), material: maroon, local: partMatrix(-0.38, 0.36, -0.02) },
    { geometry: new THREE.BoxGeometry(0.1, 0.26, 0.58), material: maroon, local: partMatrix(0.38, 0.36, -0.02) },
    { geometry: new THREE.BoxGeometry(0.12, 0.05, 0.6), material: gold, local: partMatrix(-0.38, 0.5, -0.02) },
    { geometry: new THREE.BoxGeometry(0.12, 0.05, 0.6), material: gold, local: partMatrix(0.38, 0.5, -0.02) },
    { geometry: new THREE.BoxGeometry(0.18, 0.18, 0.04), material: gold, local: partMatrix(0, 0.58, -0.36) },
  ];
}

/**
 * Instanced velvet theater seats for the concert hall audience.
 * Facing +Z by default (toward the stage).
 */
export function buildTheaterSeats(seats: TheaterSeatSpec[]): THREE.Group {
  const group = new THREE.Group();
  group.name = 'theater-seats';
  if (seats.length === 0) return group;

  const parts = buildSeatPartDefs();
  const seatObj = new THREE.Object3D();
  const worldMatrix = new THREE.Matrix4();

  for (const part of parts) {
    const mesh = new THREE.InstancedMesh(part.geometry, part.material, seats.length);
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    for (let i = 0; i < seats.length; i++) {
      const seat = seats[i];
      seatObj.position.set(seat.x + 0.5, seat.y ?? 1, seat.z + 0.5);
      seatObj.rotation.set(0, seat.rotationY ?? 0, 0);
      seatObj.updateMatrix();
      worldMatrix.multiplyMatrices(seatObj.matrix, part.local);
      mesh.setMatrixAt(i, worldMatrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  }

  return group;
}
