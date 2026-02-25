import {
    ACTIVITY_MAX_DELAY,
    ACTIVITY_START_DELAY,
    ACTIVITY_STEP_DELAY,
    BURST_PHOTO_CARD,
    BURST_SHOW_DELAY,
    DELAY_BETWEEN_BURST_SHOTS,
    DELAY_BETWEEN_PICTURES,
    END_CARD,
    FIRST_SHOT_DELAY,
    START_CARD,
} from "./env.js";
import {
    hideCapturedImage,
    showCapturedImage,
    showCard,
    showIdle,
    showPause,
    showSetup,
    toggleFullscreen,
} from "./ui.js";

const State = Object.freeze({
    NOT_STARTED: "not_started",
    IDLE: "idle",
    ACTIVITY: "activity",
    BURST_PHOTO: "burst_photo",
    BURST_IDLE: "burst_idle",
    ENDED: "ended",
    SETUP: "setup",
    PAUSED: "paused",
});

const Trigger = Object.freeze({
    CLICK: "click",
    KEY_FULLSCREEN: "key_fullscreen",
    KEY_SETUP: "key_setup",
    KEY_PAUSE: "key_pause",
    KEY_BURST_PHOTO: "key_burst_photo",
    TIMER_ACTIVITY: "timer_activity",
    BURST_PICTURE_TAKEN: "burst_picture_taken",
    TIMER_BURST: "timer_burst",
    ACTIVITY_COMPLETED: "activity_completed",
});

const INTERRUPT_RETRY_DELAY = 1000;

class NoneCommand {}
class ToggleFullscreenCommand {}
class ScheduleCommand {
    constructor(trigger, delay) {
        this.trigger = trigger;
        this.delay = delay;
    }
}
class EnterSetupCommand {}
class ExitSetupCommand {
    constructor(previousState) {
        this.previousState = previousState;
    }
}
class EnterPauseCommand {}
class ExitPauseCommand {
    constructor(previousState) {
        this.previousState = previousState;
    }
}
class RunActivityCommand {}
class ShowBurstCommand {}
class EndBurstCommand {
    constructor(previousState) {
        this.previousState = previousState;
    }
}

class GameMachine {
    constructor() {
        this.state = State.NOT_STARTED;
        this.previousState = State.NOT_STARTED;
        this.activityDelay = ACTIVITY_START_DELAY;
    }

    nextCommand(trigger) {
        if (trigger === Trigger.KEY_FULLSCREEN) {
            return new ToggleFullscreenCommand();
        }

        if (trigger === Trigger.CLICK && this.state === State.NOT_STARTED) {
            this.state = State.IDLE;
            return new ScheduleCommand(Trigger.TIMER_ACTIVITY, 0);
        }

        if (trigger === Trigger.KEY_SETUP) {
            if (this.state === State.SETUP) {
                this.state = this.previousState;
                return new ExitSetupCommand(this.state);
            }

            if (this.canBeInterrupted()) {
                this.previousState = this.state;
                this.state = State.SETUP;
                return new EnterSetupCommand();
            }
        }

        if (trigger === Trigger.KEY_PAUSE) {
            if (this.state === State.PAUSED) {
                this.state = this.previousState;
                return new ExitPauseCommand(this.state);
            }

            if (this.canBeInterrupted() || this.state === State.BURST_IDLE) {
                this.previousState = this.state;
                this.state = State.PAUSED;
                return new EnterPauseCommand();
            }
        }

        if (trigger === Trigger.KEY_BURST_PHOTO) {
            if (this.state === State.BURST_PHOTO || this.state === State.BURST_IDLE) {
                this.state = this.previousState;
                return new EndBurstCommand(this.state);
            }

            if (this.canBeInterrupted()) {
                this.previousState = this.state;
                this.state = State.BURST_PHOTO;
                return new ShowBurstCommand();
            }
        }

        if (
            trigger === Trigger.BURST_PICTURE_TAKEN &&
            this.state === State.BURST_PHOTO
        ) {
            this.state = State.BURST_IDLE;
            return new ScheduleCommand(Trigger.TIMER_BURST, DELAY_BETWEEN_BURST_SHOTS);
        }

        if (trigger === Trigger.TIMER_BURST && this.state === State.BURST_IDLE) {
            this.state = State.BURST_PHOTO;
            return new ShowBurstCommand();
        }

        if (
            trigger === Trigger.TIMER_ACTIVITY &&
            (this.state === State.SETUP || this.state === State.PAUSED)
        ) {
            return new ScheduleCommand(Trigger.TIMER_ACTIVITY, INTERRUPT_RETRY_DELAY);
        }

        if (trigger === Trigger.TIMER_ACTIVITY && this.state === State.IDLE) {
            this.state = State.ACTIVITY;
            return new RunActivityCommand();
        }

        if (trigger === Trigger.ACTIVITY_COMPLETED && this.state === State.ACTIVITY) {
            this.activityDelay = Math.min(
                this.activityDelay + ACTIVITY_STEP_DELAY,
                ACTIVITY_MAX_DELAY,
            );
            this.state = State.IDLE;
            return new ScheduleCommand(Trigger.TIMER_ACTIVITY, this.activityDelay);
        }

        return new NoneCommand();
    }

