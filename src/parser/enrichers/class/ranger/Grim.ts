import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class Grim extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  get activity(): IDDBActivityData {
    return {
      id: "summonGrimComp01",
      name: "Summon As Part of Omen of Doom",
      activationType: "special",
      noConsumeTargets: true,
      data: {
        bonuses: {
          attackDamage: "@abilities.wis.mod + @scale.grim-harbinger.grim-damage[necrotic]",
        },
        summons: {
          "match": {
            "proficiency": true,
            "attacks": true,
            "saves": true,
          },
        },
        effects: [
          {
            "_id": utils.namedIDStub("Ghastly Hound", { prefix: "ef" }),
            "level": {
              "min": 7,
            },
          },
        ],
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        max: "",
        recovery: [],
      },
    };
  }

  get clearAutoEffects() {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ghastly Hound",
        options: {
          transfer: true,
          disabled: false,
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("piercing"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("slashing"),
        ],
        data: {
          "_id": utils.namedIDStub("Ghastly Hound", { prefix: "ef" }),
          flags: {
            ddbimporter: {
              effectIdLevel: {
                min: 7,
                max: null,
              },
            },
          },
          duration: {
            value: null,
            expiry: null,
            expired: null,
          },
        },
      },
    ];
  }

}
