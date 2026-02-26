import { Camera } from "./camera.js";
import { getLanguageFromUrl, keepScreenAwake, Logger } from "./env.js";
import { GameController } from "./game.js";

const log = new Logger("app");

const language = getLanguageFromUrl();
document.documentElement.lang = language;
log.info("initialized", { language });

const camera = new Camera(document.getElementById("overlay"));
const game = new GameController({ camera, language });

keepScreenAwake();
game.mount().catch((error) => log.err("startup flow failed", error));
