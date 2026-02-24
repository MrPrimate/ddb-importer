// import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class SwarmOfProboscises extends DDBEnricherData {
  get type() {
    return "attack";
  }

  get activity() {
    return {
      targetType: "creature",
      noTemplate: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 10,
              bonus: "@mod",
              types: ["piercing"],
            }),
          ],
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        duplicate: true,
        overrides: {
          data: {
            name: "Bloodied Attack",
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 1,
                  denomination: 10,
                  bonus: "@mod",
                  types: ["piercing"],
                }),
              ],
            },
          },
        },
      },
      {
        init: {
          name: "Grappled Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateTarget: true,
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          activationCondition: "End of the targets turn",
          noTemplate: true,
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 2,
                  denomination: 6,
                  types: ["necrotic"],
                }),
              ],
            },
          },
        },
      },
    ];
  }

  get noVersatile() {
    return true;
  }

}
