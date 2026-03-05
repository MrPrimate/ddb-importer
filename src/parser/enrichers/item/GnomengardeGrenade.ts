import DDBEnricherData from "../data/DDBEnricherData";

export default class GnomengardeGrenade extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      noeffect: true,
      data: {
        name: "Fire Damage",
        damage: {
          onSave: "half",
          parts: [DDBEnricherData.basicDamagePart({ number: 8, denomination: 6, type: "fire" })],
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [{
      options: {
        transfer: false,
      },
      statuses: ["Stunned"],
    }];
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Thunder Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: true,
          onSave: "half",
          damageParts: [DDBEnricherData.basicDamagePart({ number: 8, denomination: 6, type: "thunder" })],
        },
      },
    ];
  }

}
