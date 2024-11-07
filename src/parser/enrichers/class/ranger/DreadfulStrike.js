/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class DreadfulStrike extends DDBEnricherMixin {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Once per turn",
      data: {
        damage: {
          parts: [DDBEnricherMixin.basicDamagePart({ number: 2, denomination: 6, types: ["psychic"] })],
        },
        uses: {
          override: true,
          spent: 0,
          max: "max(1, @abilities.wis.mod)",
          recovery: [
            { period: "lr", type: 'recoverAll', formula: undefined },
          ],
        },
      },
    };
  }

}
