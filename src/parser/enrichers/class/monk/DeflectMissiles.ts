import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";

export default class DeflectMissiles extends DDBEnricherData<DDBClassFeatureEnricher> {

  override get type(): IDDBActivityType | null {
    // with Midi the linked effect reduces the damage as it is taken, so nothing is healed
    return this.useMidiAutomations
      ? DDBEnricherData.ACTIVITY_TYPES.UTILITY
      : DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Reduce Damage",
      targetType: "self",
      type: this.useMidiAutomations ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.HEAL,
      noConsumeTargets: true,
      midiUseCondition: `reaction == 'isDamaged' && workflow.activity?.actionType == 'rwak'`,
      data: this.useMidiAutomations
        ? {}
        : {
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
          itemConsumeTargetName: this.ddbEnricher.isClass2014("Monk") ? "Ki" : "Monk's Focus",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        name: "Deflect Missiles (Automation)",
        activityMatch: "Reduce Damage",
        // Midi adds traits.dm values to the damage and ignores dice there, so the reduction is
        // negative and DAE rolls the inline term when the reaction applies the effect
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(
            "-[[1d10 + @abilities.dex.mod + @classes.monk.levels]]",
            20,
            "system.traits.dm.midi.rwak",
          ),
        ],
        // a reduction that absorbs the whole hit does not count as being damaged
        daeSpecialDurations: ["isDamaged", "1Reaction"],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: ["Reduce Damage"],
    };
  }

}
