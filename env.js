const SUPPORTED_LANGUAGES = ["es", "ca", "en"];
const START_CARD = {
    type: "none",
    texts: {
        en: "Click to start\n(📸 / ⚡️ / 💬)",
        es: "Haz clic para empezar\n(📸 / ⚡️ / 💬)",
        ca: "Fes clic per començar\n(📸 / ⚡️ / 💬)",
    },
};
const END_CARD = {
    type: "none",
    texts: {
        en: "No more cards!",
        es: "No hay más tarjetas!",
        ca: "No queden targetes!",
    },
};
const BURST_PHOTO_CARD = {
    type: "burst_photo",
    texts: {
        en: "Photo burst mode",
        es: "Modo ráfaga de fotos",
        ca: "Mode ràfega de fotos",
    },
};

// Times in milliseconds.
const ACTIVITY_START_DELAY = 10 * 60 * 1000;
const ACTIVITY_STEP_DELAY = 2 * 60 * 1000;
const ACTIVITY_MAX_DELAY = 25 * 60 * 1000;
const FIRST_SHOT_DELAY = 5 * 1000;
const DELAY_BETWEEN_PICTURES = 3 * 1000;
const BURST_SHOW_DELAY = 3 * 1000;
const DELAY_BETWEEN_BURST_SHOTS = 2 * 60 * 1000;

let wakeLock = null;
let wakeLockListenersBound = false;

class Logger {
    constructor(scope) {
        this.scopePrefix = `[${scope}]`;
    }

    info(message, context) {
        if (context === undefined) {
            console.info(`${this.scopePrefix} ${message}`);
            return;
        }
        console.info(`${this.scopePrefix} ${message}`, context);
    }

    warn(message, context) {
        if (context === undefined) {
            console.warn(`${this.scopePrefix} ${message}`);
            return;
        }
        console.warn(`${this.scopePrefix} ${message}`, context);
    }

    err(message, context) {
        if (context === undefined) {
            console.error(`${this.scopePrefix} ${message}`);
            return;
        }
        console.error(`${this.scopePrefix} ${message}`, context);
    }
}

const log = new Logger("env");

function getLanguageFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get("lang")?.toLowerCase();
    if (!lang || !SUPPORTED_LANGUAGES.includes(lang)) {
        return "en";
    }

    return lang;
}

function getCardText(card, language) {
    if (card.texts && typeof card.texts === "object") {
        return card.texts[language] ?? Object.values(card.texts)[0] ?? "";
    }
    return card.text ?? "";
}

async function requestWakeLock() {
    const canRequestWakeLock =
        "wakeLock" in navigator && document.visibilityState === "visible" && !wakeLock;

    if (!canRequestWakeLock) {
        return;
    }

    try {
        wakeLock = await navigator.wakeLock.request("screen");
        log.info("wake lock acquired");
        wakeLock.addEventListener(
            "release",
            () => {
                log.info("wake lock released");
                wakeLock = null;
            },
            { once: true },
        );
    } catch (error) {
        log.warn("wake lock request failed and was handled", error);
    }
}

function keepScreenAwake(data) {
    if (!wakeLockListenersBound) {
        wakeLockListenersBound = true;
        log.info("binding wake lock listeners");

        window.addEventListener("pointerdown", requestWakeLock, {
            once: true,
            passive: true,
        });
        window.addEventListener("keydown", requestWakeLock, {
            once: true,
        });

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                log.info("document visible; retrying wake lock");
                requestWakeLock();
            }
        });
    }

    return requestWakeLock().then(() => data);
}

export {
    ACTIVITY_MAX_DELAY,
    ACTIVITY_START_DELAY,
    ACTIVITY_STEP_DELAY,
    BURST_PHOTO_CARD,
    BURST_SHOW_DELAY,
    DELAY_BETWEEN_BURST_SHOTS,
    DELAY_BETWEEN_PICTURES,
    END_CARD,
    FIRST_SHOT_DELAY,
    getCardText,
    getLanguageFromUrl,
    keepScreenAwake,
    Logger,
    START_CARD,
};
