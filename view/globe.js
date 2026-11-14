import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const MOON_RADIUS = 1;
const CAMERA_DISTANCE = 3;

function createScene() {
   const scene = new THREE.Scene();
   scene.background = new THREE.Color("black");
   return scene;
}

function createCamera() {
   const aspectRatio = window.innerWidth / window.innerHeight;
   const camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 100);
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

function createLights(scene) {
   const sunLight = new THREE.DirectionalLight("white", 3);
   sunLight.position.set(5, 3, 5);
   scene.add(sunLight);

   const ambientLight = new THREE.AmbientLight("white", 2);

   scene.add(ambientLight);
}

function createMoon(scene) {
   const geometry = new THREE.SphereGeometry(MOON_RADIUS, 128, 64);
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
   controls.minDistance = 1.2;
   controls.maxDistance = 10;
   return controls;
}

function handleResize(globe) {
   const width = window.innerWidth;
   const height = window.innerHeight;
   globe.camera.aspect = width / height;
   globe.camera.updateProjectionMatrix();
   globe.renderer.setSize(width, height);
}

function renderGlobe(globe) {
   globe.controls.update();
   globe.renderer.render(globe.scene, globe.camera);
}

export function createGlobe(container) {
   const scene = createScene();
   const camera = createCamera();
   const renderer = createRenderer(container);
   createLights(scene);
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
