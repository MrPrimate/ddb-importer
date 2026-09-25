import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Shared shape for the Misfortune Bringer rogue's Misfortunes. Each chosen option arrives as a
 * "Misfortunes: Curse of the X" choice feature that spends from the Jinx Points pool document;
 * per-curse enrichers extend this and add their activation, save, damage and effects.
 */
export default class Misfortune extends DDBEnricherData {

  static POOL = "Jinx Points";

  static SAVE_DC = "8 + max(@abilities.cha.mod, @abilities.int.mod) + @prof";

  /** Rules-text cost, used when the parsed name carried no "(N Points)" suffix. */
  get jinxCost(): number {
    return 1;
  }

  /**
   * DDBChoiceFeature strips "(N Points)" from the option name into resourceCharges; that only
   * happens on the choice build path, so compendium and non-choice builds fall back to jinxCost.
   */
  get jinxCostValue(): string {
    return String(this.ddbParser.resourceCharges ?? this.jinxCost);
  }

  /** The option name without the container prefix, e.g. "Curse of the Unlucky". */
  get curseName(): string {
    return (this.ddbParser.originalName ?? this.name).replace(/^Misfortunes:\s*/, "");
  }

  get consumption(): Pick<IDDBActivityData, "addItemConsume" | "itemConsumeTargetName" | "itemConsumeValue"> {
    return {
      addItemConsume: true,
      itemConsumeTargetName: Misfortune.POOL,
      itemConsumeValue: this.jinxCostValue,
    };
  }

  /** Wisdom save against the Misfortunist DC (8 + Cha or Int modifier + proficiency). */
  get wisdomSave(): IDDBActivityData["data"] {
    return {
      save: {
        ability: ["wis"],
        dc: {
          calculation: "",
          formula: Misfortune.SAVE_DC,
        },
      },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: this.curseName,
      targetType: "creature",
      ...this.consumption,
    };
  }

  override get override(): IDDBOverrideData {
    // the pool lives on the Jinx Points document; the curse document must not carry uses of its own
    return {
      data: {
        system: {
          uses: { spent: null, max: "", recovery: [] },
        },
      },
    };
  }

}
