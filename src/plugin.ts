import streamDeck from "@elgato/streamdeck";
import { PadAction } from "./actions/pad.js";

streamDeck.logger.setLevel("info");

streamDeck.actions.registerAction(new PadAction());

streamDeck.connect();
