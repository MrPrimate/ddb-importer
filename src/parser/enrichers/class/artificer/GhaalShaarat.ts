import DDBEnricherData from "../../data/DDBEnricherData";

export default class GhaalShaarat extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        restrictions: {
          type: "weapon",
          allowMagical: true,
        },
      },
    };
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        type: "enchant",
        magicalBonus: {
          makeMagical: true,
          bonus: "@scale.forge-adept.ghaalshaarat",
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Ghaal'Shaarat]`, 20, "name"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("thr", 20, "system.properties"),
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.range.value"),
          DDBEnricherData.ChangeHelper.upgradeChange("120", 20, "system.range.long"),
        ],
        data: {
          flags: {
            ddbimporter: {
              effectIdLevel: {
                min: null,
                max: 14,
              },
            },
          },
        },
      },
      {
        name: "Soul Bound",
        changes: [
          DDBEnricherData.ChangeHelper.conditionImmunityChange("charmed"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("frightened"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("psychic", 20, "system.traits.dr.value"),
        ],
        activitiesMatch: ["Not real"],
        options: {
          transfer: true,
        },
        data: {
          _id: "ddbSoulBound1234",
        },
      },
      {
        type: "enchant",
        magicalBonus: {
          makeMagical: true,
          bonus: "@scale.forge-adept.ghaalshaarat",
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Ghaal'Shaarat]`, 20, "name"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("thr", 20, "system.properties"),
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.range.value"),
          DDBEnricherData.ChangeHelper.upgradeChange("120", 20, "system.range.long"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(`[["1d6", ""]]`, 20, "system.damage.parts"),
          DDBEnricherData.ChangeHelper.addChange("acid", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.addChange("cold", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.addChange("fire", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.addChange("lightning", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.addChange("thunder", 20, "system.damage.base.types"),
        ],
        data: {
          flags: {
            ddbimporter: {
              effectIdLevel: {
                min: 15,
                max: null,
              },
              effectRiders: ["ddbSoulBound1234"],
            },
          },
        },
      },
    ];
  }

}
