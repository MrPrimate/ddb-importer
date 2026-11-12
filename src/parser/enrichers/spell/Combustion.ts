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
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "20"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "30"),
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
