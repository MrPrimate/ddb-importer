import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class Grim extends DDBEnricherData {

  static MOUNTING_DREAD_ID = utils.namedIDStub("Mounting Dread", { prefix: "ef" });

  // Harbinger of Doom (level 7), Mounting Dread: necrotic damage dealt by the grim ignores Resistance
  get mountingDread(): IDDBEffectHint[] {
    return DDBEnricherData.damageRuleEffect(
      "Mounting Dread",
      DDBEnricherData.ChangeHelper.ignoreResistanceChanges("necrotic"),
      { summon: { activities: ["Summon As Part of Omen of Doom"], minLevel: 7 }, id: Grim.MOUNTING_DREAD_ID },
    );
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get activity(): IDDBActivityData {
    return {
      id: "summonGrimComp01",
      name: "Summon As Part of Omen of Doom",
      activationType: "special",
      noConsumeTargets: true,
      data: {
        bonuses: {
          attackDamage: "@abilities.wis.mod + @scale.grim-harbinger.grim-damage[necrotic]",
        },
        "match": {
          "proficiency": true,
          "attacks": true,
          "saves": true,
        },
        effects: [
          // the activity lists its effects, which replaces the automatic links
          ...(this.mountingDread.length > 0
            ? [{ "_id": Grim.MOUNTING_DREAD_ID, "level": { "min": 7, "max": null } }]
            : []),
          {
            "_id": utils.namedIDStub("Ghastly Hound", { prefix: "ef" }),
            "level": {
              "min": 7,
              "max": null,
            },
          },
        ],
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        max: "",
        recovery: [],
      },
    };
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      ...this.mountingDread,
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