    canBeInterrupted() {
        return (
            this.state === State.NOT_STARTED ||
            this.state === State.IDLE ||
            this.state === State.ENDED
        );
    }

    endGame() {
        this.state = State.ENDED;
    }
}

class GameController {
    constructor({ camera, language }) {
        this.camera = camera;
        this.language = language;

        this.machine = new GameMachine();
        this.deck = [];
        this.timerId = null;
    }

    async mount() {
        showCard({ card: START_CARD }, this.language);
        await this.loadShuffledDeck();

        const container = document.getElementById("container");
        const onStartClick = () => {
            container.removeEventListener("click", onStartClick);
            this.execute(this.machine.nextCommand(Trigger.CLICK));
        };
        container.addEventListener("click", onStartClick);

        document.addEventListener("keydown", (event) => {
            if (event.repeat) {
                return;
            }

            const key = event.key.toLowerCase();
            if (key === "f") {
                event.preventDefault();
                this.execute(this.machine.nextCommand(Trigger.KEY_FULLSCREEN));
                return;
            }
            if (key === "s") {
                event.preventDefault();
                this.execute(this.machine.nextCommand(Trigger.KEY_SETUP));
                return;
            }
            if (key === "p") {
                event.preventDefault();
                this.execute(this.machine.nextCommand(Trigger.KEY_PAUSE));
                return;
            }
            if (key === "b") {
                event.preventDefault();
                this.execute(this.machine.nextCommand(Trigger.KEY_BURST_PHOTO));
            }
        });
    }

    async execute(command) {
        try {
            switch (command.constructor) {
                case NoneCommand:
                    return;
                case ToggleFullscreenCommand:
                    toggleFullscreen().catch((error) =>
                        console.warn("Fullscreen request failed:", error),
                    );
                    return;
                case ScheduleCommand:
                    this.schedule(command.trigger, command.delay);
                    return;
                case EnterSetupCommand:
                    await this.enterSetup();
                    return;
                case ExitSetupCommand:
                    this.exitSetup(command.previousState);
                    return;
                case EnterPauseCommand:
                    this.enterPause();
                    return;
                case ExitPauseCommand:
                    this.exitPause(command.previousState);
                    return;
                case RunActivityCommand:
                    await this.runActivity();
                    return;
                case ShowBurstCommand:
                    await this.showBurst();
                    return;
                case EndBurstCommand:
                    this.endBurst(command.previousState);
                    return;
                default:
                    console.warn("Unknown command:", command);
                    return;
            }
        } catch (error) {
            console.error("Command execution failed:", error);
            await this.recover();
        }
    }

    async runActivity() {
        if (this.deck.length === 0) {
            this.machine.endGame();
            showCard({ card: END_CARD }, this.language);
            return;
        }

        const card = this.deck.pop();
        const { video } = await this.camera.startCamera();

        const data = { card, language: this.language, video };
        showCard(data, this.language);

        await this.captureAfterDelay(data, FIRST_SHOT_DELAY);
        await this.captureAfterDelay(data, DELAY_BETWEEN_PICTURES);
        await this.captureAfterDelay(data, DELAY_BETWEEN_PICTURES);

        this.camera.stopCamera(data);
        await this.wait(DELAY_BETWEEN_PICTURES);

        showIdle();
        await this.execute(this.machine.nextCommand(Trigger.ACTIVITY_COMPLETED));
    }

