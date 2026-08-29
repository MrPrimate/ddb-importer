import DDBEnricherData from "../data/DDBEnricherData";

export default class Haste extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    // when the spell ends the target suffers a wave of lethargy; a separate
    // non-consuming utility applies it (dnd5e spells24 "Apply Lethargy" shape)
    return [
      {
        init: {
          name: "Apply Lethargy",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            condition: "When the spell ends",
          },
          targetOverride: {
            affects: {
              count: "1",
              type: "creature",
            },
          },
        },
        overrides: {
          noTemplate: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        activityMatch: "Cast",
        data: {
          duration: {
            value: 60,
            units: "seconds",
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.movementMultiplierChange("2", 30),
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("dex"),
        ],
        daeSpecialDurations: [],
      },
      {
        name: "Lethargy",
        activityMatch: "Apply Lethargy",
        statuses: ["Incapacitated"],
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 20),
        ],
        daeSpecialDurations: ["turnEnd"],
      },
    ];
  }

}
