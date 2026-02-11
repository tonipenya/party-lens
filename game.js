import {
    CARD_INTERVAL_MAX_MINUTES,
    CARD_INTERVAL_START_MINUTES,
    CARD_INTERVAL_STEP_MINUTES,
    DELAY_BETWEEN_PICTURES,
    END_CARD,
    FIRST_PICTURE_DELAY,
} from "./env.js";
import { showCapturedImage, showCard, turnDisplayOff, turnDisplayOn } from "./ui.js";

let cards = [];

function loadDeck() {
    return fetch("cards.json")
        .then((response) => response.json())
        .then(shuffle);
}

function startGame(camera, language) {
    return (deck) => {
        cards = deck;
        return startAutoDisplay(camera, language);
    };
}

function displayNewCard(camera, language) {
    return camera
        .startCamera()
        .then((data) => getNextCard(data, language))
        .then((data) => showCard(data, language))
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

async function startAutoDisplay(camera, language) {
    let waitMinutes = CARD_INTERVAL_START_MINUTES;

    await displayNewCard(camera, language);
    while (cards.length > 0) {
        await delayedExecution(
            () => displayNewCard(camera, language),
            waitMinutes * 60 * 1000,
        );
        waitMinutes = Math.min(
            waitMinutes + CARD_INTERVAL_STEP_MINUTES,
            CARD_INTERVAL_MAX_MINUTES,
        );
    }

    turnDisplayOff();
}

function getNextCard(data, language) {
    const card = cards.pop();
    if (!card) {
        return { ...data, card: END_CARD, language };
    }
    return { ...data, card, language };
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

export { loadDeck, startGame };
