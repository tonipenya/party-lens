class Camera {
    constructor(overlay) {
        this.overlay = overlay;
        this.currentStream = null;
        this.currentVideo = null;

        this.takePicture = this.takePicture.bind(this);
        this.stopCamera = this.stopCamera.bind(this);
    }

    async startCamera() {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 4096 },
                height: { ideal: 4096 },
            },
        });

        this.currentStream = stream;
        const video = document.createElement("video");
        this.currentVideo = video;
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;

        await new Promise((resolve, reject) => {
            video.addEventListener("loadedmetadata", resolve, { once: true });
            video.addEventListener("error", reject, { once: true });
        });

        await video.play();
        return { card: null, video };
    }

    takePicture(data) {
        const { card, video, language } = data;

        this.flashScreen();

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);
        data.capturedImageSrc = canvas.toDataURL("image/png");

        canvas.toBlob((blob) => {
            if (!blob) {
                console.warn("Failed to create image blob for download.");
                return;
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${card.texts[language]}.png`;
            a.click();
            URL.revokeObjectURL(url);
        }, "image/png");
    }

    stopCamera(data) {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach((t) => t.stop());
            this.currentStream = null;
        }
        if (this.currentVideo) {
            this.currentVideo.srcObject = null;
            this.currentVideo = null;
        }
        return data;
    }

    flashScreen() {
        this.overlay.classList.remove("flash");
        // Force reflow so removing and re-adding the class restarts the CSS animation.
        void this.overlay.offsetWidth;
        this.overlay.classList.add("flash");
        setTimeout(() => {
            this.overlay.classList.remove("flash");
        }, 420);
    }
}

export { Camera };
