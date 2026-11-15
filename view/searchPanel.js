const PAINT_DELAY_MS = 20;

function formatLatLon(lat, lon) {
  let northSouth = "N";
  if (lat < 0) northSouth = "S";
  let eastWest = "E";
  if (lon < 0) eastWest = "W";
  return `${Math.abs(lat).toFixed(1)}°${northSouth} ${Math.abs(lon).toFixed(1)}°${eastWest}`;
}

function capitalise(word) {
  return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
}

function createLine(className, text) {
  const line = document.createElement("span");
  line.className = className;
  line.textContent = text;
  return line;
}

function createCard(spot, onSelect) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "result-card";

  card.appendChild(createLine("result-card__place", formatLatLon(spot.lat, spot.lon)));
  for (const distance of spot.distances) {
    card.appendChild(createLine("result-card__line", `${capitalise(distance.name)}: ${Math.round(distance.km)} km`));
  }
  card.appendChild(createLine("result-card__line", `Surroundings: ${spot.surroundingSlopeDeg.toFixed(1)}° slope`));
  card.appendChild(createLine("result-card__score", `Score ${Math.round(spot.score)}`));

  card.addEventListener("click", () => onSelect(spot));
  return card;
}

function showStatus(message) {
  const status = document.getElementById("search-status");
  status.textContent = message;
}

function renderResults(spots, onSelect) {
  const panel = document.getElementById("search-results");
  const cards = document.getElementById("search-result-cards");
  cards.textContent = "";

  for (const spot of spots) {
    cards.appendChild(createCard(spot, onSelect));
  }

  if (spots.length === 0) {
    panel.hidden = true;
  } else {
    panel.hidden = false;
  }
}

export function connectSearchPanel(search, onSelect) {
  const button = document.getElementById("search-button");
  button.addEventListener("click", () => {
    showStatus("Searching…");
    renderResults([], onSelect);

    setTimeout(() => {
      const result = search();
      showStatus(result.message);
      renderResults(result.spots, onSelect);
    }, PAINT_DELAY_MS);
  });
}
