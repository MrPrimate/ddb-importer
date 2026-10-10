import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Magus level 15. Magic Resistance comes from DDB's modifier for the chosen damage type (the
 * auto effect stays); Spell Parry gives Advantage on saves against spells and Disadvantage to
 * spell attacks against the magus. Midi cannot scope the save to spells, so its twin is magic
 * resistance, which also covers magical effects.
 */
export default class SorcerousShielding extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Spell Parry",
        options: {
          transfer: true,
          durationSeconds: null,
          expiry: null,
          description: "Advantage on saving throws against spells; spell attacks against you have Disadvantage.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("isSpell", 20, "flags.automated-conditions-5e.save.advantage"),
          DDBEnricherData.ChangeHelper.ac5eChange("isSpell", 20, "flags.automated-conditions-5e.grants.attack.disadvantage"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.magicResistance.all"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.disadvantage.attack.msak"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.disadvantage.attack.rsak"),
        ],
      },
    ];
  }

}
