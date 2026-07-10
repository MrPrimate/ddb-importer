import AutoEffects from "./AutoEffects";

export default class MidiEffects {

  static applyDefaultMidiFlags<T extends TAll5eItemDocuments>(document: T): T {
    if (AutoEffects.effectModules().midiQolInstalled) {
      foundry.utils.setProperty(document, "flags.midi-qol.removeAttackDamageButtons", "default");
      foundry.utils.setProperty(document, "flags.midiProperties.confirmTargets", "default");
    }
    return document;
  }

  static getMidiCEOnFlags(midiFlags: any = {}): any {
    foundry.utils.setProperty(midiFlags, "forceCEOff", false);
    foundry.utils.setProperty(midiFlags, "forceCEOn", true);
    return midiFlags;
  }

}
