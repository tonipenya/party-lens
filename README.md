# Party Lens

A tiny, slightly chaotic party game for one screen and one camera.

`Party Lens` shows random group prompts, turns the screen on/off dramatically, and snaps a few surprise photos along the way.

Intentionally silly.

## What it does

- Starts on click (and asks for fullscreen)
- Loads shuffled prompt cards from `cards.json`
- Cycles through card types:
    - `action`
    - `photo`
    - `talk`
- For each round, takes 3 camera pictures with short delays
- Supports 3 languages via URL param:
    - `?lang=en`
    - `?lang=es`
    - `?lang=ca`

## Run it locally

Because this uses camera + `fetch`, run it from a local server (not `file://`).

```bash
# from project root
python3 -m http.server 8080
```

Then open:

- `http://localhost:8080`
- or `http://localhost:8080?lang=es`

## Tweak it

- Prompt content: `cards.json`
- Timing + flow logic: `app.js`
- Camera behavior: `camera.js`
- Styles: `style.css`

If the pacing feels too polite, lower the intervals in `app.js` and make it mildly unhinged.

## Notes

- Camera permission is required.
- Best experienced on a laptop/tablet facing a group.
- If fullscreen is blocked by the browser, it still works, just less theatrical.

## License

This project is licensed under
[Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International](https://creativecommons.org/licenses/by-nc-nd/4.0/).
