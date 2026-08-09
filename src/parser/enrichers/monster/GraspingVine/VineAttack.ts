// import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class VineAttack extends DDBEnricherData {
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

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Escape Check",
          type: DDBEnricherData.ACTIVITY_TYPES.CHECK,
        },
        build: {
          generateCheck: true,
          generateTarget: false,
          generateRange: false,
          checkOverride: {
            "associated": [
              "acr",
              "ath",
            ],
            "ability": [],
            "dc": {
              "calculation": "spellcasting",
              "formula": "",
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
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
