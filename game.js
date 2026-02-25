import {
    CARD_INTERVAL_MAX_MINUTES,
    CARD_INTERVAL_START_MINUTES,
    CARD_INTERVAL_STEP_MINUTES,
    DELAY_BETWEEN_PICTURES,
    END_CARD,
    FIRST_PICTURE_DELAY,
    START_CARD,
} from "./env.js";
import {
    showCapturedImage,
    showCard,
    showSetup,
    toggleFullscreen,
    turnDisplayOff,
    turnDisplayOn,
} from "./ui.js";

const State = Object.freeze({
    NOT_STARTED: "not_started",
    IDLE: "idle",
    ACTIVITY: "activity",
    ENDED: "ended",
    SETUP: "setup",
});

const Trigger = Object.freeze({
    CLICK: "click",
    KEY_FULLSCREEN: "key_fullscreen",
    KEY_SETUP: "key_setup",
    TIMER_ACTIVITY: "timer_activity",
    ACTIVITY_COMPLETED: "activity_completed",
});

const SETUP_TIMER_RETRY_MS = 1000;

class NoneCommand {}
class ToggleFullscreenCommand {}
class ScheduleActivityCommand {
    constructor(delayMs) {
        this.delayMs = delayMs;
    }
}
class EnterSetupCommand {}
class ExitSetupCommand {
    constructor(previousState) {
        this.previousState = previousState;
    }
}
class RunActivityCommand {}

class GameMachine {
    constructor() {
        this.state = State.NOT_STARTED;
        this.previousState = State.NOT_STARTED;
        this.intervalMinutes = CARD_INTERVAL_START_MINUTES;
    }

    nextCommand(trigger) {
        if (trigger === Trigger.KEY_FULLSCREEN) {
            return new ToggleFullscreenCommand();
        }

        if (trigger === Trigger.CLICK && this.state === State.NOT_STARTED) {
            this.state = State.IDLE;
            return new ScheduleActivityCommand(0);
        }

        if (trigger === Trigger.KEY_SETUP) {
            if (this.state === State.SETUP) {
                this.state = this.previousState;
                return new ExitSetupCommand(this.state);
            }

            if (this.canEnterSetup()) {
                this.previousState = this.state;
                this.state = State.SETUP;
                return new EnterSetupCommand();
            }
        }

        if (trigger === Trigger.TIMER_ACTIVITY && this.state === State.SETUP) {
            return new ScheduleActivityCommand(SETUP_TIMER_RETRY_MS);
        }

        if (trigger === Trigger.TIMER_ACTIVITY && this.state === State.IDLE) {
            this.state = State.ACTIVITY;
            return new RunActivityCommand();
        }

        if (trigger === Trigger.ACTIVITY_COMPLETED && this.state === State.ACTIVITY) {
            this.intervalMinutes = Math.min(
                this.intervalMinutes + CARD_INTERVAL_STEP_MINUTES,
                CARD_INTERVAL_MAX_MINUTES,
            );
            this.state = State.IDLE;
            return new ScheduleActivityCommand(this.intervalMinutes * 60 * 1000);
        }

        return new NoneCommand();
    }

    canEnterSetup() {
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
                case ScheduleActivityCommand:
                    this.scheduleActivity(command.delayMs);
                    return;
                case EnterSetupCommand:
                    await this.enterSetup();
                    return;
                case ExitSetupCommand:
                    this.exitSetup(command.previousState);
                    return;
                case RunActivityCommand:
                    try {
                        await this.runActivity();
                    } catch (error) {
                        // Reschedule task to avoid leaving the game in a broken state
                        await this.recoverFromActivityFailure();
                    }
                    return;
                default:
                    console.warn("Unknown command:", command);
                    return;
            }
        } catch (error) {
            console.error("Command execution failed:", error);
            this.recoverFromFailure();
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

        await this.captureAfterDelay(data, FIRST_PICTURE_DELAY);
        await this.captureAfterDelay(data, DELAY_BETWEEN_PICTURES);
        await this.captureAfterDelay(data, DELAY_BETWEEN_PICTURES);

        this.camera.stopCamera(data);
        await this.wait(DELAY_BETWEEN_PICTURES);

        turnDisplayOff();
        await this.execute(this.machine.nextCommand(Trigger.ACTIVITY_COMPLETED));
    }

    async enterSetup() {
        this.clearTimer();

        const { video } = await this.camera.startCamera();
        video.classList.add("camera-preview");
        showSetup(video);
        turnDisplayOn();
    }

    exitSetup(previousState) {
        this.camera.stopCamera();

        if (previousState === State.IDLE) {
            this.scheduleActivity();
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

    async captureAfterDelay(data, delayMs) {
        await this.wait(delayMs);
        this.camera.takePicture(data);
        showCapturedImage(data);
    }

    async loadShuffledDeck() {
        const response = await fetch("cards.json");
        const deck = await response.json();
        // Good-enough in-place shuffle for party prompts.
        this.deck = deck.sort(() => Math.random() - 0.5);
    }

    async recoverFromActivityFailure() {
        if (this.machine.state !== State.ACTIVITY) {
            return;
        }

        this.camera.stopCamera();
        turnDisplayOff();
        await this.execute(this.machine.nextCommand(Trigger.ACTIVITY_COMPLETED));
    }

    recoverFromFailure() {
        this.clearTimer();
        this.camera.stopCamera();

        if (
            this.machine.state === State.IDLE ||
            this.machine.state === State.ACTIVITY
        ) {
            this.machine.state = State.IDLE;
            this.scheduleActivity();
            return;
        }

        if (this.machine.state === State.SETUP) {
            this.machine.state = this.machine.previousState;
            this.exitSetup(this.machine.previousState);
            return;
        }

        if (this.machine.state === State.ENDED) {
            showCard({ card: END_CARD }, this.language);
            return;
        }

        this.machine.state = State.NOT_STARTED;
        showCard({ card: START_CARD }, this.language);
    }

    scheduleActivity(delayMs = this.machine.intervalMinutes * 60 * 1000) {
        this.setTimer(delayMs, () =>
            this.execute(this.machine.nextCommand(Trigger.TIMER_ACTIVITY)),
        );
    }

    wait(delayMs) {
        return new Promise((resolve) => {
            this.setTimer(delayMs, resolve);
        });
    }

    setTimer(delayMs, callback) {
        this.clearTimer();
        this.timerId = setTimeout(() => {
            this.timerId = null;
            callback();
        }, delayMs);
    }

    clearTimer() {
        if (this.timerId !== null) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }
}

export { GameController };
