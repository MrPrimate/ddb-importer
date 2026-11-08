import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Valorous Rebuke (Valkyrie, D&D Beyond Drops November 2026): a 3/Day Reaction making one
 * Longsword attack that deals an extra 4d6 Radiant on a hit. The text only names the Longsword, so
 * the parser built a bare 4d6 damage roll; the attack here is the Longsword's (+9 from Strength,
 * 2d8 + 5 Piercing plus 1d8 Radiant) with the extra dice added.
 */
export default class ValorousRebuke extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Longsword Rebuke",
      activationType: "reaction",
      activationCondition: "A creature the valkyrie can see moves within 5 feet of it",
      targetType: "creature",
      addItemConsume: true,
      data: {
        range: {
          value: 5,
          units: "ft",
        },
        attack: {
          ability: "str",
          type: {
            value: "melee",
            classification: "weapon",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, bonus: "@mod", types: ["piercing"] }),
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["radiant"] }),
            DDBEnricherData.basicDamagePart({ number: 4, denomination: 6, types: ["radiant"] }),
          ],
        },
      },
    };
  }

}
