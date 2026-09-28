import DDBEnricherData from "../data/DDBEnricherData";

export default class GnomengardeGrenade extends DDBEnricherData {

  override get activity(): IDDBActivityData {
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

  override get effects(): IDDBEffectHint[] {
    return [{
      activityMatch: "Thunder Damage",
      options: {
        transfer: false,
      },
      statuses: ["Stunned"],
    }];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Thunder Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          // the thunder grenade calls for a Constitution save, the fire one Dexterity
          saveOverride: { ability: ["con"], dc: { calculation: "", formula: "15" } },
          generateDamage: true,
          onSave: "half",
          damageParts: [DDBEnricherData.basicDamagePart({ number: 8, denomination: 6, type: "thunder" })],
        },
      },
    ];
  }

}
