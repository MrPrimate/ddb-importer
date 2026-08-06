import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";

export default class IrrationalRetaliation extends DDBEnricherData<DDBClassFeatureEnricher> {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "A creature deals damage to you",
      addItemConsume: true,
      itemConsumeTargetName: this.ddbEnricher.isParentClass2014 ? "Ki" : "Monk's Focus",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Irrational Retaliation",
        options: {
          durationRounds: 1,
          durationSeconds: 12,
          description: "The Warrior of Pride has Advantage on attack rolls against this creature until the end of their next turn.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("1", 20, "flags.midi-qol.grants.advantage.attack.all"),
        ],
      },
    ];
  }

}
