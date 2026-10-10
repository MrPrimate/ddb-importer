import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Heaven's Guard level 3. Best Offense adds 2 to weapon and Unarmed Strike damage while a Shield
 * is equipped; dnd5e 5.x has no rule conditions, so only AC5e applies it (the shield AC bonus in
 * the roll data gates it). Gifted Healer spends and rolls a
 * Hit Die to add to healing from a spell or Magus feature, one activity per die size. Heaven's
 * Hand (Radiant damage swap) is text only.
 */
export default class Heavensent extends DDBEnricherData {

  static giftedHealer(size: "smallest" | "largest"): IDDBActivityData {
    return {
      activationType: "special",
      activationCondition: "You cause a creature to regain Hit Points with a spell or Magus feature; add the roll to the total",
      targetType: "creature",
      targetCount: 1,
      noConsumeTargets: true,
      additionalConsumptionTargets: [
        { type: "hitDice", target: size, value: "1", scaling: { mode: "", formula: "" } },
      ],
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@consumed.hd",
          types: ["healing"],
          scalingMode: "none",
        }),
      },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Gifted Healer (Smallest Hit Die)",
      ...Heavensent.giftedHealer("smallest"),
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Gifted Healer (Largest Hit Die)",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          generateHealing: true,
        },
        overrides: Heavensent.giftedHealer("largest"),
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Best Offense",
        ac5eOnly: true,
        options: {
          transfer: true,
          durationSeconds: null,
          expiry: null,
          description: "While you are using a Shield, +2 to damage rolls with weapons and Unarmed Strikes.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=2; itemType === 'weapon' && rollingActor.attributes.ac.shield > 0",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
