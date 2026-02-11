import { getCardText } from "./env.js";

function showCard(data, language) {
    const { card } = data;
    const container = document.getElementById("container");
    const template = document.getElementById("card-template");

    const clone = template.content.cloneNode(true);
    clone.getElementById("card-text").textContent = getCardText(card, language);
    container.setAttribute("data-type", card?.type ?? "none");
    container.replaceChildren(clone);

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

function enableClickToStart() {
    const container = document.getElementById("container");
    return new Promise((resolve) => {
        container.addEventListener("click", resolve, { once: true });
    });
}

export {
    enableClickToStart,
    enableFullscreenShortcut,
    showCapturedImage,
    showCard,
    toggleFullscreen,
    turnDisplayOff,
    turnDisplayOn,
};
