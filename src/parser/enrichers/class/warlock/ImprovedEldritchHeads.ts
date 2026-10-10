import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The Many: spend an eldritch head (Eldritch Heads' uses) for 2d6 + Charisma Temporary Hit Points as a
 * Bonus Action, for an extra Reaction once per turn, or to reroll a failed save against being charmed,
 * frightened or magically put to sleep.
 */
export default class ImprovedEldritchHeads extends DDBEnricherData {

  static spend(name: string, condition: string): IDDBAdditionalActivity {
    return {
      init: { name, type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
      build: {
        generateConsumption: true,
        generateTarget: true,
        generateActivation: true,
        activationOverride: { type: "special", value: 1, condition },
      },
      overrides: { targetSelf: true, addItemConsume: true, itemConsumeTargetName: "eldritch-heads" },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Reabsorb Head",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "eldritch-heads",
      data: {
        healing: DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, bonus: "@abilities.cha.mod", types: ["temphp"] }),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ImprovedEldritchHeads.spend("Extra Reaction", "Once per turn, on a turn you haven't taken your normal Reaction"),
      ImprovedEldritchHeads.spend("Reroll Save", "You fail a save against being charmed, frightened or put to sleep by magic"),
    ];
  }

}
