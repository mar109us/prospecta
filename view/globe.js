import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const MOON_RADIUS = 1;
const CAMERA_DISTANCE = 24;
const CAMERA_FOV = 5;
const MIN_CAMERA_DISTANCE = 6;
const MAX_CAMERA_DISTANCE = 24;
const ROTATE_SPEED_PER_ALTITUDE = 0.05;
const ZOOM_SPEED_PER_ALTITUDE = 2;
const MOON_WIDTH_SEGMENTS = 720;
const MOON_HEIGHT_SEGMENTS = 360;
export const HEIGHT_EXAGGERATION = 3;

function createScene() {
   const scene = new THREE.Scene();
   scene.background = new THREE.Color("black");
   return scene;
}

function createCamera() {
   const aspectRatio = window.innerWidth / window.innerHeight;
   const camera = new THREE.PerspectiveCamera(CAMERA_FOV, aspectRatio, 0.005, 50);
   camera.position.set(0, 0, CAMERA_DISTANCE);
   return camera;
}

function createRenderer(container) {
   const renderer = new THREE.WebGLRenderer({
      antialias: true,
   });
   renderer.setPixelRatio(window.devicePixelRatio);
   renderer.setSize(window.innerWidth, window.innerHeight);
   container.appendChild(renderer.domElement);
   return renderer;
}

function createLights(scene, camera) {
   const sunLight = new THREE.DirectionalLight("white", 3);
   sunLight.position.set(-1, 0.5, 0.35);
   camera.add(sunLight);
   scene.add(camera);

   const ambientLight = new THREE.AmbientLight("white", 0.5);
   scene.add(ambientLight);
}

function createMoon(scene) {
   const geometry = new THREE.SphereGeometry(
      MOON_RADIUS,
      MOON_WIDTH_SEGMENTS,
      MOON_HEIGHT_SEGMENTS,
   );
   const material = new THREE.MeshStandardMaterial({
      color: "grey",
      roughness: 1,
   });
   const moon = new THREE.Mesh(geometry, material);
   scene.add(moon);
   return moon;
}

function createControls(camera, renderer) {
   const controls = new OrbitControls(camera, renderer.domElement);
   controls.enableDamping = true;
   controls.enablePan = false;
   controls.minDistance = MIN_CAMERA_DISTANCE;
   controls.maxDistance = MAX_CAMERA_DISTANCE;
   return controls;
}

function updateControlSpeed(globe) {
   const altitude = globe.camera.position.length() - MOON_RADIUS;
   globe.controls.rotateSpeed = Math.min(altitude * ROTATE_SPEED_PER_ALTITUDE, 1);
   globe.controls.zoomSpeed = Math.min(altitude * ZOOM_SPEED_PER_ALTITUDE, 1);
}

function handleResize(globe) {
   const width = window.innerWidth;
   const height = window.innerHeight;
   globe.camera.aspect = width / height;
   globe.camera.updateProjectionMatrix();
   globe.renderer.setSize(width, height);
}

function renderGlobe(globe) {
   updateControlSpeed(globe);
   globe.controls.update();
   globe.renderer.render(globe.scene, globe.camera);
}

export function createGlobe(container) {
   const scene = createScene();
   const camera = createCamera();
   const renderer = createRenderer(container);
   createLights(scene, camera);
   const moon = createMoon(scene);
   const controls = createControls(camera, renderer);

   const globe = {
      scene: scene,
      camera: camera,
      renderer: renderer,
      moon: moon,
      controls: controls,
   };

   window.addEventListener("resize", () => handleResize(globe));
   return globe;
}

export function startRenderLoop(globe) {
   globe.renderer.setAnimationLoop(() => renderGlobe(globe));
}
