import AutoEffects from "./AutoEffects.mjs";

export default class MidiEffects {

  static applyDefaultMidiFlags(document) {
    if (AutoEffects.effectModules().midiQolInstalled) {
      foundry.utils.setProperty(document, "flags.midi-qol.removeAttackDamageButtons", "default");
      foundry.utils.setProperty(document, "flags.midiProperties.confirmTargets", "default");
    }
    return document;
  }

  static getMidiCEOnFlags(midiFlags = {}) {
    foundry.utils.setProperty(midiFlags, "forceCEOff", false);
    foundry.utils.setProperty(midiFlags, "forceCEOn", true);
    return midiFlags;
  }

}
