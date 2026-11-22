// Box-built vehicles. Each body style has its own proportions, so twelve
// specs read as distinct cars in traffic without a single downloaded asset.
import * as THREE from 'three';

const FRAMES = {
  sport: { width: 2.2, length: 4.6, body: 0.74, cabin: 0.52, wheel: 0.44 },
  coupe: { width: 2.1, length: 4.4, body: 0.78, cabin: 0.54, wheel: 0.43 },
  sedan: { width: 2.05, length: 4.9, body: 0.82, cabin: 0.58, wheel: 0.42 },
  van: { width: 2.35, length: 5.7, body: 1.35, cabin: 0.18, wheel: 0.48 },
  truck: { width: 2.45, length: 6.4, body: 1.18, cabin: 0.72, wheel: 0.52 },
  suv: { width: 2.3, length: 5.1, body: 1.02, cabin: 0.64, wheel: 0.5 },
};

function panel(width, height, depth, color, glow) {
  const material = new THREE.MeshLambertMaterial({
    color,
    emissive: glow ?? 0x000000,
    emissiveIntensity: glow ? 0.6 : 0,
  });
  return new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
}

export function assembleCar(spec, marked = false) {
  const frame = FRAMES[spec.kind] ?? FRAMES.sedan;
  const car = new THREE.Group();
  const paint = marked ? 0xf2f1e9 : spec.body;
  const glass = marked ? 0x253043 : spec.trim;

  const hull = panel(frame.width, frame.body, frame.length, paint);
  hull.position.y = 0.62 + frame.body * 0.5;
  car.add(hull);

  const roof = panel(frame.width * 0.82, frame.cabin, frame.length * 0.46, glass);
  roof.position.set(0, 0.62 + frame.body + frame.cabin * 0.5, -frame.length * 0.06);
  car.add(roof);

  const grille = panel(frame.width * 0.98, 0.24, 0.2, glass);
  grille.position.set(0, 0.62, frame.length * 0.5);
  car.add(grille);

  const lampShape = new THREE.BoxGeometry(0.38, 0.2, 0.1);
  const headMaterial = new THREE.MeshBasicMaterial({ color: 0xffe9b0 });
  const tailMaterial = new THREE.MeshBasicMaterial({ color: 0xff4f3a });
  for (const side of [-1, 1]) {
    const head = new THREE.Mesh(lampShape, headMaterial);
    head.position.set(side * frame.width * 0.32, 0.92, frame.length * 0.5 + 0.06);
    car.add(head);
    const tail = new THREE.Mesh(lampShape, tailMaterial);
    tail.position.set(side * frame.width * 0.32, 0.92, -frame.length * 0.5 - 0.06);
    car.add(tail);
  }

  const rubber = new THREE.MeshLambertMaterial({ color: 0x181b1f });
  const tyre = new THREE.CylinderGeometry(frame.wheel, frame.wheel, 0.28, 10);
  const wheels = [];
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      const wheel = new THREE.Mesh(tyre, rubber);
      wheel.rotation.z = Math.PI * 0.5;
      wheel.position.set(side * (frame.width * 0.5 + 0.02), frame.wheel, end * frame.length * 0.33);
      car.add(wheel);
      wheels.push(wheel);
    }
  }

  if (marked) {
    const bar = panel(frame.width * 0.7, 0.14, 0.38, 0x1a2230);
    bar.position.set(0, 0.62 + frame.body + frame.cabin + 0.08, -frame.length * 0.06);
    car.add(bar);
    const red = panel(frame.width * 0.3, 0.16, 0.34, 0xff2f3a, 0xff2f3a);
    red.position.set(-frame.width * 0.18, bar.position.y + 0.1, bar.position.z);
    const blue = panel(frame.width * 0.3, 0.16, 0.34, 0x3d8bff, 0x3d8bff);
    blue.position.set(frame.width * 0.18, bar.position.y + 0.1, bar.position.z);
    car.add(red, blue);
    car.userData.beacons = [red, blue];
  }

  car.userData.wheels = wheels;
  return car;
}

let serial = 1;

export function createVehicle(spec, x, z, heading, marked = false) {
  const mesh = assembleCar(spec, marked);
  mesh.position.set(x, 0, z);
  mesh.rotation.y = heading;
  return {
    id: serial++,
    spec,
    mesh,
    marked,
    x,
    z,
    heading,
    speed: 0,
    damage: 0,
    spin: 0,
    taken: false,
    owner: marked ? 'CVPD' : null,
  };
}

export function syncVehicle(vehicle) {
  vehicle.mesh.position.set(vehicle.x, 0, vehicle.z);
  vehicle.mesh.rotation.y = vehicle.heading;
  for (const wheel of vehicle.mesh.userData.wheels) wheel.rotation.x = vehicle.spin;
  const beacons = vehicle.mesh.userData.beacons;
  if (beacons) {
    const flash = Math.floor(Date.now() / 160) % 2 === 0;
    beacons[0].visible = flash;
    beacons[1].visible = !flash;
  }
}

export function noseOf(vehicle) {
  return { x: Math.sin(vehicle.heading), z: Math.cos(vehicle.heading) };
}

export function hurtVehicle(vehicle, amount) {
  vehicle.damage = Math.min(100, vehicle.damage + amount);
  return vehicle.damage;
}
