import DDBEnricherData from "../data/DDBEnricherData";

export default class FightingStyleInterception extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      data: {
        target: {
          affects: {
            type: "creature",
          },
          template: {},
        },
        roll: {
          prompt: false,
          visible: false,
          formula: "1d10 + @prof",
          name: "Reduce Damage Roll",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        name: "Interception (Automation)",
        // applied to the protected creature. Midi adds traits.dm values to the damage, so the
        // reduction is negative, and ignores dice there, so DAE rolls the inline term when it
        // creates the effect, after resolving @prof from the interceptor
        options: {
          durationSeconds: 6,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("-[[1d10 + @prof]]", 20, "system.traits.dm.midi.mwak"),
          DDBEnricherData.ChangeHelper.overrideChange("-[[1d10 + @prof]]", 20, "system.traits.dm.midi.rwak"),
          DDBEnricherData.ChangeHelper.overrideChange("-[[1d10 + @prof]]", 20, "system.traits.dm.midi.rsak"),
          DDBEnricherData.ChangeHelper.overrideChange("-[[1d10 + @prof]]", 20, "system.traits.dm.midi.msak"),
        ],
        daeSpecialDurations: ["isDamaged"],
      },
    ];
  }
}
