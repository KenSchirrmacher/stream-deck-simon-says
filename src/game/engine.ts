import streamDeck, { type KeyAction } from "@elgato/streamdeck";
import { celebrationFrame, padIdleFrame, padLitFrame, padWrongFrame } from "./render.js";
import { PALETTE } from "./palette.js";

const LIGHT_ON_MS = 420;
const LIGHT_GAP_MS = 180;
const PRE_PLAYBACK_DELAY_MS = 500;
const PRESS_FEEDBACK_MS = 150;
const STRIKE_FLASH_MS = 900;
const ROUND_PAUSE_MS = 500;
const CELEBRATION_MS = 2_200;
const CELEBRATION_FRAME_MS = 140;
const MILESTONE_EVERY = 5;
const APPEAR_DEBOUNCE_MS = 400;

type Timer = ReturnType<typeof setTimeout>;

type PadState = {
  action: KeyAction;
  color: string;
};

type Phase = "idle" | "playing" | "awaitingInput" | "strike" | "celebrating";

type DeviceState = {
  pads: Map<string, PadState>;
  sequence: string[];
  phase: Phase;
  inputIndex: number;
  started: boolean;
  appearDebounce: Timer | null;
  playTimers: Timer[];
  celebrationInterval: ReturnType<typeof setInterval> | null;
};

function freshState(): DeviceState {
  return {
    pads: new Map(),
    sequence: [],
    phase: "idle",
    inputIndex: 0,
    started: false,
    appearDebounce: null,
    playTimers: [],
    celebrationInterval: null,
  };
}

class GameEngine {
  private devices = new Map<string, DeviceState>();

  registerPad(deviceId: string, action: KeyAction): void {
    const state = this.getOrCreate(deviceId);
    const color = PALETTE[state.pads.size % PALETTE.length];
    state.pads.set(action.id, { action, color });
    void action.setImage(padIdleFrame(color)).catch((err) =>
      streamDeck.logger.error(`simon-says: setImage(idle) failed for ${action.id}: ${String(err)}`),
    );
    this.scheduleStart(state);
  }

  unregisterPad(deviceId: string, actionId: string): void {
    const state = this.devices.get(deviceId);
    if (!state) return;
    state.pads.delete(actionId);
    if (state.pads.size === 0) {
      if (state.appearDebounce) clearTimeout(state.appearDebounce);
      if (state.celebrationInterval) clearInterval(state.celebrationInterval);
      for (const t of state.playTimers) clearTimeout(t);
      this.devices.delete(deviceId);
    }
  }

  handlePadPress(deviceId: string, action: KeyAction): void {
    const state = this.devices.get(deviceId);
    if (!state || state.phase !== "awaitingInput") return;

    const pad = state.pads.get(action.id);
    if (!pad) return;

    const expectedId = state.sequence[state.inputIndex];
    if (action.id === expectedId) {
      void pad.action.setImage(padLitFrame(pad.color));
      const t = setTimeout(() => void pad.action.setImage(padIdleFrame(pad.color)), PRESS_FEEDBACK_MS);
      state.playTimers.push(t);

      state.inputIndex++;
      if (state.inputIndex >= state.sequence.length) {
        const roundsCompleted = state.sequence.length;
        state.phase = "idle";
        const t2 = setTimeout(() => {
          if (roundsCompleted % MILESTONE_EVERY === 0) {
            this.celebrate(state);
          } else {
            this.nextRound(state);
          }
        }, ROUND_PAUSE_MS);
        state.playTimers.push(t2);
      }
      return;
    }

    state.phase = "strike";
    void pad.action.setImage(padWrongFrame());
    const t = setTimeout(() => {
      void pad.action.setImage(padIdleFrame(pad.color));
      state.sequence = [];
      state.inputIndex = 0;
      this.nextRound(state);
    }, STRIKE_FLASH_MS);
    state.playTimers.push(t);
  }

  private scheduleStart(state: DeviceState): void {
    if (state.appearDebounce) clearTimeout(state.appearDebounce);
    state.appearDebounce = setTimeout(() => {
      state.appearDebounce = null;
      if (!state.started && state.pads.size > 0) {
        state.started = true;
        this.nextRound(state);
      }
    }, APPEAR_DEBOUNCE_MS);
  }

  private nextRound(state: DeviceState): void {
    const ids = [...state.pads.keys()];
    if (ids.length === 0) return;
    const nextId = ids[Math.floor(Math.random() * ids.length)];
    state.sequence.push(nextId);
    this.playSequence(state);
  }

  private playSequence(state: DeviceState): void {
    state.phase = "playing";
    state.inputIndex = 0;

    state.sequence.forEach((id, i) => {
      const onAt = PRE_PLAYBACK_DELAY_MS + i * (LIGHT_ON_MS + LIGHT_GAP_MS);
      const offAt = onAt + LIGHT_ON_MS;
      const tOn = setTimeout(() => {
        const pad = state.pads.get(id);
        if (pad) void pad.action.setImage(padLitFrame(pad.color));
      }, onAt);
      const tOff = setTimeout(() => {
        const pad = state.pads.get(id);
        if (pad) void pad.action.setImage(padIdleFrame(pad.color));
      }, offAt);
      state.playTimers.push(tOn, tOff);
    });

    const totalMs = PRE_PLAYBACK_DELAY_MS + state.sequence.length * (LIGHT_ON_MS + LIGHT_GAP_MS);
    const tReady = setTimeout(() => {
      state.phase = "awaitingInput";
      state.inputIndex = 0;
    }, totalMs);
    state.playTimers.push(tReady);
  }

  private celebrate(state: DeviceState): void {
    state.phase = "celebrating";
    let seed = 0;
    state.celebrationInterval = setInterval(() => {
      seed += 1;
      for (const pad of state.pads.values()) void pad.action.setImage(celebrationFrame(pad.color, seed));
    }, CELEBRATION_FRAME_MS);

    const t = setTimeout(() => {
      if (state.celebrationInterval) clearInterval(state.celebrationInterval);
      state.celebrationInterval = null;
      for (const pad of state.pads.values()) void pad.action.setImage(padIdleFrame(pad.color));
      this.nextRound(state);
    }, CELEBRATION_MS);
    state.playTimers.push(t);
  }

  private getOrCreate(deviceId: string): DeviceState {
    let state = this.devices.get(deviceId);
    if (!state) {
      state = freshState();
      this.devices.set(deviceId, state);
    }
    return state;
  }
}

export const gameEngine = new GameEngine();
