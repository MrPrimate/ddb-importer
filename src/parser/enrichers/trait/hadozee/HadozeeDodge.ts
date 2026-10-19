import DDBEnricherData from "../../data/DDBEnricherData";

export default class HadozeeDodge extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    if (!this.isAction) return null;
    // with Midi the linked effect reduces the damage as it is taken, so nothing is healed
    return this.useMidiAutomations
      ? DDBEnricherData.ACTIVITY_TYPES.UTILITY
      : DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      name: "Reduce Damage",
      targetType: "self",
      type: this.useMidiAutomations ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.HEAL,
      // the trait's proficiency-bonus uses are spent by the reaction
      addItemConsume: true,
      data: this.useMidiAutomations
        ? {}
        : {
          healing: DDBEnricherData.basicDamagePart({
            number: 1,
            denomination: 6,
            bonus: "@prof",
            types: ["healing"],
          }),
        },
    };
  }

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        midiOnly: true,
        name: "Hadozee Dodge",
        daeSpecialDurations: ["1Reaction"],
        // Midi adds traits.dm values to the damage and ignores dice there, so the reduction is
        // negative and DAE rolls the inline term when the reaction applies the effect
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-[[1d6 + @prof]]", 20, "system.traits.dm.midi.all"),
        ],
        data: {
          flags: {
            dae: {
              selfTarget: true,
              selfTargetAlways: true,
            },
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      midiDamageReaction: true,
    };
  }

}
