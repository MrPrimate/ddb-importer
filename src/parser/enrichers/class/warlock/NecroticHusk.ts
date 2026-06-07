import DDBEnricherData from "../../data/DDBEnricherData";

export default class NecroticHusk extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Heal 1 HP",
      activationType: "special",
      targetType: "self",
      addItemConsume: true,
      noTemplate: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "1",
          types: ["healing"],
        }),
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save vs Frightened",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateRange: true,
          noSpellslot: true,
        },
        overrides: {
          noConsumeTargets: true,
          activationType: "special",
          noTemplate: true,
          addActivityConsume: true,
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 2,
                  denomination: 10,
                  bonus: "@classes.warlock.levels",
                  types: ["necrotic"],
                }),
              ],
            },
            save: {
              ability: ["con"],
              dc: {
                calculation: "spellcasting",
              },
            },
            range: {
              value: null,
              units: "spec",
            },
            target: {
              affects: {
                type: "enemy",
                choice: true,
              },
              template: {
                count: "",
                contiguous: false,
                type: "radius",
                size: "10",
                width: "",
                height: "",
                units: "ft",
              },
            },
          },
        },
      },
    ];
  }
}
