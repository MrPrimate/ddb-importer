import DDBEnricherData from "../../data/DDBEnricherData";
import _BloodHunter from "./_BloodHunter";

/**
 * Order of the Mutant, 11th level. A rider on Brand of Castigation rather than an action of its
 * own: the brand strips illusions and invisibility, and a branded creature that tries to change
 * its form must save or fail and be stunned.
 *
 * Only the save is rollable; ending existing illusions has no target to apply an effect to.
 */
export default class BrandOfAxiom extends _BloodHunter {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Deny Form Change",
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "A creature branded by your Brand of Castigation attempts to alter its form",
      removeDamageParts: true,
      data: {
        save: {
          ability: ["wis"],
          dc: this.hemocraftSaveDC,
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Denied Form Change",
        options: {
          durationSeconds: 6,
          durationRounds: 1,
          description: "The attempt fails and the creature is stunned until the end of your next turn.",
        },
        daeSpecialDurations: ["turnEndSource"],
        statuses: ["Stunned"],
      },
    ];
  }

}
