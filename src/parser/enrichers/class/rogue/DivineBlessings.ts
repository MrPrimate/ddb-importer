import DDBEnricherData from "../../data/DDBEnricherData";

export default class DivineBlessings extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: { name: "Divine Blessing: Armor of the Faithful", type: "class", rename: ["Armor of the Faithful"] },
        overrides: {
          addItemConsume: true,
          itemConsumeValue: "1",
          data: {
            save: {
              ability: ["wis"],
              dc: {
                calculation: "",
                formula: "8 + @abilities.wis.mod + @prof",
              },
            },
          },
        },
      },
      {
        action: { name: "Divine Blessing: Divine Inspiration", type: "class", rename: ["Divine Inspiration"] },
        overrides: {
          addItemConsume: true,
          itemConsumeValue: "1",
        },
      },
      {
        action: { name: "Divine Blessing: Rend the Blasphemous", type: "class", rename: ["Rend the Blasphemous"] },
        overrides: {
          addItemConsume: true,
          itemConsumeValue: "1",
        },
      },
      {
        init: {
          name: "Restore Divine Point",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateConsumption: true,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Kill an Aberration, Beast, Fiend, or Undead of CR 1/2 or higher with your sanctified blade",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
            ],
            scaling: { allowed: false, max: "" },
          },
        },
      },
    ];
  }

}
