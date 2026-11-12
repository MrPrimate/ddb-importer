import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Demonic Veil (World of Warcraft Demon Hunter): a Bonus Action giving the Invisible condition until
 * the end of the next turn, Wis mod uses (minimum one) per Long Rest. DDB sends the uses as the bare
 * Wis mod, which is 0 on a Wisdom 10 character.
 */
export default class DemonicVeil extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Demonic Veil",
      activationType: "bonus",
      addItemConsume: true,
      targetType: "self",
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        max: "max(1, @abilities.wis.mod)",
        recovery: [{ period: "lr", type: "recoverAll", formula: "" }],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Demonic Veil",
        statuses: ["Invisible"],
        options: {
          expiry: "sourceEnd",
        },
      },
    ];
  }

}
