import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";

export default class DeflectMissiles extends DDBEnricherData<DDBClassFeatureEnricher> {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Reduce Damage",
      targetType: "self",
      type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
      noConsumeTargets: true,
      data: {
        // roll: {
        //   prompt: false,
        //   visible: false,
        //   formula: "1d10 + @abilities.dex.mod + @classes.monk.levels",
        //   name: "Reduce Damage Amount",
        // },
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 10,
          bonus: "@abilities.dex.mod + @classes.monk.levels",
          types: ["healing"],
        }),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: { name: "Deflect Missiles Attack", type: "class", rename: ["Deflect Missiles Attack"] },
        overrides: {
          addItemConsume: true,
          itemConsumeTargetName: this.ddbEnricher.isParentClass2014 ? "Ki" : "Monk's Focus",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        name: "Deflect Missiles (Automation)",
        options: {
          transfer: true,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(
            "[[1d10 + @abilities.dex.mod + @classes.monk.levels]]",
            20,
            "system.traits.dm.midi.rwak",
          ),
        ],
        daeSpecialDurations: ["isDamaged" as const],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      midiDamageReaction: true,
      ignoredConsumptionActivities: ["Reduce Damage"],
    };
  }

}
