let cards = [];
const TIME_BETWEEN_CARDS = 5000; // milliseconds
const TIME_CARD_VISIBLE = 3000; // milliseconds

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

function displayNextCard() {
    const container = document.getElementById("container");
    const template = document.getElementById("card-template");
    const overlay = document.getElementById("overlay");

    overlay.classList.remove("sleep");

    const card = cards.pop();
    const clone = template.content.cloneNode(true);
    if (card) {
        clone.getElementById("card-text").textContent = card.text;
        container.setAttribute("data-type", card.type);
    }

    currentCard = document.querySelector(".card");
    if (currentCard) {
        container.removeChild(currentCard);
    }
    container.appendChild(clone);

    setTimeout(() => {
        overlay.classList.add("sleep");
    }, TIME_CARD_VISIBLE);
}

function startAutoDisplay() {
    displayNextCard();
    setInterval(displayNextCard, TIME_BETWEEN_CARDS);
}

fetch("cards.json")
    .then((response) => response.json())
    .then(shuffle)
    .then((shuffledCards) => (cards = shuffledCards))
    .then(startAutoDisplay)
    .catch((error) => console.error("Error loading cards:", error));

document.getElementById("next-btn").addEventListener("click", displayNextCard);
