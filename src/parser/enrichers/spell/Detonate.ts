import DDBEnricherData from "../data/DDBEnricherData";

export default class Detonate extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Seed (Constitution Save)",
      targetType: "creature",
      noTemplate: true,
      data: {
        save: { ability: ["con"], dc: { calculation: "spellcasting", formula: "" } },
        damage: {
          onSave: "half",
          parts: [DDBEnricherData.basicDamagePart({ number: 10, denomination: 10, type: "fire", scalingMode: "none" })],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Explosion (Dexterity Save)",
          noSpellslot: true,
          removeSpellSlotConsume: true,
          activationType: "special",
          activationCondition: "Immediately after the seed's save; excludes the target",
          data: {
            save: { ability: ["dex"], dc: { calculation: "spellcasting", formula: "" } },
            range: { override: true, units: "spec", value: null },
            target: {
              override: true,
              affects: { type: "creature" },
              template: { type: "radius", size: "60", units: "ft" },
            },
          },
        },
      },
    ];
  }

}
