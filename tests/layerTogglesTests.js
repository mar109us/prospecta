import { defaultVisibility, shouldHide } from "../view/layerToggles.js";

function check(testName, isPassing) {
  if (isPassing) {
    console.log(`PASS ${testName}`);
    return;
  }
  console.error(`FAIL ${testName}`);
}

function makeToggle(category, isFill) {
  return {
    category: category,
    isFill: isFill,
  };
}

const iron = makeToggle("resources", true);
const silicon = makeToggle("resources", true);
const slopeFill = makeToggle("terrain", true);
const slopeDots = makeToggle("terrain", false);
const sunlight = makeToggle("terrain", false);

function testFillHidesFillsOfOtherCategories() {
  check("fill hides fills of other categories", shouldHide(iron, slopeFill));
}

function testFillKeepsSameCategoryLayers() {
  check("fill keeps same-category layers", !shouldHide(silicon, iron));
}

function testDotsNeverHideAnything() {
  check("dots never hide anything", !shouldHide(iron, slopeDots));
}

function testDotsAreNeverHidden() {
  check("dots are never hidden", !shouldHide(slopeDots, iron));
}

function testClashingDefaultsLaterFillWins() {
  const toggles = [
    {
      category: "resources",
      isFill: true,
      isOnByDefault: true,
    },
    {
      category: "terrain",
      isFill: true,
      isOnByDefault: true,
    },
  ];
  const visibility = defaultVisibility(toggles);
  check("clashing defaults: the later fill wins", visibility[0] === false && visibility[1] === true);
}

function testSunlightDoesNotHideResources() {
  check("sunlight toggle does not hide resources", !shouldHide(iron, sunlight) && !shouldHide(sunlight, iron));
}

testFillHidesFillsOfOtherCategories();
testSunlightDoesNotHideResources();
testFillKeepsSameCategoryLayers();
testDotsNeverHideAnything();
testDotsAreNeverHidden();
testClashingDefaultsLaterFillWins();
