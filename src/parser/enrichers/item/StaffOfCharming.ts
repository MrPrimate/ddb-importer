import DDBEnricherData from "../data/DDBEnricherData";

export default class StaffOfCharming extends DDBEnricherData {

  get additionalActivities() {
    return [
      {
        init: {
          name: "Auto Save vs Charmspell",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateSave: false,
          generateDamage: false,
          generateConsumption: true,
          consumeActivity: true,
          generateUses: true,
          usesOverride: {
            override: true,
            max: "1",
            spent: 0,
            prompt: true,
            recovery: [{ period: "lr", type: "recoverAll" }],
          },
        },
      },
      {
        init: {
          name: "Reflect Spell",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateSave: true,
          saveOverride: {
            ability: [""],
            dc: {
              calculation: "spellcasting",
              formula: "",
            },
          },
        },
      },
    ];
  }

}
