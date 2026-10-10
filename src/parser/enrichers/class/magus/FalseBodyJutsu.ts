import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Shadow Court level 14. When hit, a Reaction drops the attack's damage to 1, then the magus
 * teleports up to 300 feet and is Invisible for 1 minute; once per Long Rest.
 */
export default class FalseBodyJutsu extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "False Body Jutsu",
      activationType: "reaction",
      activationCondition: "You are hit by an attack; reduce its damage to 1 and teleport up to 300 feet to an unoccupied space",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      data: {
        duration: { value: "1", units: "minute" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "False Body Jutsu",
        statuses: ["invisible"],
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "False Body Jutsu",
        max: "1",
        period: "lr",
      }),
    };
  }

}
