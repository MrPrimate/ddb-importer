import DDBEnricherData from "../../data/DDBEnricherData";
import MysticMark from "./MysticMark";

/**
 * Heaven's Guard level 3. Best Offense adds 2 to weapon and Unarmed Strike damage while a Shield
 * is equipped (dnd5e's shield AC bonus in the roll data gates it). Gifted Healer spends and rolls a
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
        options: {
          transfer: true,
          durationSeconds: null,
          expiry: null,
          description: "While you are using a Shield, +2 to damage rolls with weapons and Unarmed Strikes.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleBonusChange("damage", "2", {
            conditions: [
              MysticMark.WEAPON_OR_UNARMED_FILTER(),
              { k: "attributes.ac.shield", o: "gte", v: 1 },
            ],
          }),
        ],
      },
    ];
  }

}
