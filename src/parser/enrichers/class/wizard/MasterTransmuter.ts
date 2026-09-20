import Generic from "../Generic";

/**
 * Transmuter (AU 2024 and 2014 School of Transmutation): the DDB action that consumes the stone
 * is kept, with the Restore Life option as a Raise Dead cast and the level 7+ slot that keeps
 * the stone from crumbling as slot bookkeeping. Panacea heals half the target's maximum, which
 * an activity formula cannot read, so it and the other options stay described on the feature.
 * Extends Generic so the DDB action matching still builds the consume activity.
 */
export default class MasterTransmuter extends Generic {

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    // the 2014 DDB action shares the feature's name, so the enricher also runs on the action
    // copy; the extra activities must only be added once, on the feature
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Restore Life (Raise Dead)",
          type: Generic.ACTIVITY_TYPES.CAST,
        },
        build: {
          generateCast: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: false,
          activationOverride: { type: "action", value: 1, condition: "Consume the Transmuter's Stone; no spell slot or material components" },
        },
        overrides: {
          addSpellUuid: "Raise Dead",
          noSpellslot: true,
          noConsumeTargets: true,
        },
      },
      {
        init: {
          name: "Preserve Stone (Level 7+ Slot)",
          type: Generic.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          activationOverride: { type: "none", value: null, condition: "Expend a level 7+ spell slot as part of the Magic action to keep the stone" },
        },
        overrides: {
          targetType: "self",
          noConsumeTargets: true,
          addConsumptionScalingMax: "9",
          additionalConsumptionTargets: [
            { type: "spellSlots", value: "1", target: "7", scaling: { mode: "level", formula: "" } },
          ],
        },
      },
    ];
  }

}
