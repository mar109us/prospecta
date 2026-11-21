export const DEBUG = {
  isEnabled: true,
};

export const RENDER = {
  maxPixelRatio: 1.5,
};

export const CAMERA = {
  fov: 30,
  startDistance: 4,
  minDistance: 1.1,
  maxDistance: 4,
  rotateSpeedPerAltitude: 0.05,
  zoomSpeedPerAltitude: 2,
  focusDistance: 10,
  flyDurationMs: 2000,
  orbitTiltDegrees: 60,
  tiltDurationMs: 2000,
  orbitSecondsPerTurn: 120,
  orbitDistance: 1.1,
  releaseDurationMs: 500,
  maxTiltDegrees: 80,
  tiltDegreesPerPixel: 0.3,
  orbitZoomStep: 1.1,
};

export const FIRST_PERSON = {
  eyeHeightMetres: 2,
  walkSpeedMetresPerSecond: 300,
  mouseDegreesPerPixel: 0.15,
  maxPitchDegrees: 85,
  fov: 70,
  nearMetres: 0.5,
  farKm: 400,
  sprintMultiplier: 50,
};

export const CRATERS = {
  approachKm: 20,
  list: [
    {
      name: "Copernicus",
      lat: 9.62,
      lon: -20.08,
      diameterKm: 93,
    },
    {
      name: "Clavius",
      lat: -58.8,
      lon: -14.1,
      diameterKm: 225,
    },
    {
      name: "Tycho",
      lat: -43.3,
      lon: -11.2,
      diameterKm: 85,
    },
  ],
};

export const MOON = {
  widthSegments: 720,
  heightSegments: 360,
  heightExaggeration: 1,
};

export const DETAIL = {
  isEnabled: true,
  folderUrl: "assets/detail",
  maxAltitude: 0.3,
  loadRadiusDeg: 8,
  maxTiles: 24,
  cacheTiles: 40,
  maxConcurrentLoads: 4,
  updateIntervalMs: 300,
  settleDeg: 0.5,
  edgeBlendVertices: 8,
  fadeMs: 800,
  morphMs: 1200,
  featherDeg: 1,
};

export const MARKERS = {
  screenSize: 0.02,
};

export const LIGHTS = {
  sunIntensity: 3,
  sunDirection: [-1, 0.5, 0.35],
  ambientIntensity: 0.5,
};

export const TEXTURES = {
  moonColourUrl: "assets/textures/moonColour8k.jpg",
  normalMapUrl: "assets/textures/moonNormal16.jpg",
};

export const RESOURCES = {
  opacity: 1,
  edgeFadeDeg: 3,
  layers: [
    {
      datasetName: "iron",
      label: "Iron",
      section: 1,
      colour: "#B7410E",
      toggleId: "iron-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "titanium",
      label: "Titanium",
      section: 1,
      note: "LROC WAC TiO₂ map (Sato et al. 2017), ±70° latitude.",
      colour: "#E0B000",
      toggleId: "titanium-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "aluminium",
      label: "Aluminium",
      section: 1,
      colour: "#7E57C2",
      toggleId: "aluminium-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "silicon",
      label: "Silicon",
      section: 1,
      colour: "#2F7FD8",
      toggleId: "silicon-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "hydrogen",
      label: "Ice",
      section: 1,
      note: "Measured as hydrogen, which indicates likely water ice. 70–80°: Lunar Prospector (ppm). Beyond 80°: LRO LEND (neutron suppression %).",
      legendPrefix: "70–80°:",
      colour: "#4FC3F7",
      toggleId: "hydrogen-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "polarHydrogen",
      label: "Water ice (H), poles",
      legendPrefix: "80–90°:",
      colour: "#4FC3F7",
      partOf: "hydrogen",
    },
    {
      datasetName: "thorium",
      label: "Thorium",
      section: 2,
      colour: "#26C6DA",
      toggleId: "thorium-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "magnesium",
      label: "Magnesium",
      section: 2,
      colour: "#179C8E",
      toggleId: "magnesium-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "calcium",
      label: "Calcium",
      section: 2,
      colour: "#C0CA33",
      toggleId: "calcium-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "potassium",
      label: "Potassium",
      section: 2,
      colour: "#FF8A65",
      toggleId: "potassium-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "olivine",
      label: "Olivine",
      section: 3,
      colour: "#7CB342",
      toggleId: "olivine-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "pyroxene",
      label: "Pyroxene",
      section: 3,
      note: "Low-Ca + high-Ca pyroxene, Kaguya MI (Lemelin et al. 2016).",
      colour: "#A1887F",
      toggleId: "pyroxene-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "plagioclase",
      label: "Plagioclase",
      section: 3,
      colour: "#ECEFF1",
      toggleId: "plagioclase-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
  ],
};

export const RESOURCE_BANDS = {
  bandCount: 8,
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

export const SUNLIGHT = {
  datasetName: "sunlight",
  label: "Sunlight",
  colour: "#FFD54F",
  toggleId: "sunlight-toggle",
  category: "terrain",
  isFill: false,
  isOnByDefault: false,
};

export const LANDING = {
  richTopFraction: 0.1,
  searchStepDeg: 1,
  surroundingsRadiusKm: 50,
  slopePenaltyKmPerDegree: 20,
  minSeparationKm: 500,
  resultCount: 5,
  isFlyToBestOnSearch: true,
  routeStepDeg: 1,
  maxDriveSlopeDeg: 10,
  slopeCostPerDegree: 0.1,
  flatAreaRadiusKm: 100,
  flatAreaPenaltyKm: 150,
  minFlatShare: 0.7,
};

export const ROUTES = {
  lineWidthPx: 10,
  liftAboveGround: 0.002,
  curvePointsPerStep: 6,
  labelStackGapPx: 2,
};

export const RESULTS = {
  bestHue: 120,
  worstHue: 0,
  saturationPercent: 70,
  lightnessPercent: 50,
};

export const FOCUS = {
  colour: "#ffffff",
  fillOpacity: 0.35,
  ringWidthPx: 1.5,
};
