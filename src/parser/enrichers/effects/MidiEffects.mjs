import AutoEffects from "./AutoEffects.mjs";

export default class MidiEffects {

  static applyDefaultMidiFlags(document) {
    if (AutoEffects.effectModules().midiQolInstalled) {
      foundry.utils.setProperty(document, "flags.midi-qol.removeAttackDamageButtons", "default");
      foundry.utils.setProperty(document, "flags.midiProperties.confirmTargets", "default");
    }
    return document;
  }

}
