import DDBEnricherData from "../../data/DDBEnricherData";

export default class RighteousArmament extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: { name: "Righteous Armament: Chains of Judgement", type: "class", rename: ["Chains of Judgement"] },
        overrides: {
          addItemConsume: true,
          itemConsumeTargetName: "Divine Blessings",
          itemConsumeValue: "1",
          data: {
            save: {
              ability: ["str"],
              dc: {
                calculation: "",
                formula: "8 + @abilities.wis.mod + @prof",
              },
            },
            damage: {
              onSave: "none",
              parts: [
                DDBEnricherData.basicDamagePart({ customFormula: "@abilities.wis.mod", types: ["radiant"] }),
              ],
            },
          },
        },
      },
      {
        // DDB data typo: "Retailiation"
        action: { name: "Righteous Armament: Divine Retailiation", type: "class", rename: ["Divine Retaliation"] },
        overrides: {
          addItemConsume: true,
          itemConsumeTargetName: "Divine Blessings",
          itemConsumeValue: "1",
        },
      },
      {
        action: { name: "Righteous Armament: Erupting Blades", type: "class", rename: ["Erupting Blades"] },
        overrides: {
          addItemConsume: true,
          itemConsumeTargetName: "Divine Blessings",
          itemConsumeValue: "2",
          data: {
            save: {
              ability: ["dex"],
              dc: {
                calculation: "",
                formula: "8 + @abilities.wis.mod + @prof",
              },
            },
            damage: {
              onSave: "half",
              parts: [
                DDBEnricherData.basicDamagePart({ customFormula: "@scale.rogue.sneak-attack", types: ["radiant"] }),
              ],
            },
            target: {
              template: {
                count: "",
                contiguous: false,
                type: "line",
                size: "45",
                width: "5",
                height: "",
                units: "ft",
              },
            },
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Restrained by Chains of Judgement",
        activityMatch: "Chains of Judgement",
        statuses: ["Restrained"],
        options: {
          durationSeconds: 6,
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
    };
  }

}
