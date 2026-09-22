import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Lightning Arrow: DDB folds the 4d8 to the target and the 2d8 to creatures within 10 feet into one roll; they are separate saves.
 */
export default class LightningArrow extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Arrow Target",
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({
          number: 4,
          denomination: 8,
          types: ["lightning"],
        }),
      ],
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Nearby Creatures",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Creatures within 10 feet of the target",
          },
          saveOverride: {
            ability: ["dex"],
            dc: { calculation: "spellcasting", formula: "" },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 8,
              types: ["lightning"],
            }),
          ],
          targetOverride: {
            template: { type: "radius", size: "10", units: "ft", count: "" },
            affects: { count: "", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          data: {
            damage: { onSave: "half" },
          },
        },
      },
    ];
  }

}
