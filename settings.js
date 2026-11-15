export const DEBUG = {
  isEnabled: false,
};

export const CAMERA = {
  fov: 5,
  startDistance: 6,
//   startDistance: 24,
  minDistance: 6,
  maxDistance: 24,
  rotateSpeedPerAltitude: 0.05,
  zoomSpeedPerAltitude: 2,
};

export const MOON = {
  widthSegments: 720,
  heightSegments: 360,
  heightExaggeration: 3,
};

export const LIGHTS = {
  sunIntensity: 3,
  sunDirection: [-1, 0.5, 0.35],
  ambientIntensity: 0.5,
};

export const TEXTURES = {
  moonColourUrl: "assets/textures/moonColour8k.jpg",
  normalMapUrl: "assets/textures/moonNormal16.png",
};

export const RESOURCES = {
  opacity: 1,
  layers: [
    {
      datasetName: "iron",
      colour: "#B7410E",
      toggleId: "iron-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: true,
    },
    {
      datasetName: "silicon",
      colour: "#2F7FD8",
      toggleId: "silicon-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: true,
    },
  ],
};

export const RESOURCE_BANDS = {
  bandCount: 5,
  baseCurvePower: 2,
  maxNoiseRatio: 0.95,
  errorsPerBand: 2,
};

export const SLOPE = {
  maxDegrees: 45,
  thresholds: [1, 3, 5, 7, 10, 15, 20],
  colours: [
    "#a8126f",
    "#a8126f",
    "#a8126f",
    "#a8126f",
    "#a8126f",
    "#a8126f",
    "#a8126f",
    "#a8126f",
  ],
  dotSpacingDeg: 0.5,
  dotRadiusDeg: 0.3,
  dotOpacity: 1,
  dotMinOpacity: 0,
  isDotsOnByDefault: false,
  flatLimitDeg: 5,
  flatColour: "#41ab5d",
  flatOpacity: 0.45,
  isFlatOnByDefault: false,
};

export const PANEL = {
  openCategories: ["resources"],
};

export const LANDING = {
  richTopFraction: 0.1,
  searchStepDeg: 1,
  surroundingsRadiusKm: 50,
  slopePenaltyKmPerDegree: 20,
  minSeparationKm: 200,
  resultCount: 5,
};
