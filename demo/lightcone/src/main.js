import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const c = 1;
const container = document.querySelector('#scene-container');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x05111f, 8, 18);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(5, 4, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const pointLight = new THREE.PointLight(0x88ccff, 1.8, 20);
pointLight.position.set(2.5, 4, 2.5);
scene.add(pointLight);

const group = new THREE.Group();
scene.add(group);

const axisMat = new THREE.LineBasicMaterial({ color: 0xdcecff, transparent: true, opacity: 0.85 });
const gridMat = new THREE.LineBasicMaterial({ color: 0x87a6c7, transparent: true, opacity: 0.22 });
const futureMat = new THREE.MeshBasicMaterial({ color: 0x35e06f, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });
const pastMat = new THREE.MeshBasicMaterial({ color: 0x7464ff, transparent: true, opacity: 0.36, side: THREE.DoubleSide, depthWrite: false });
const lightPathMat = new THREE.LineBasicMaterial({ color: 0xffdf4d, linewidth: 3 });
const spacelikeMat = new THREE.MeshBasicMaterial({ color: 0xaab2bf });
const timelikeMat = new THREE.MeshBasicMaterial({ color: 0x45e47a });
const lightlikeMat = new THREE.MeshBasicMaterial({ color: 0xffdf4d });
const eventMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

function createLine(points, material) {
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geo, material);
}

function createAxis() {
  const axes = new THREE.Group();
  axes.add(createLine([new THREE.Vector3(-4, 0, 0), new THREE.Vector3(4, 0, 0)], axisMat));
  axes.add(createLine([new THREE.Vector3(0, 0, -4), new THREE.Vector3(0, 0, 4)], axisMat));
  axes.add(createLine([new THREE.Vector3(0, -3.6, 0), new THREE.Vector3(0, 3.6, 0)], axisMat));
  return axes;
}

function createArrowHead(position, direction, color = 0xdcecff) {
  const cone = new THREE.ConeGeometry(0.08, 0.25, 20);
  const mat = new THREE.MeshBasicMaterial({ color });
  const mesh = new THREE.Mesh(cone, mat);
  mesh.position.copy(position);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return mesh;
}

const axes = createAxis();
axes.add(createArrowHead(new THREE.Vector3(4, 0, 0), new THREE.Vector3(1, 0, 0)));
axes.add(createArrowHead(new THREE.Vector3(0, 0, 4), new THREE.Vector3(0, 0, 1)));
axes.add(createArrowHead(new THREE.Vector3(0, 3.6, 0), new THREE.Vector3(0, 1, 0)));
axes.add(createArrowHead(new THREE.Vector3(0, -3.6, 0), new THREE.Vector3(0, -1, 0)));
group.add(axes);

const grid = new THREE.GridHelper(8, 16, 0x4f6680, 0x4f6680);
grid.material.transparent = true;
grid.material.opacity = 0.25;
group.add(grid);

const futureCone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 3.2, 96, 1, true), futureMat);
futureCone.position.y = 1.6;
futureCone.rotation.x = Math.PI;
group.add(futureCone);

const pastCone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 3.2, 96, 1, true), pastMat);
pastCone.position.y = -1.6;
group.add(pastCone);

const ringGeo = new THREE.RingGeometry(2.56, 2.6, 128);
const futureRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x4cff7c, transparent: true, opacity: 0.75, side: THREE.DoubleSide }));
futureRing.position.y = 3.2;
futureRing.rotation.x = Math.PI / 2;
group.add(futureRing);
const pastRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x8d78ff, transparent: true, opacity: 0.65, side: THREE.DoubleSide }));
pastRing.position.y = -3.2;
pastRing.rotation.x = Math.PI / 2;
group.add(pastRing);

const eventSphere = new THREE.Mesh(new THREE.SphereGeometry(0.13, 32, 32), eventMat);
group.add(eventSphere);
const targetSphere = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 32), timelikeMat);
group.add(targetSphere);
let eventPath = createLine([new THREE.Vector3(), new THREE.Vector3()], lightPathMat);
group.add(eventPath);