    async showBurst() {
        this.clearTimer();

        const { video } = await this.camera.startCamera();
        const data = { card: BURST_PHOTO_CARD, language: this.language, video };
        showCard(data, this.language);
        this.camera.takePicture(data);
        showCapturedImage(data);
        await this.wait(BURST_SHOW_DELAY);
        hideCapturedImage();
        this.camera.stopCamera(data);
        showIdle();
        await this.execute(this.machine.nextCommand(Trigger.BURST_PICTURE_TAKEN));
    }

    async enterSetup() {
        this.clearTimer();

        const { video } = await this.camera.startCamera();
        video.classList.add("camera-preview");
        showSetup(video);
    }

    exitSetup(previousState) {
        this.camera.stopCamera();
        this.restoreViewFromPreviousState(previousState);
    }

    enterPause() {
        this.clearTimer();
        showPause();
    }

    exitPause(previousState) {
        this.restoreViewFromPreviousState(previousState);
    }

    endBurst(previousState) {
        this.clearTimer();
        this.camera.stopCamera();
        hideCapturedImage();
        this.restoreViewFromPreviousState(previousState);
    }

    restoreViewFromPreviousState(previousState) {
        if (previousState === State.IDLE) {
            showIdle();
            this.schedule(Trigger.TIMER_ACTIVITY, this.machine.activityDelay);
            return;
        }

        if (previousState === State.BURST_IDLE) {
            showIdle();
            this.schedule(Trigger.TIMER_BURST, DELAY_BETWEEN_BURST_SHOTS);
            return;
        }

        if (previousState === State.ENDED) {
            showCard({ card: END_CARD }, this.language);
            return;
        }

        if (previousState === State.NOT_STARTED) {
            showCard({ card: START_CARD }, this.language);
        }
    }

    async captureAfterDelay(data, delay) {
        await this.wait(delay);
        this.camera.takePicture(data);
        showCapturedImage(data);
    }

    async loadShuffledDeck() {
        const response = await fetch("cards.json");
        const deck = await response.json();
        // Good-enough in-place shuffle for party prompts.
        this.deck = deck.sort(() => Math.random() - 0.5);
    }

    async recover() {
        const state = this.machine.state;

        if (state === State.ACTIVITY) {
            this.camera.stopCamera();
            showIdle();
            await this.execute(this.machine.nextCommand(Trigger.ACTIVITY_COMPLETED));
            return;
        }

        if (state === State.BURST_PHOTO || state === State.BURST_IDLE) {
            this.clearTimer();
            this.camera.stopCamera();
            hideCapturedImage();
            this.machine.state = State.BURST_IDLE;
            this.schedule(Trigger.TIMER_BURST, INTERRUPT_RETRY_DELAY);
            return;
        }

        this.camera.stopCamera();
        this.clearTimer();

        if (state === State.IDLE) {
            this.machine.state = State.IDLE;
            showIdle();
            this.schedule(Trigger.TIMER_ACTIVITY, this.machine.activityDelay);
            return;
        }

        if (state === State.SETUP) {
            this.machine.state = this.machine.previousState;
            this.exitSetup(this.machine.previousState);
            return;
        }
        if (state === State.PAUSED) {
            this.machine.state = this.machine.previousState;
            this.exitPause(this.machine.previousState);
            return;
        }

        if (state === State.ENDED) {
            showCard({ card: END_CARD }, this.language);
            return;
        }

        this.machine.state = State.NOT_STARTED;
        showCard({ card: START_CARD }, this.language);
    }

    schedule(trigger, delay) {
        this.setTimer(delay, () => this.execute(this.machine.nextCommand(trigger)));
    }

    wait(delay) {
        return new Promise((resolve) => {
            this.setTimer(delay, resolve);
        });
    }

    setTimer(delay, callback) {
        this.clearTimer();
        this.timerId = setTimeout(() => {
            this.timerId = null;
            callback();
        }, delay);
    }

    clearTimer() {
        if (this.timerId !== null) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }
}

export { GameController };
