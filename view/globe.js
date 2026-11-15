import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CAMERA, LIGHTS, MOON } from "../settings.js";
import { latLonToScenePosition } from "./terrainMath.js";
import { easeInOut, slerpDirection } from "./cameraMath.js";

const MOON_RADIUS = 1;

function createScene() {
   const scene = new THREE.Scene();
   scene.background = new THREE.Color("black");
   return scene;
}

function createCamera() {
   const aspectRatio = window.innerWidth / window.innerHeight;
   const camera = new THREE.PerspectiveCamera(CAMERA.fov, aspectRatio, 0.005, 50);
   camera.position.set(0, 0, CAMERA.startDistance);
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
   const sunLight = new THREE.DirectionalLight("white", LIGHTS.sunIntensity);
   sunLight.position.set(
      LIGHTS.sunDirection[0],
      LIGHTS.sunDirection[1],
      LIGHTS.sunDirection[2],
   );
   camera.add(sunLight);
   scene.add(camera);

   const ambientLight = new THREE.AmbientLight("white", LIGHTS.ambientIntensity);
   scene.add(ambientLight);
}

function createMoon(scene) {
   const geometry = new THREE.SphereGeometry(
      MOON_RADIUS,
      MOON.widthSegments,
      MOON.heightSegments,
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
   controls.minDistance = CAMERA.minDistance;
   controls.maxDistance = CAMERA.maxDistance;
   return controls;
}

function updateControlSpeed(globe) {
   const altitude = globe.camera.position.length() - MOON_RADIUS;
   globe.controls.rotateSpeed = Math.min(altitude * CAMERA.rotateSpeedPerAltitude, 1);
   globe.controls.zoomSpeed = Math.min(altitude * CAMERA.zoomSpeedPerAltitude, 1);
}

function handleResize(globe) {
   const width = window.innerWidth;
   const height = window.innerHeight;
   globe.camera.aspect = width / height;
   globe.camera.updateProjectionMatrix();
   globe.renderer.setSize(width, height);
}

function updateCameraFlight(globe) {
   const flight = globe.cameraFlight;
   if (!flight) return;

   const elapsedMs = performance.now() - flight.startTime;
   const progress = Math.min(elapsedMs / flight.durationMs, 1);
   const eased = easeInOut(progress);
   const direction = slerpDirection(flight.fromDirection, flight.toDirection, eased);
   const distance = flight.fromDistance + (flight.toDistance - flight.fromDistance) * eased;
   globe.camera.position.set(direction.x * distance, direction.y * distance, direction.z * distance);

   if (progress === 1) {
      globe.cameraFlight = null;
      globe.controls.enabled = true;
   }
}

function renderGlobe(globe) {
   updateCameraFlight(globe);
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
      cameraFlight: null,
   };

   window.addEventListener("resize", () => handleResize(globe));
   return globe;
}

export function startRenderLoop(globe) {
   globe.renderer.setAnimationLoop(() => renderGlobe(globe));
}

export function flyToSpot(globe, lat, lon) {
   const fromDistance = globe.camera.position.length();
   const from = globe.camera.position.clone().normalize();
   const toDistance = Math.min(Math.max(CAMERA.focusDistance, CAMERA.minDistance), CAMERA.maxDistance);

   globe.controls.enabled = false;
   globe.cameraFlight = {
      startTime: performance.now(),
      durationMs: CAMERA.flyDurationMs,
      fromDirection: {
         x: from.x,
         y: from.y,
         z: from.z,
      },
      toDirection: latLonToScenePosition(lat, lon, 1),
      fromDistance: fromDistance,
      toDistance: toDistance,
   };
}
