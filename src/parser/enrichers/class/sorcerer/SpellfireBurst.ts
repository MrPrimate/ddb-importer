import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpellfireBurst extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Spellfire Burst: Bolstering Flames", type: "class", rename: ["Bolstering Flames"] } },
      {
        action: { name: "Spellfire Burst: Radiant Fire (Fire)", type: "class", rename: ["Radiant Fire"] },
      },
    ];
  }

  get overrides() {
    return {
      data: {
        flags: {
          ddbimporter: {
            skipScale: true,
          },
        },
        system: {
          uses: {
            max: null,
            spent: null,
            recovery: [],
          },
        },
      },
    };
  }
}
