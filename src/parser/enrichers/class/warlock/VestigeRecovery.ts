import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Vestige Patron (AU 2024) level 10: when the vestige would drop to 0 HP, a reaction and a pact
 * slot set it to its maximum (4 + 4 per warlock level, the companion stat block's formula) and
 * teleport it up to 30 feet; once per long rest.
 */
export default class VestigeRecovery extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Vestige Recovery",
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "When your Vestige Companion would drop to 0 HP: its HP becomes its maximum",
      addItemConsume: true,
      noTemplate: true,
      additionalConsumptionTargets: [
        {
          type: "attribute",
          value: "1",
          target: "spells.pact.value",
        },
      ],
      data: {
        range: { value: "30", units: "ft" },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "4 + 4 * @classes.warlock.levels",
          types: ["healing"],
          scalingMode: "none",
        }),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Teleport Vestige",
          type: DDBEnricherData.ACTIVITY_TYPES.TELEPORT,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateRange: true,
          generateTarget: true,
          activationOverride: { type: "none", value: null, condition: "After Vestige Recovery: to an unoccupied space you can see within 30 feet of the vestige" },
          rangeOverride: { value: "30", units: "ft", special: "" },
          targetOverride: {
            prompt: false,
            affects: { count: "1", type: "creature" },
            template: {},
          },
        },
        overrides: {
          noConsumeTargets: true,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      retainUseSpent: true,
      uses: {
        spent: null,
        max: "1",
        recovery: [{ period: "lr", type: "recoverAll" }],
      },
    };
  }

}
