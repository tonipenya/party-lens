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

// Times in milliseconds.
const CARD_INTERVAL_START_MINUTES = 10;
const CARD_INTERVAL_STEP_MINUTES = 2;
const CARD_INTERVAL_MAX_MINUTES = 25;
const FIRST_PICTURE_DELAY = 5000;
const DELAY_BETWEEN_PICTURES = 2000;

let wakeLock = null;
let wakeLockListenersBound = false;

function getLanguageFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get("lang")?.toLowerCase();
    if (!lang || !SUPPORTED_LANGUAGES.includes(lang)) {
        return "en";
    }

    return lang;
}

function getCardText(card, language) {
    if (!card) {
        return "";
    }
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
        wakeLock.addEventListener(
            "release",
            () => {
                wakeLock = null;
            },
            { once: true },
        );
    } catch (error) {
        console.warn("Wake lock request failed:", error);
    }
}

function keepScreenAwake(data) {
    if (!wakeLockListenersBound) {
        wakeLockListenersBound = true;

        window.addEventListener("pointerdown", requestWakeLock, {
            once: true,
            passive: true,
        });
        window.addEventListener("keydown", requestWakeLock, {
            once: true,
        });

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                requestWakeLock();
            }
        });
    }

    return requestWakeLock().then(() => data);
}

export {
    CARD_INTERVAL_MAX_MINUTES,
    CARD_INTERVAL_START_MINUTES,
    CARD_INTERVAL_STEP_MINUTES,
    DELAY_BETWEEN_PICTURES,
    END_CARD,
    FIRST_PICTURE_DELAY,
    getCardText,
    getLanguageFromUrl,
    keepScreenAwake,
    START_CARD,
};
