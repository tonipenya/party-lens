import { Camera } from "./camera.js";
import { START_CARD, getLanguageFromUrl, keepScreenAwake } from "./env.js";
import { loadDeck, startGame } from "./game.js";
import { enableSetupShortcut } from "./setup.js";
import {
    enableClickToStart,
    enableFullscreenShortcut,
    showCard,
    turnDisplayOff,
} from "./ui.js";

const LANGUAGE = getLanguageFromUrl();
document.documentElement.lang = LANGUAGE;

const camera = new Camera(document.getElementById("overlay"));

showCard({ card: START_CARD }, LANGUAGE);
enableFullscreenShortcut();
enableSetupShortcut(camera);
keepScreenAwake();

enableClickToStart()
    .then(turnDisplayOff)
    .then(loadDeck)
    .then(startGame(camera, LANGUAGE))
    .catch((error) => console.error("Startup flow failed:", error));
