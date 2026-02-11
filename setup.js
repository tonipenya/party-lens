class SetupController {
    constructor(camera) {
        this.camera = camera;
        this.activeCard = null;
        this.setupCard = null;
        this.dataType = null;
        this.displayOff = false;
    }

    isActive() {
        return !!this.activeCard;
    }

    async toggle() {
        if (this.isActive()) {
            this.stop();
            return;
        }

        const container = document.getElementById("container");
        const overlay = document.getElementById("overlay");
        const activeCard = container?.querySelector(".card");
        if (!container || !overlay || !activeCard) {
            return;
        }

        this.activeCard = activeCard;
        this.dataType = container.getAttribute("data-type");
        this.displayOff = overlay.classList.contains("display-off");

        activeCard.style.display = "none";
        overlay.classList.remove("display-off");

        const previewContainer = this.renderSetupCard(container);
        if (!previewContainer) {
            this.stop();
            return;
        }

        try {
            const { video } = await this.camera.startCamera();
            video.classList.add("camera-preview");
            previewContainer.replaceChildren(video);
        } catch (error) {
            console.warn("Setup camera preview failed:", error);
            this.stop();
        }
    }

    stop() {
        if (!this.isActive()) {
            return;
        }

        const container = document.getElementById("container");
        const overlay = document.getElementById("overlay");

        this.camera.stopCamera();
        this.setupCard?.remove();
        this.activeCard.style.display = "";

        if (container) {
            if (this.dataType) {
                container.setAttribute("data-type", this.dataType);
            } else {
                container.removeAttribute("data-type");
            }
        }

        if (overlay) {
            if (this.displayOff) {
                overlay.classList.add("display-off");
            } else {
                overlay.classList.remove("display-off");
            }
        }

        this.activeCard = null;
        this.setupCard = null;
        this.dataType = null;
        this.displayOff = false;
    }

    renderSetupCard(container) {
        const template = document.getElementById("card-template");
        if (!template) {
            return null;
        }

        const clone = template.content.cloneNode(true);
        const card = clone.querySelector(".card");
        const title = clone.getElementById("card-text");
        if (!card || !title) {
            return null;
        }

        title.textContent = "Camera setup";
        card.classList.add("with-photo");

        const previewContainer = document.createElement("div");
        previewContainer.className = "captured-photo-container";
        card.appendChild(previewContainer);

        container.setAttribute("data-type", "setup");
        container.appendChild(card);
        this.setupCard = card;

        return previewContainer;
    }
}

let setupController = null;

function enableSetupShortcut(camera) {
    setupController = new SetupController(camera);

    document.addEventListener("keydown", (event) => {
        if (event.repeat) {
            return;
        }
        if (event.key.toLowerCase() !== "s") {
            return;
        }

        event.preventDefault();
        setupController.toggle().catch((error) =>
            console.warn("Setup toggle failed:", error),
        );
    });
}

function isSetupActive() {
    return setupController?.isActive() ?? false;
}

export { enableSetupShortcut, isSetupActive };
