import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Obojima feat: once per long rest, a reaction negates damage up to three times your level. You then
 * save (Constitution, DC 10 or a third of the negated damage) at the end of each turn for a minute,
 * taking the negated damage on a failure; that delayed save is left to the player.
 */
export default class MinorCorruption extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Reduce Damage",
      targetType: "self",
      activationType: "reaction",
      activationCondition: "You take damage",
      addItemConsume: true,
      data: {
        roll: { prompt: false, visible: true, formula: "3 * @details.level", name: "Damage Negated (maximum)" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Minor Corruption: AC",
        options: { transfer: true, disabled: true, description: "+1 bonus to AC while you have less than half of your hit points remaining (toggle when bloodied)." },
        changes: [DDBEnricherData.ChangeHelper.signedAddChange("1", 20, "system.attributes.ac.bonus")],
      },
    ];
  }

}
