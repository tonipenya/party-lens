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

function showSetup(video) {
    const container = document.getElementById("container");
    const template = document.getElementById("card-template");

    const clone = template.content.cloneNode(true);
    const card = clone.querySelector(".card");
    const title = clone.getElementById("card-text");

    title.textContent = "Camera setup";
    card.classList.add("with-photo");

    const previewContainer = document.createElement("div");
    previewContainer.className = "captured-photo-container";
    previewContainer.replaceChildren(video);
    card.appendChild(previewContainer);

    container.setAttribute("data-type", "setup");
    container.replaceChildren(clone);
}

function showIdle(data) {
    const container = document.getElementById("container");
    const template = document.getElementById("card-template");
    const clone = template.content.cloneNode(true);
    clone.getElementById("card-text").textContent = "";

    container.setAttribute("data-type", "idle");
    container.replaceChildren(clone);

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

export {
    showCapturedImage,
    showCard,
    showIdle,
    showSetup,
    toggleFullscreen,
};
