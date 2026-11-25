import { fractalNoise, periodicNoise2, valueNoise3 } from "../view/noiseMath.js";

const OCTAVES = [
  {
    wavelengthMetres: 100,
    amplitudeMetres: 2,
  },
  {
    wavelengthMetres: 10,
    amplitudeMetres: 0.5,
  },
];

function check(testName, isPassing) {
  if (isPassing) {
    console.log(`PASS ${testName}`);
    return;
  }
  console.error(`FAIL ${testName}`);
}

function testSamePointGivesSameNoise() {
  check("same point gives same noise", valueNoise3(12.3, 45.6, 78.9) === valueNoise3(12.3, 45.6, 78.9));
}

function testValueNoiseStaysInRange() {
  let isInRange = true;
  for (let step = 0; step < 1000; step++) {
    const value = valueNoise3(step * 0.37, step * 0.11, step * 0.73);
    if (value < 0 || value > 1) isInRange = false;
  }
  check("value noise stays between 0 and 1", isInRange);
}

function testFractalNoiseIsNeverNegative() {
  let isInRange = true;
  for (let step = 0; step < 1000; step++) {
    const point = {
      x: 1737400 + step * 3.1,
      y: step * 1.7,
      z: step * 2.3,
    };
    const value = fractalNoise(point, OCTAVES);
    if (value < 0 || value > 2.5) isInRange = false;
  }
  check("fractal noise stays between 0 and the sum of amplitudes", isInRange);
}

function testNoiseIsSmooth() {
  const here = valueNoise3(5.5, 2.25, 9.75);
  const nextDoor = valueNoise3(5.501, 2.25, 9.75);
  check("tiny step gives tiny change", Math.abs(here - nextDoor) < 0.01);
}

function testPeriodicNoiseWraps() {
  let isWrapping = false;
  if (Math.abs(periodicNoise2(0.3, 0.7, 8) - periodicNoise2(8.3, 0.7, 8)) < 1e-9) isWrapping = true;
  check("periodic noise repeats after one period", isWrapping);
}

testSamePointGivesSameNoise();
testValueNoiseStaysInRange();
testFractalNoiseIsNeverNegative();
testNoiseIsSmooth();
testPeriodicNoiseWraps();
