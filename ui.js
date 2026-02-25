import { getCardText } from "./env.js";

function createCardClone(text = "") {
    const template = document.getElementById("card-template");
    const clone = template.content.cloneNode(true);
    clone.getElementById("card-text").textContent = text;
    return clone;
}

function replaceWithTemplate(container, templateId) {
    const template = document.getElementById(templateId);
    const type = template.dataset.containerType;
    if (type) {
        container.setAttribute("data-type", type);
    }
    container.replaceChildren(template.content.cloneNode(true));
}

function showCard(data, language) {
    const { card } = data;
    const container = document.getElementById("container");
    const clone = createCardClone(getCardText(card, language));
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
    replaceWithTemplate(container, "setup-card-template");
    const previewContainer = container.querySelector(".captured-photo-container");
    previewContainer.replaceChildren(video);
}

function showIdle(data) {
    const container = document.getElementById("container");
    const clone = createCardClone();

    container.setAttribute("data-type", "idle");
    container.replaceChildren(clone);

    return data;
}

function showPause(data) {
    const container = document.getElementById("container");
    replaceWithTemplate(container, "pause-card-template");

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
    showPause,
    showSetup,
    toggleFullscreen,
};
