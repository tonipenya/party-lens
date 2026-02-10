import { Camera } from "./camera.js";

let cards = [];
const TIME_BETWEEN_CARDS = 10000; // milliseconds
const TIME_CARD_VISIBLE = 5000; // milliseconds
const PICTURE_DELAY = 2000; // milliseconds
const camera = new Camera(document.getElementById("overlay"));

function displayNewCard() {
    return camera
        .startCamera()
        .then(getNextCard)
        .then(showCard)
        .then(turnDisplayOn)
        .then(delayedExecution(camera.takePicture, PICTURE_DELAY))
        .then(showCapturedImage)
        .then(camera.stopCamera)
        .then(delayedExecution(turnDisplayOff, TIME_CARD_VISIBLE))
        .then(hideCapturedImage);
}

fetch("cards.json")
    .then((response) => response.json())
    .then(shuffle)
    .then((shuffledCards) => (cards = shuffledCards))
    .then(() => setInterval(displayNewCard, TIME_BETWEEN_CARDS))
    .catch((error) => console.error("Error loading cards:", error));

// Core flow utilities are defined below.

function getNextCard(data) {
    const card = cards.pop();
    if (!card) {
        return { ...data, card: null };
    }
    return { ...data, card };
}

function showCard(data) {
    const { card, video } = data;
    const container = document.getElementById("container");
    const template = document.getElementById("card-template");

    if (!card) {
        const clone = template.content.cloneNode(true);
        clone.getElementById("card-text").textContent = "No more cards!";
        container.setAttribute("data-type", "none");
        return data;
    }

    const clone = template.content.cloneNode(true);
    clone.getElementById("card-text").textContent = card.text;
    container.setAttribute("data-type", card.type);

    const currentCard = document.querySelector(".card");
    if (currentCard) {
        container.removeChild(currentCard);
    }
    container.appendChild(clone);

    return data;
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
    card.appendChild(clone);

    return data;
}

function hideCapturedImage(data) {
    const imageContainer = document.querySelector(".captured-photo-container");
    if (imageContainer) {
        imageContainer.remove();
    }
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
    return (data) =>
        new Promise((resolve) => {
            setTimeout(() => {
                fn(data);
                resolve(data);
            }, delay);
        });
}
