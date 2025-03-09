/* eslint-disable class-methods-use-this */
import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DefensiveFlourish extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Defensive Flourish: Damage and AC Bonus",
      targetType: "creature",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.bard.bardic-inspiration",
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }

  get effects() {
    return utils.arrayRange(12, 1, 1).map((i) => ({
      name: `Defensive Flourish: AC Bonus ${i}`,
      options: {
        transfer: false,
      },
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange(i, 20, "system.attributes.ac.bonus"),
      ],
    }));
  }

}
