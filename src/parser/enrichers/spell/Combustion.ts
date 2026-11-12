import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Mage): self flames for 1 minute: Fire immunity, light, Advantage on spell attacks; the turn-end damage is the parsed activity.
 */
export default class Combustion extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Combustion",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageImmunityChange("fire"),
          DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "token.light.dim"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.msak"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.rsak"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("actionType.msak || actionType.rsak", 20, "flags.automated-conditions-5e.attack.advantage"),
        ],
      },
    ];
  }

}
