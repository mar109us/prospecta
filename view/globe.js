import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CAMERA, LIGHTS, MOON, RENDER } from "../settings.js";
import { applyTilt, connectTiltDrag, createTiltState } from "./cameraTilt.js";
import { createDetailMask } from "./detailMask.js";
import { applyMoonMask } from "./moonShader.js";
import { connectFocusCancel, updateSpotFocus } from "./spotFocus.js";

const MOON_RADIUS = 1;
const MOON_SURFACE_MARGIN = 1.1;

function createScene() {
   const scene = new THREE.Scene();
   scene.background = new THREE.Color("black");
   return scene;
}

function createCamera() {
   const aspectRatio = window.innerWidth / window.innerHeight;
   const nearPlane = Math.max(0.01, CAMERA.minDistance - MOON_SURFACE_MARGIN);
   const farPlane = CAMERA.maxDistance + 2;
   const camera = new THREE.PerspectiveCamera(CAMERA.fov, aspectRatio, nearPlane, farPlane);
   camera.position.set(0, 0, CAMERA.startDistance);
   return camera;
}

function createRenderer(container) {
   const renderer = new THREE.WebGLRenderer({
      antialias: true,
   });
   renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDER.maxPixelRatio));
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
   controls.mouseButtons.RIGHT = null;
   controls.minDistance = CAMERA.minDistance;
   controls.maxDistance = CAMERA.maxDistance;
   return controls;
}

function updateControlSpeed(globe) {
   const altitude = globe.tilt.baseCamera.position.length() - MOON_RADIUS;
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

function updateFreeCamera(globe) {
   updateControlSpeed(globe);
   globe.controls.update();
   applyTilt(globe);
}

function updateNearPlane(globe) {
   const nearPlane = Math.max(0.01, globe.camera.position.length() - MOON_SURFACE_MARGIN);
   if (nearPlane === globe.camera.near) return;
   globe.camera.near = nearPlane;
   globe.camera.updateProjectionMatrix();
}

function renderGlobe(globe) {
   if (globe.spotFocus) {
      updateSpotFocus(globe);
   } else {
      updateFreeCamera(globe);
   }
   updateNearPlane(globe);
   for (const callback of globe.frameCallbacks) {
      callback();
   }
   globe.renderer.render(globe.scene, globe.camera);
}

export function createGlobe(container) {
   const scene = createScene();
   const camera = createCamera();
   const renderer = createRenderer(container);
   createLights(scene, camera);
   const moon = createMoon(scene);
   const detailMask = createDetailMask();
   applyMoonMask(moon.material, detailMask);
   const tilt = createTiltState(camera);
   const controls = createControls(tilt.baseCamera, renderer);

   const globe = {
      scene: scene,
      camera: camera,
      renderer: renderer,
      moon: moon,
      controls: controls,
      spotFocus: null,
      tilt: tilt,
      detailMask: detailMask,
      frameCallbacks: [],
   };

   window.addEventListener("resize", () => handleResize(globe));
   connectFocusCancel(globe);
   connectTiltDrag(globe);
   return globe;
}

export function startRenderLoop(globe) {
   globe.renderer.setAnimationLoop(() => renderGlobe(globe));
}
