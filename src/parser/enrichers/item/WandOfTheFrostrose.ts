import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The parser's save is a sculpture exploding, which happens when one is destroyed and costs no
 * charge, so it is reshaped into that 20-foot blast. Creating the sculptures spends up to 3
 * charges for one each, and the space each one occupies is icy difficult terrain for 1 minute, so
 * the template count follows the charges.
 */
export default class WandOfTheFrostrose extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Sculpture Explosion",
      targetType: "creature",
      activationType: "special",
      activationCondition: "A sculpture drops to 0 Hit Points; +1d8 Piercing for each further explosion that catches the creature",
      noConsumeTargets: true,
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 3, denomination: 8, types: ["piercing"] }),
        DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["cold"] }),
      ],
      data: {
        save: { ability: ["dex"], dc: { calculation: "", formula: "15" } },
        damage: { onSave: "half" },
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, type: "sphere", size: "20", units: "ft" },
        },
        range: { override: true, value: null, units: "spec", special: "Centered on the sculpture" },
        duration: { override: true, value: "", units: "inst" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Create Ice Sculptures", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateSave: false,
          generateDamage: false,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateConsumption: false,
          activationOverride: {
            type: "action",
            value: null,
            condition: "Each sculpture is a Medium object with AC 12 and 1 Hit Point; its space is difficult terrain",
          },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: { contiguous: false, units: "ft", type: "square", size: "5", count: "@scaling" },
          },
          rangeOverride: { override: true, value: "60", units: "ft" },
          durationOverride: { override: true, value: "1", units: "minute" },
        },
        overrides: {
          addItemConsume: true,
          addScalingMode: "amount",
          addConsumptionScalingMax: "min(3, @item.uses.value)",
          noeffect: true,
        },
      },
    ];
  }

}
