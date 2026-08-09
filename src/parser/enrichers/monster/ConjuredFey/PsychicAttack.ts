// import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class PsychicAttack extends DDBEnricherData {
  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
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

  override get effects(): IDDBEffectHint[] {
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
