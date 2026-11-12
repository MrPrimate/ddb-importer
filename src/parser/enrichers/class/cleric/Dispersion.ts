import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Shadow Domain (World of Warcraft) and the WoW Priest's Shadow Specialization: a 1/SR Reaction to
 * being hit giving Resistance to all damage and a 40 ft Fly Speed until the end of the next turn,
 * with no actions, Bonus Actions or Reactions meanwhile.
 */
export default class Dispersion extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Dispersion",
      activationType: "reaction",
      activationCondition: "You are hit by an attack roll",
      addItemConsume: true,
      targetType: "self",
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        max: "1",
        recovery: [
          { period: "sr", type: "recoverAll", formula: "" },
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Dispersion",
        options: {
          expiry: "sourceEnd",
          description: "You can't take any action, Bonus Action, or Reaction. When the effect ends, you can spend up to half your Hit Point Dice as if you had finished a Short Rest.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("ALL"),
          DDBEnricherData.ChangeHelper.upgradeChange("40", 20, "system.attributes.movement.fly"),
        ],
      },
    ];
  }

}
