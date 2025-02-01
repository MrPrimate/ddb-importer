/* eslint-disable class-methods-use-this */
// import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PsychicAttack extends DDBEnricherData {
  get type() {
    return "attack";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "bonus",
      data: {
        range: {
          units: "ft",
          value: "5",
        },
        attack: {
          ability: "",
          type: {
            value: "ranged",
            classification: "spell",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 3,
              denomination: 12,
              types: ["psychic"],
            }),
          ],
        },
      },
    };
  }

  get effects() {
    return [
      {
        noCreate: true,
        data: {
          img: "systems/dnd5e/icons/svg/statuses/frightened.svg",
        },
      },
    ];
  }
}
