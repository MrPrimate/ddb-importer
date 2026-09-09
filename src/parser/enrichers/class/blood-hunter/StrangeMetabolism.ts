import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Order of the Mutant, 7th level. Permanent immunity to poison, plus a once per long rest
 * adrenaline burst that suppresses one mutagen's side effect for a minute.
 *
 * Which side effect is suppressed is the player's choice at the table, so the burst is a bare
 * activity; only the immunities are effects.
 */
export default class StrangeMetabolism extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Adrenaline Burst",
      targetType: "self",
      rangeSelf: true,
      activationType: "bonus",
      noTemplate: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Strange Metabolism",
        options: {
          transfer: true,
          description: "Immunity to poison damage and the poisoned condition.",
        },
        // the immunities are always on, they must not attach to the Adrenaline Burst activity
        activitiesMatch: ["Not real"],
        changes: [
          DDBEnricherData.ChangeHelper.damageImmunityChange("poison"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("poisoned"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Strange Metabolism",
        max: "1",
        period: "lr",
      }),
    };
  }

}
