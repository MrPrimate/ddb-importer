import DDBEnricherData from "../data/DDBEnricherData";

export default class CrusadersMantle extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({ effects: "Crusader's Mantle" }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Crusader's Mantle",
        standalone: true,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4[radiant]", 20, "system.rolls.damage.mwak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4[radiant]", 20, "system.rolls.damage.rwak.bonus"),
        ],
        options: {
          durationSeconds: 60,
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
