export const DEBUG = {
  isEnabled: false,
};

export const CAMERA = {
  fov: 5,
  startDistance: 24,
  minDistance: 6,
  maxDistance: 24,
  rotateSpeedPerAltitude: 0.05,
  zoomSpeedPerAltitude: 2,
  focusDistance: 8,
  flyDurationMs: 1500,
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
  edgeFadeDeg: 3,
  layers: [
    {
      datasetName: "iron",
      label: "Iron (FeO)",
      colour: "#B7410E",
      toggleId: "iron-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: true,
    },
    {
      datasetName: "titanium",
      label: "Titanium (TiO₂)",
      note: "LROC WAC TiO₂ map (Sato et al. 2017), ±70° latitude.",
      colour: "#E0B000",
      toggleId: "titanium-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "aluminium",
      label: "Aluminium (Al₂O₃)",
      colour: "#7E57C2",
      toggleId: "aluminium-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "silicon",
      label: "Silicon (SiO₂)",
      colour: "#2F7FD8",
      toggleId: "silicon-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: true,
    },
    {
      datasetName: "hydrogen",
      label: "Water ice (H)",
      note: "Measured as hydrogen, which indicates likely water ice. Global: Lunar Prospector (ppm). Poles beyond 80°: LRO LEND (neutron suppression %).",
      legendPrefix: "Global:",
      colour: "#E1F5FE",
      toggleId: "hydrogen-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "polarHydrogen",
      label: "Water ice (H), poles",
      legendPrefix: "Poles:",
      colour: "#81D4FA",
      partOf: "hydrogen",
    },
    {
      datasetName: "thorium",
      label: "Thorium (Th)",
      colour: "#26C6DA",
      toggleId: "thorium-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "magnesium",
      label: "Magnesium (MgO)",
      colour: "#179C8E",
      toggleId: "magnesium-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "calcium",
      label: "Calcium (CaO)",
      colour: "#C0CA33",
      toggleId: "calcium-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "potassium",
      label: "Potassium (K)",
      colour: "#FF8A65",
      toggleId: "potassium-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "olivine",
      label: "Olivine",
      colour: "#7CB342",
      toggleId: "olivine-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
      isMineral: true,
    },
    {
      datasetName: "pyroxene",
      label: "Pyroxene",
      note: "Low-Ca + high-Ca pyroxene, Kaguya MI (Lemelin et al. 2016).",
      colour: "#A1887F",
      toggleId: "pyroxene-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
      isMineral: true,
    },
    {
      datasetName: "plagioclase",
      label: "Plagioclase",
      colour: "#ECEFF1",
      toggleId: "plagioclase-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
      isMineral: true,
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

export const FOCUS = {
  colour: "#ffffff",
  fillOpacity: 0.35,
  ringWidthPx: 1.5,
};
