import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Overchannel counts its uses up rather than down: the long rest empties the 20 uses and each use
 * restores one. The first use rolls nothing, the second rolls 2d12 per spell level and each later
 * use one more d12 per level. The spell level is picked with the usage scaling (1-5).
 *
 * The damage formula reads the count from BEFORE this use: dnd5e rolls the automatic damage from
 * an item clone taken before consumption is applied, so @item.uses.value is 0 on the first use, 1
 * on the second and so on. Rolling again from the chat card reads the live item, one use ahead.
 */
export default class Overchannel extends DDBEnricherData {

  static MAX_USES = 20;

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Overchannel",
      activationType: "special",
      activationCondition: this.is2014
        ? "When you cast a wizard spell of 1st through 5th level that deals damage"
        : "When you cast a Wizard spell with a spell slot of levels 1-5 that deals damage",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      itemConsumeValue: "-1",
      addConsumptionScalingMax: "5",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "(sign(@item.uses.value) * @scaling * (@item.uses.value + 1))d12",
              types: ["necrotic"],
            }),
          ],
        },
      },
    };
  }

  // the necrotic damage you take from a second use ignores Resistance and Immunity
  override get effects(): IDDBEffectHint[] {
    const options = { conditions: this.selfActivityFilter() };
    return DDBEnricherData.damageRuleEffect("Overchannel: Unstoppable", [
      ...DDBEnricherData.ChangeHelper.ignoreResistanceChanges("necrotic", options),
      ...DDBEnricherData.ChangeHelper.ignoreImmunityChanges("necrotic", options),
    ]);
  }

  override get override(): IDDBOverrideData {
    // DDB tracks only the 2014 first use (a 1 use action); 2024 is untracked, so a re-import keeps
    // the count already on the document
    const used = this._getSpentValue("class", "Overchannel") ?? 0;
    return {
      retainUseSpent: !this.is2014,
      uses: {
        spent: Overchannel.MAX_USES - used,
        max: `${Overchannel.MAX_USES}`,
        recovery: [{ period: "lr", type: "loseAll", formula: undefined }],
      },
    };
  }

}
