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
  layers: [
    {
      datasetName: "iron",
      label: "Iron (FeO)",
      group: "Oxides (wt%)",
      colour: "#B7410E",
      toggleId: "iron-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: true,
    },
    {
      datasetName: "silicon",
      label: "Silicon (SiO₂)",
      group: "Oxides (wt%)",
      colour: "#2F7FD8",
      toggleId: "silicon-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: true,
    },
    {
      datasetName: "titanium",
      label: "Titanium (TiO₂)",
      group: "Oxides (wt%)",
      colour: "#E0B000",
      toggleId: "titanium-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "magnesium",
      label: "Magnesium (MgO)",
      group: "Oxides (wt%)",
      colour: "#179C8E",
      toggleId: "magnesium-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "aluminium",
      label: "Aluminium (Al₂O₃)",
      group: "Oxides (wt%)",
      colour: "#7E57C2",
      toggleId: "aluminium-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "calcium",
      label: "Calcium (CaO)",
      group: "Oxides (wt%)",
      colour: "#C0CA33",
      toggleId: "calcium-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "potassium",
      label: "Potassium (K)",
      group: "Trace elements (ppm)",
      colour: "#FF8A65",
      toggleId: "potassium-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
    },
    {
      datasetName: "thorium",
      label: "Thorium (Th)",
      group: "Trace elements (ppm)",
      colour: "#26C6DA",
      toggleId: "thorium-toggle",
      category: "resources",
      isFill: true,
      isOnByDefault: false,
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
  minSeparationKm: 1000,
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
};

export const FOCUS = {
  colour: "#ffffff",
  fillOpacity: 0.35,
  ringWidthPx: 1.5,
};
