import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The field rolls its Charisma save as it appears, so throwing the coaster is the save; roll it
 * again by hand for a creature that enters the field or starts its turn there. The Wisdom save a
 * creature makes before a hostile act is its own activity.
 */
export default class BartendersArmistice extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Throw Coaster",
      targetType: "creature",
      activationType: "action",
      activationCondition: "Repeat for a creature that enters the field or starts its turn there",
      noConsumeTargets: true,
      removeDamageParts: true,
      data: {
        save: { ability: ["cha"], dc: { calculation: "", formula: "15" } },
        damage: { onSave: "none" },
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "cylinder", size: "30", height: "15" },
        },
        range: { override: true, value: "30", units: "ft" },
        duration: { override: true, value: "10", units: "minute" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Hostile Act Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: false,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["wis"], dc: { calculation: "", formula: "15" } },
          activationOverride: {
            type: "special",
            value: null,
            condition: "Attacks or casts a harmful spell that affects a target in the field or crosses its edge; on a failure the action is wasted",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
          data: { damage: { onSave: "none" } },
        },
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Charmed (Armistice)",
        activityMatch: "Throw Coaster",
        statuses: ["Charmed"],
        options: {
          transfer: false,
          description: "Charmed while it remains in the field, and indifferent to creatures it is hostile toward. Ends if it is attacked, harmed by a spell, or sees a friend harmed.",
        },
      },
    ];
  }

}
