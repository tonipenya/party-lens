import { Camera } from "./camera.js";
import { getLanguageFromUrl, keepScreenAwake } from "./env.js";
import { GameController } from "./game.js";

const language = getLanguageFromUrl();
document.documentElement.lang = language;

const camera = new Camera(document.getElementById("overlay"));
const game = new GameController({ camera, language });

keepScreenAwake();
game.mount().catch((error) => console.error("Startup flow failed:", error));
