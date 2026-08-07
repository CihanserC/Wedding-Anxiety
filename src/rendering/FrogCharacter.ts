import * as THREE from 'three';

function lambert(color: number, opts?: THREE.MeshLambertMaterialParameters): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

/** Chubby swamp frog — big eyes, squat body, hop-ready legs. */
export function buildFrogCharacter(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'frog';

  const green = lambert(0x4a9a3a);
  const greenDeep = lambert(0x2e6a28);
  const belly = lambert(0xc8d890);
  const eyeWhite = lambert(0xf0f0e8);
  const pupil = lambert(0x101810);

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.38), green);
  body.position.y = 0.28;
  g.add(body);

  const bellyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.2), belly);
  bellyMesh.position.set(0, 0.22, 0.12);
  g.add(bellyMesh);

  // Head bump
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, 0.28), green);
  head.position.set(0, 0.42, 0.08);
  g.add(head);

  // Eye stalks / bulging eyes
  for (const x of [-0.14, 0.14]) {
    const socket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), greenDeep);
    socket.position.set(x, 0.56, 0.12);
    g.add(socket);
    const sclera = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.08), eyeWhite);
    sclera.position.set(x, 0.58, 0.18);
    g.add(sclera);
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), pupil);
    p.position.set(x, 0.58, 0.22);
    g.add(p);
  }

  // Mouth line
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.04), greenDeep);
  mouth.position.set(0, 0.36, 0.22);
  g.add(mouth);

  // Front legs
  for (const x of [-0.18, 0.18]) {
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.1), greenDeep);
    thigh.position.set(x, 0.14, 0.14);
    g.add(thigh);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.16), green);
    foot.position.set(x, 0.04, 0.2);
    g.add(foot);
  }

  // Back legs (larger)
  for (const x of [-0.2, 0.2]) {
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.18), greenDeep);
    thigh.position.set(x, 0.16, -0.12);
    g.add(thigh);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.2), green);
    foot.position.set(x, 0.04, -0.22);
    g.add(foot);
  }

  // Tiny spots
  for (const [x, y, z] of [
    [-0.12, 0.34, -0.05],
    [0.14, 0.3, 0.02],
    [0.05, 0.4, -0.1],
  ] as Array<[number, number, number]>) {
    const spot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.05), greenDeep);
    spot.position.set(x, y, z);
    g.add(spot);
  }

  return g;
}
