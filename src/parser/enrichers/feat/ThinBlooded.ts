import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Thin-blood Blood Point pool: Kindred Vitae grants Proficiency Bonus minus
 * one points (DDB models this as useProficiencyBonus with a -1 operand the
 * default parser ignores). Points return via feeding, not rests.
 */
export default class ThinBlooded extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: {
            spent: 0,
            max: "@prof - 1",
            recovery: [],
          },
        },
      },
    };
  }

}
