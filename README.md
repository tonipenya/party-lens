# Party Lens 🎉

A tiny, slightly chaotic party game for one screen and one camera.

`Party Lens` shows random group prompts, turns the screen on/off dramatically, and snaps a few surprise photos along the way.

Intentionally silly 🤪.

Live version: https://tonipenya.github.io/party-lens/

## What it does

- Starts on click.
- Toggle fullscreen with `F`.
- Toggle camera setup preview with `S` (press again to return to the game).
- Toggle pause screen with `P` (press again to return to the game).
- Toggle continuous burst-photo mode with `B` (press again to return to the game).
- Loads shuffled prompt cards from `cards.json`.
- Cycles through card types:
    - `action`
    - `photo`
    - `talk`
- For each round, it takes three camera pictures with short delays 📸.
- In burst-photo mode, it takes pictures continuously: show capture briefly, hide, wait 2 minutes, repeat.
- Supports three languages via URL parameter 🌍:
    - `?lang=en`
    - `?lang=es`
    - `?lang=ca`

## Run it locally

Because this uses camera access and `fetch`, run it from a local server (not `file://`) ⚠️.

```bash
# from project root
python3 -m http.server 8080
```

Then open:

- `http://localhost:8080`
- or `http://localhost:8080?lang=es`

## Tweak it

- Prompt content: `cards.json`
- Timing + flow logic: `game.js`
- Camera behavior: `camera.js`
- Styles: `style.css`

If the pacing feels too polite, lower the intervals in `env.js` and make it mildly unhinged.

## Notes

- Camera permission is required ✅.
- Best experienced on a laptop/tablet facing a group.
- If fullscreen is blocked by the browser, it still works, just less theatrical.
- During camera setup preview, the pause screen, and burst-photo mode, regular rounds are paused until you exit.

## License

This project is licensed under
[Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International](https://creativecommons.org/licenses/by-nc-nd/4.0/).
