import DDBEnricherData from "../../data/DDBEnricherData";

export default class UniversalSpeech extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Universal Speech",
      activationType: "action",
      targetType: "creature",
      targetCount: "max(1, @abilities.cha.mod)",
      rangeType: "ft",
      rangeValue: 60,
      addItemConsume: true,
      data: {
        duration: {
          value: "1",
          units: "hour",
        },
      },
    };
  }

  // the feature can be reused before a long rest by spending a spell slot of any level
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Universal Speech (Spell Slot)",
          noConsumeTargets: true,
          addSpellSlotConsume: true,
          spellSlotConsumeTarget: "1",
          addSpellSlotScalingMode: "",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Universal Speech",
        options: {
          durationSeconds: 3600,
          description: "You and the caster can understand each other, regardless of language.",
        },
      },
    ];
  }

}
