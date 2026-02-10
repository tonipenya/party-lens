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
const TIME_BETWEEN_CARDS = 10000;
const TIME_CARD_VISIBLE = 5000;
const FIRST_PICTURE_DELAY = 2000;
const DELAY_BETWEEN_PICTURES = 1000;
const camera = new Camera(document.getElementById("overlay"));

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
        .then(delayedExecution(turnDisplayOff, TIME_CARD_VISIBLE));
}

showStartCard();
bindStartCard()
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

function requestFullscreen() {
    if (document.fullscreenElement) {
        return Promise.resolve();
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

function bindStartCard() {
    const container = document.getElementById("container");
    return new Promise((resolve) => {
        container.addEventListener(
            "click",
            () => {
                requestFullscreen()
                    .catch((error) => console.warn("Fullscreen request failed:", error))
                    .finally(resolve);
            },
            { once: true },
        );
    });
}

async function startAutoDisplay() {
    while (cards.length > 0) {
        await displayNewCard();
        await delayedExecution(() => {}, TIME_BETWEEN_CARDS);
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
                fn(data);
                resolve(data);
            }, delay);
        });

    // Also allow: await delayedExecution(fn, delay)
    delayedFn.then = (resolve, reject) =>
        delayedFn(undefined).then(resolve, reject);

    return delayedFn;
}
