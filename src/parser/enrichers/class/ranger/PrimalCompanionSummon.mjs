/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PrimalCompanionSummon extends DDBEnricherData {

  get activity() {
    return {
      name: "Summon After Long Rest",
      type: "summon",
      activationType: "special",
      activationCondition: "After a Long Rest",
      addActivityConsume: true,
      data: {
        uses: {
          spent: null,
          max: "1",
          override: true,
          recovery: [
            { period: "lr", type: 'recoverAll', formula: undefined },
          ],
        },
        bonuses: {
          ac: "@abilities.wis.mod",
          hd: "@classes.ranger.levels",
          hp: "@classes.ranger.levels * 5",
          attackDamage: "@abilities.wis.mod",
        },
        match: {
          proficiency: true,
          attacks: true,
          saves: false,
        },
      },
    };
  }

}
