import DDBEnricherData from "../data/DDBEnricherData";
import RandomTableItem from "./_RandomTableItem";

/**
 * A rod that doubles as a magical club swung with Charisma. Each hit rolls a d100, and only a
 * result of 10 or less goes on to the d10 table, so the two rolls stay separate. Read as prose,
 * the item became a save scraped from one table row and no attack at all.
 */
export default class MarotteOfChance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Club Attack",
      targetType: "creature",
      targetCount: 1,
      activationType: "action",
      activationCondition: "On a hit, roll Something Odd",
      noConsumeTargets: true,
      noTemplate: true,
      noeffect: true,
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, bonus: "@mod", types: ["bludgeoning"] }),
      ],
      data: {
        attack: { ability: "cha", type: { value: "melee", classification: "weapon" } },
        damage: { includeBase: false },
        range: { override: true, value: "5", units: "ft" },
        duration: { override: true, value: "", units: "inst" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      RandomTableItem.tableRoll(
        "Something Odd",
        "1d100",
        "Each time you hit with the marotte; on 10 or less roll on the Chance Table",
      ),
      RandomTableItem.tableRoll(
        "Chance Table",
        "1d10",
        "When Something Odd comes up 10 or less; resolve the result using the table in the description",
      ),
    ];
  }

}
