import { Camera } from "./camera.js";

let cards = [];
const SUPPORTED_LANGUAGES = ["es", "ca", "en"];
const LANGUAGE = getLanguageFromUrl();
document.documentElement.lang = LANGUAGE;
const UI_TEXTS = {
    startCard: {
        en: "Click to start<br>(📸 / ⚡️ / 💬)",
        es: "Haz clic para empezar<br>(📸 / ⚡️ / 💬)",
        ca: "Fes clic per començar<br>(📸 / ⚡️ / 💬)",
    },
    noMoreCards: {
        en: "No more cards!",
        es: "No hay más tarjetas!",
        ca: "No queden targetes!",
    },
};
// Times in milliseconds
const CARD_INTERVAL_START_MINUTES = 10;
const CARD_INTERVAL_STEP_MINUTES = 2;
const CARD_INTERVAL_MAX_MINUTES = 25;
const FIRST_PICTURE_DELAY = 5000;
const DELAY_BETWEEN_PICTURES = 2000;
const camera = new Camera(document.getElementById("overlay"));
let wakeLock = null;

function displayNewCard() {
    return camera
        .startCamera()
        .then(getNextCard)
        .then(showCard)
        .then(turnDisplayOn)
        .then(delayedExecution(camera.takePicture, FIRST_PICTURE_DELAY))
        .then(showCapturedImage)
        .then(delayedExecution(camera.takePicture, DELAY_BETWEEN_PICTURES))
        .then(showCapturedImage)
        .then(delayedExecution(camera.takePicture, DELAY_BETWEEN_PICTURES))
        .then(showCapturedImage)
        .then(camera.stopCamera)
        .then(delayedExecution(turnDisplayOff, DELAY_BETWEEN_PICTURES));
}

showStartCard();
enableFullscreenShortcut();
enableClickToStart()
    .then(keepScreenAwake)
    .then(turnDisplayOff)
    .then(() => fetch("cards.json"))
    .then((response) => response.json())
    .then(shuffle)
    .then((shuffledCards) => (cards = shuffledCards))
    .then(startAutoDisplay)
    .catch((error) => console.error("Error loading cards:", error));

// Core flow utilities are defined below.
function showStartCard() {
    const container = document.getElementById("container");
    const template = document.getElementById("card-template");
    const clone = template.content.cloneNode(true);
    clone.getElementById("card-text").innerHTML = getUiText("startCard");
    container.setAttribute("data-type", "none");
    container.replaceChildren(clone);
}

function toggleFullscreen() {
    if (document.fullscreenElement) {
        return document.exitFullscreen?.() ?? Promise.resolve();
    }
    const element = document.documentElement;
    if (element.requestFullscreen) {
        return element.requestFullscreen();
    }
    if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    }
    return Promise.resolve();
}

function enableClickToStart() {
    const container = document.getElementById("container");
    return new Promise((resolve) => {
        container.addEventListener("click", resolve, { once: true });
    });
}

function enableFullscreenShortcut() {
    document.addEventListener("keydown", (event) => {
        if (event.repeat) {
            return;
        }
        if (event.key.toLowerCase() !== "f") {
            return;
        }
        event.preventDefault();
        toggleFullscreen().catch((error) =>
            console.warn("Fullscreen request failed:", error),
        );
    });
}

function keepScreenAwake(data) {
    return requestWakeLock().then(() => data);
}

async function startAutoDisplay() {
    let waitMinutes = CARD_INTERVAL_START_MINUTES;

    await displayNewCard();
    while (cards.length > 0) {
        await delayedExecution(displayNewCard, waitMinutes * 60 * 1000);
        waitMinutes = Math.min(
            waitMinutes + CARD_INTERVAL_STEP_MINUTES,
            CARD_INTERVAL_MAX_MINUTES,
        );
    }

    turnDisplayOff();
}

function getNextCard(data) {
    const card = cards.pop();
    if (!card) {
        return { ...data, card: null, language: LANGUAGE };
    }
    return { ...data, card, language: LANGUAGE };
}

function showCard(data) {
    const { card } = data;
    const container = document.getElementById("container");
    const template = document.getElementById("card-template");

    const clone = template.content.cloneNode(true);
    clone.getElementById("card-text").textContent = getCardText(card);
    container.setAttribute("data-type", card?.type ?? "none");
    container.replaceChildren(clone);

    return data;
}

function getCardText(card) {
    if (!card) {
        return getUiText("noMoreCards");
    }
    if (card.texts && typeof card.texts === "object") {
        return card.texts[LANGUAGE] ?? Object.values(card.texts)[0] ?? "";
    }
    return card.text ?? "";
}

function getUiText(key) {
    const entry = UI_TEXTS[key];
    if (!entry) {
        return "";
    }
    return entry[LANGUAGE] ?? entry.en ?? Object.values(entry)[0] ?? "";
}

function getLanguageFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get("lang")?.toLowerCase();
    if (!lang || !SUPPORTED_LANGUAGES.includes(lang)) {
        return "en";
    }

    return lang;
}

function showCapturedImage(data) {
    const { capturedImageSrc } = data;
    if (!capturedImageSrc) {
        return data;
    }

    const card = document.querySelector(".card");
    const template = document.getElementById("captured-image-template");
    if (!card || !template) {
        return data;
    }

    const existingContainer = card.querySelector(".captured-photo-container");
    if (existingContainer) {
        existingContainer.remove();
    }

    const clone = template.content.cloneNode(true);
    const image = clone.querySelector(".captured-photo");
    image.src = capturedImageSrc;
    card.classList.add("with-photo");
    card.appendChild(clone);

    return data;
}

function turnDisplayOn(data) {
    const overlay = document.getElementById("overlay");
    overlay.classList.remove("display-off");
    return data;
}

function turnDisplayOff(data) {
    const overlay = document.getElementById("overlay");
    overlay.classList.add("display-off");
    return data;
}

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

function delayedExecution(fn, delay) {
    const delayedFn = (data) =>
        new Promise((resolve) => {
            setTimeout(() => {
                Promise.resolve(fn(data)).then(() => resolve(data));
            }, delay);
        });

    // Also allow: await delayedExecution(fn, delay)
    delayedFn.then = (resolve, reject) => delayedFn(undefined).then(resolve, reject);

    return delayedFn;
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

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        keepScreenAwake();
    }
});
