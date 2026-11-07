import * as THREE from "three";

export function fibonacciSphere(n: number, radius: number) {
  const out = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    out[i * 3] = Math.cos(t) * r * radius;
    out[i * 3 + 1] = y * radius;
    out[i * 3 + 2] = Math.sin(t) * r * radius;
  }
  return out;
}

export function randomInSphere(n: number, radius: number, seed = 1) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = rnd(), v = rnd(), w = Math.cbrt(rnd());
    const th = 2 * Math.PI * u, ph = Math.acos(2 * v - 1);
    out[i * 3] = radius * w * Math.sin(ph) * Math.cos(th);
    out[i * 3 + 1] = radius * w * Math.sin(ph) * Math.sin(th);
    out[i * 3 + 2] = radius * w * Math.cos(ph);
  }
  return out;
}

export function latLon(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

export function arcBetween(a: THREE.Vector3, b: THREE.Vector3, lift = 0.5, segments = 48) {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mid.setLength(mid.length() + lift + a.distanceTo(b) * 0.25);
  return new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(segments);
}
