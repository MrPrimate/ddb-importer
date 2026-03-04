import DDBEnricherData from "../data/DDBEnricherData";

export default class DonjonsSunderingSphere extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  get effects() {
    return [
      {
        type: "enchant",
        magicalBonus: {
          bonus: "1",
        },
      },
    ];
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Isolating Smite: Save vs Banishment",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateTarget: false,
          generateRange: false,
          generateSave: true,
          generateUses: true,
          usesOverride: {
            max: "1",
            spent: 0,
            prompt: true,
            recovery: [{ period: "lr", type: "recoverAll" }],
          },
        },
        overrides: {
          addActivityConsume: true,
        },
      },
    ];
  }

}
