import DDBEnricherData from "../data/DDBEnricherData";
import RandomTableItem from "./_RandomTableItem";

/**
 * A thrown card is a Dexterity-based ranged spell attack; the suit drawn adds one row of the
 * table. Read as prose, the item became a save scraped from a single suit and no attack at all.
 */
export default class DeckOfWildCards extends DDBEnricherData {

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
      name: "Throw Card",
      targetType: "creature",
      targetCount: 1,
      activationType: "action",
      activationCondition: "On a hit, roll the suit and resolve it using the table in the description",
      noConsumeTargets: true,
      noTemplate: true,
      noeffect: true,
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["slashing"] }),
      ],
      data: {
        attack: { ability: "dex", type: { value: "ranged", classification: "spell" } },
        damage: { includeBase: false },
        range: { override: true, value: "30", units: "ft" },
        duration: { override: true, value: "", units: "inst" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      RandomTableItem.tableRoll(
        "Suit",
        "1d4",
        "When a thrown card hits; resolve the suit using the table in the description",
      ),
    ];
  }

}
