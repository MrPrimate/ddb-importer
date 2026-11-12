import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Overchannel follows the official Player's Handbook / SRD activities, a "First Use" utility that rolls
 * nothing and a "Second+ Use" that rolls d12s, 2 on the second use and one more each time after, but its 20
 * uses count UP so the sheet shows how many times it has been used: a long rest drops them to 0, First
 * Use sets the count to 1 whatever it was (it spends value - 1) and Second+ Use adds one. The 2014
 * rules are the same, so both rulesets get this shape. Unlike the official item, Second+ Use asks for
 * the spell's level (1-5) and multiplies the dice by it, since the damage is per spell level and a
 * feature activity cannot see the slot of the spell it was used with.
 *
 * The formula reads the count from BEFORE this use: dnd5e rolls the automatic damage from an item
 * clone taken before consumption, so the count is 1 on the second use (2 dice per level), 2 on the
 * third and so on. The chat card's Damage button reads the live item, so a reroll from it is one d12 per
 * level higher; nothing in the roll data tells the two apart, and the automatic roll is the one used.
 *
 * A "Calculate Maximum Damage" macro activity (macros/generics/maximumDamage.js) rolls the spell's
 * maximum damage, from a recent spell card, a formula or picked dice, bonus and damage type, since
 * Overchannel cannot read the spell.
 */
export default class Overchannel extends DDBEnricherData {

  static MAX_USES = 20;

  get activationCondition(): string {
    return this.is2014
      ? "When you cast a wizard spell of 1st through 5th level that deals damage"
      : "When you cast a Wizard spell with a spell slot of levels 1-5 that deals damage";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "First Use",
      activationType: "special",
      activationCondition: this.activationCondition,
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      itemConsumeValue: "@item.uses.value - 1",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Second+ Use", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDamage: true,
          generateConsumption: false,
          activationOverride: { type: "special", value: 1, condition: this.activationCondition },
          targetOverride: { override: true, affects: { type: "self" } },
          rangeOverride: { units: "self" },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "((1 + @item.uses.value) * @scaling)d12",
              types: ["necrotic"],
              scalingMode: "none",
            }),
          ],
        },
        overrides: {
          addItemConsume: true,
          itemConsumeValue: "-1",
          addConsumptionScalingMax: "5",
        },
      },
      DDBEnricherData.maximumDamageActivity({
        condition: "Roll the spell's damage at its maximum",
        parameters: { title: "Maximum Damage", sources: [{ type: "spell" }] },
      }),
    ];
  }

  override get override(): IDDBOverrideData {
    // DDB tracks at most the 2014 first use, which the First Use activity resets anyway, so a
    // re-import keeps the count already on the document; a new import starts at 0 of 20 used
    return {
      retainUseSpent: true,
      uses: {
        spent: Overchannel.MAX_USES,
        max: `${Overchannel.MAX_USES}`,
        recovery: [{ period: "lr", type: "loseAll", formula: undefined }],
      },
    };
  }

}