const starGeo = new THREE.SphereGeometry(0.025, 8, 8);
for (let i = 0; i < 90; i++) {
  const star = new THREE.Mesh(starGeo, new THREE.MeshBasicMaterial({ color: 0x7bb8ff, transparent: true, opacity: Math.random() * 0.7 + 0.2 }));
  star.position.set((Math.random()-0.5)*8, (Math.random()-0.5)*7, (Math.random()-0.5)*8);
  group.add(star);
}

const ids = ['t0','x0','y0','z0','dt','dx','dy','dz'];
const inputs = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
const values = Object.fromEntries(ids.map(id => [id, document.getElementById(id + 'Val')]));
const showCone = document.getElementById('showCone');
const showGrid = document.getElementById('showGrid');
const animateCheckbox = document.getElementById('animate');

const deltaText = document.getElementById('deltaText');
const classCard = document.getElementById('classCard');
const classTitle = document.getElementById('classTitle');
const intervalText = document.getElementById('intervalText');
const meaningText = document.getElementById('meaningText');

function getState() {
  return Object.fromEntries(ids.map(id => [id, Number(inputs[id].value)]));
}

function update() {
  const s = getState();
  ids.forEach(id => values[id].textContent = Number(inputs[id].value).toFixed(id.length === 2 ? 2 : 1));

  group.position.set(s.x0, s.t0, s.y0);
  eventSphere.position.set(0, 0, 0);

  const spatialDistance = Math.sqrt(s.dx*s.dx + s.dy*s.dy + s.dz*s.dz);
  const interval = c*c*s.dt*s.dt - spatialDistance*spatialDistance;
  const eps = 0.05;

  let type = 'TIMELIKE';
  let material = timelikeMat;
  let cardClass = 'class-card timelike-card';
  let meaning = 'This event can be causally connected to the reference event.';

  if (Math.abs(interval) <= eps) {
    type = 'LIGHTLIKE';
    material = lightlikeMat;
    cardClass = 'class-card lightlike-card';
    meaning = 'This event lies on the light cone. Only a light signal can connect the two events.';
  } else if (interval < 0) {
    type = 'SPACELIKE';
    material = spacelikeMat;
    cardClass = 'class-card spacelike-card';
    meaning = 'This event is outside the light cone, so no causal connection is possible.';
  }

  targetSphere.material = material;
  targetSphere.position.set(s.dx, s.dt, s.dy);
  eventPath.geometry.dispose();
  eventPath.geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), targetSphere.position.clone()]);

  deltaText.textContent = `Δt = ${s.dt.toFixed(2)}, Δx = ${s.dx.toFixed(2)}, Δy = ${s.dy.toFixed(2)}, Δz = ${s.dz.toFixed(2)}`;
  classTitle.textContent = type;
  intervalText.textContent = `s² = ${interval.toFixed(2)} c² ${interval > eps ? '>' : interval < -eps ? '<' : '='} 0`;
  meaningText.textContent = meaning;
  classCard.className = cardClass;

  const coneVisible = showCone.checked;
  futureCone.visible = pastCone.visible = futureRing.visible = pastRing.visible = coneVisible;
  grid.visible = showGrid.checked;
}

ids.forEach(id => inputs[id].addEventListener('input', update));
showCone.addEventListener('change', update);
showGrid.addEventListener('change', update);
document.getElementById('reset').addEventListener('click', () => {
  const defaults = { t0:0, x0:0, y0:0, z0:0, dt:1.5, dx:1, dy:.5, dz:0 };
  ids.forEach(id => inputs[id].value = defaults[id]);
  update();
});

let clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const elapsed = clock.getElapsedTime();
  if (animateCheckbox.checked) {
    futureCone.material.opacity = 0.28 + Math.sin(elapsed * 2) * 0.06;
    pastCone.material.opacity = 0.32 + Math.cos(elapsed * 2) * 0.05;
    targetSphere.scale.setScalar(1 + Math.sin(elapsed * 5) * 0.12);
  }
  controls.update();
  renderer.render(scene, camera);
}

function resize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}
window.addEventListener('resize', resize);

update();
loop();
