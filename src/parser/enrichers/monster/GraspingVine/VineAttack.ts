// import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class VineAttack extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "bonus",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
        attack: {
          ability: "",
          type: {
            value: "melee",
            classification: "spell",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              types: ["bludgeoning"],
            }),
          ],
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Escape Check",
          type: DDBEnricherData.ACTIVITY_TYPES.CHECK,
        },
        build: {
          generateCheck: true,
          generateTargets: false,
          generateRange: false,
          checkOverride: {
            "associated": [
              "acr",
              "ath",
            ],
            "ability": "",
            "dc": {
              "calculation": "spellcasting",
              "formula": "",
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        noCreate: true,
        data: {
          img: "systems/dnd5e/icons/svg/statuses/grappled.svg",
        },
      },
    ];
  }
}
