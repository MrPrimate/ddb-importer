/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DefileGround extends DDBEnricherData {

  get activity() {
    return {
      name: "Place Template",
    };
  }

  get additionalActivities() {
    return [
      {
        action: {
          name: "Defile Ground: Move Corruption",
          type: "class",
        },
      },
      {
        constructor: {
          name: "Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.blighted.defile-ground.die",
              types: ["necrotic"],
            }),
          ],
        },
        overrides: {
          notemplate: true,
          targetType: "creature",
          activationType: "special",
        },
      },
    ];
  }

}
