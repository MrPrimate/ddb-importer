import DDBEnricherData from "../data/DDBEnricherData";

export default class PassWithoutTrace extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({ effects: "Pass without Trace" }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Pass without Trace",
        standalone: true,
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("10", 20, "system.skills.ste.roll.bonus"),
        ],
        options: {
          durationSeconds: 3600,
        },
      },
    ];
  }


  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          target: {
            affects: {
              type: "ally",
            },
          },
        },
      },
    };
  }

}
