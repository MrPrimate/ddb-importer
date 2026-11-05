import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Overchannel counts its uses up rather than down, as the official SRD item does: the long rest
 * empties the 20 uses, each use restores one, and the necrotic damage reads the count after that
 * restore. The first use (count 1) rolls nothing, the second rolls 2d12 per spell level and each
 * later use one more d12 per level. The spell level is picked with the usage scaling (1-5).
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
              customFormula: "(sign(@item.uses.value - 1) * @scaling * @item.uses.value)d12",
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
