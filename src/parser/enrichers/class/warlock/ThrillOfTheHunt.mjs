/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ThrillOfTheHunt extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Damage bonus",
      noeffect: true,
      activationType: "special",
      activationCondition: "1/turn. Damage someone with your bite attack",
      damageParts: [
        DDBEnricherData.basicDamagePart({
          bonus: "@scale.the-predator.thrill-of-the-hunt",
          types: ["necrotic"],
        }),
      ],
    };
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter.retainOriginalConsumption": true,
        "system.uses": {
          spent: null,
          max: "1",
          recovery: [
            { period: "sr", type: 'recoverAll', formula: undefined },
          ],
        },
      },
    };
  }

}
