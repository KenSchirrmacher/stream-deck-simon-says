# Simon Says for Stream Deck

A pattern-memory game for your Stream Deck. The keys light up one at a time in a growing
sequence — watch, then repeat it back in the same order. Get it right and the sequence grows
by one; get it wrong and it flashes red and starts over. Every five rounds earns a little
fireworks celebration before the sequence keeps growing.

All the key art is generated as plain SVG at runtime — no image files.

## Build

```
npm install
npm run build
npx @elgato/cli link com.homedeck.simonsays.sdPlugin
```

Dev watch: `npm run watch`

If `npm run build` fails on `sharp` (native binary), just re-run `npm install` once — sharp
downloads a prebuilt binary for your platform on install.

## Setting it up

This plugin ships one action, **Pad** — it doesn't come with a prebuilt layout, because Stream
Deck plugins can't create pages/profiles on your behalf. You build the grid once, the same way
you'd lay out any other folder:

1. Create a folder (or a whole profile) on your Stream Deck and drag **Pad** (under the "Simon
   Says" category) onto every key you want in play. Each pad gets its own color automatically.
2. The first round deals itself automatically a moment after the page becomes visible (it waits
   briefly for all the keys to finish appearing before the sequence starts playing).

**Handing the deck to a kid without worry:** put the grid on its own folder page, and use Stream
Deck's built-in **Parent Folder** action (no plugin needed) on one key as the way out. Launch the
folder from your main page with the built-in **Create Folder** / navigation action.

## Game internals

- `src/game/engine.ts` — one shared state machine per Stream Deck device: the growing sequence,
  which step the player is on, and the timers for sequence playback, press feedback, the
  mistake flash, and the milestone celebration.
- `src/game/render.ts` — all the key art (idle/lit pad, wrong-press flash, fireworks), generated
  at runtime.
- `src/game/palette.ts` — the color assigned to each pad, cycled by registration order.
- Tuning constants live at the top of `engine.ts`: `LIGHT_ON_MS`/`LIGHT_GAP_MS` (playback speed),
  `STRIKE_FLASH_MS` (mistake flash), `MILESTONE_EVERY` (rounds between celebrations).

## License

MIT
