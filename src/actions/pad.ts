import { action, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { gameEngine } from "../game/engine.js";

@action({ UUID: "com.homedeck.simonsays.pad" })
export class PadAction extends SingletonAction {
  override onWillAppear(ev: WillAppearEvent): void {
    if (!ev.action.isKey()) return;
    gameEngine.registerPad(ev.action.device.id, ev.action);
  }

  override onWillDisappear(ev: WillDisappearEvent): void {
    gameEngine.unregisterPad(ev.action.device.id, ev.action.id);
  }

  override onKeyDown(ev: KeyDownEvent): void {
    if (!ev.action.isKey()) return;
    gameEngine.handlePadPress(ev.action.device.id, ev.action);
  }
}
