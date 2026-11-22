// Car construction and shared vehicle state. Every model is built from boxes,
// so there are no external art assets to load.
import * as THREE from 'three';

const SHAPES = {
  sport: { w: 2.2, l: 4.6, body: 0.74, cabin: 0.52, wheel: 0.44 },
  coupe: { w: 2.1, l: 4.4, body: 0.78, cabin: 0.54, wheel: 0.43 },
  sedan: { w: 2.05, l: 4.9, body: 0.82, cabin: 0.58, wheel: 0.42 },
  van: { w: 2.35, l: 5.7, body: 1.35, cabin: 0.18, wheel: 0.48 },
  truck: { w: 2.45, l: 6.4, body: 1.18, cabin: 0.72, wheel: 0.52 },
  suv: { w: 2.3, l: 5.1, body: 1.02, cabin: 0.64, wheel: 0.5 },
};

function box(w, h, l, color, emissive) {
  const material = new THREE.MeshLambertMaterial({
    color,
    emissive: emissive ?? 0x000000,
    emissiveIntensity: emissive ? 0.6 : 0,
  });
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, l), material);
}

export function buildVehicleMesh(spec, police = false) {
  const shape = SHAPES[spec.type] ?? SHAPES.sedan;
  const group = new THREE.Group();
  const bodyColor = police ? 0xf2f1e9 : spec.body;
  const trimColor = police ? 0x253043 : spec.trim;

  const body = box(shape.w, shape.body, shape.l, bodyColor);
  body.position.y = 0.62 + shape.body * 0.5;
  group.add(body);

  const cabin = box(shape.w * 0.82, shape.cabin, shape.l * 0.46, trimColor);
  cabin.position.set(0, 0.62 + shape.body + shape.cabin * 0.5, -shape.l * 0.06);
  group.add(cabin);

  const bumperFront = box(shape.w * 0.98, 0.24, 0.2, trimColor);
  bumperFront.position.set(0, 0.62, shape.l * 0.5);
  group.add(bumperFront);

  const lampGeo = new THREE.BoxGeometry(0.38, 0.2, 0.1);
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffe9b0 });
  for (const side of [-1, 1]) {
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(side * shape.w * 0.32, 0.92, shape.l * 0.5 + 0.06);
    group.add(lamp);
    const tail = new THREE.Mesh(lampGeo, new THREE.MeshBasicMaterial({ color: 0xff4f3a }));
    tail.position.set(side * shape.w * 0.32, 0.92, -shape.l * 0.5 - 0.06);
    group.add(tail);
  }

  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x181b1f });
  const wheelGeo = new THREE.CylinderGeometry(shape.wheel, shape.wheel, 0.28, 10);
  const wheels = [];
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI * 0.5;
      wheel.position.set(side * (shape.w * 0.5 + 0.02), shape.wheel, end * shape.l * 0.33);
      group.add(wheel);
      wheels.push(wheel);
    }
  }

  if (police) {
    const bar = box(shape.w * 0.7, 0.14, 0.38, 0x1a2230);
    bar.position.set(0, 0.62 + shape.body + shape.cabin + 0.08, -shape.l * 0.06);
    group.add(bar);
    const red = box(shape.w * 0.3, 0.16, 0.34, 0xff2f3a, 0xff2f3a);
    red.position.set(-shape.w * 0.18, bar.position.y + 0.1, bar.position.z);
    const blue = box(shape.w * 0.3, 0.16, 0.34, 0x3d8bff, 0x3d8bff);
    blue.position.set(shape.w * 0.18, bar.position.y + 0.1, bar.position.z);
    group.add(red, blue);
    group.userData.lights = [red, blue];
  }

  group.userData.wheels = wheels;
  group.userData.shape = shape;
  return group;
}

let nextId = 1;

export function makeVehicle(spec, x, z, yaw, police = false) {
  const mesh = buildVehicleMesh(spec, police);
  mesh.position.set(x, 0, z);
  mesh.rotation.y = yaw;
  return {
    id: nextId++,
    spec,
    mesh,
    police,
    x,
    z,
    yaw,
    speed: 0,
    damage: 0,
    boost: 0,
    wheelSpin: 0,
    stolen: false,
    occupant: police ? 'CVPD' : null,
  };
}

export function placeVehicle(vehicle) {
  vehicle.mesh.position.set(vehicle.x, 0, vehicle.z);
  vehicle.mesh.rotation.y = vehicle.yaw;
  const spin = vehicle.wheelSpin;
  for (const wheel of vehicle.mesh.userData.wheels) wheel.rotation.x = spin;
}

export function vehicleForward(vehicle) {
  return { x: Math.sin(vehicle.yaw), z: Math.cos(vehicle.yaw) };
}

export function damageVehicle(vehicle, amount) {
  vehicle.damage = Math.min(100, vehicle.damage + amount);
  return vehicle.damage;
}
