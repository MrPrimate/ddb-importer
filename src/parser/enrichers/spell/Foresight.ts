import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Foresight: advantage on attack rolls, ability checks and saving throws, and attackers have
 * disadvantage. The check and save halves use the core roll mode keys; the attack halves need a
 * module, and the description carries them otherwise.
 */
export default class Foresight extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Foresight",
        changes: [
          ...["str", "dex", "con", "int", "wis", "cha"].flatMap((ability) => [
            DDBEnricherData.ChangeHelper.advantageAbilitySaveChange(ability),
            DDBEnricherData.ChangeHelper.advantageAbilityCheckChange(ability),
          ]),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.all"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.disadvantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.advantage"),
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.grants.attack.disadvantage"),
        ],
        options: {
          description: "Advantage on attack rolls, ability checks and saving throws; other creatures have Disadvantage on attack rolls against you; you can't be surprised.",
        },
      },
    ];
  }

}
