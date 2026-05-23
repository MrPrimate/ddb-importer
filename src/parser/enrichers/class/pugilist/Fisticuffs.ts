import DDBEnricherData from "../../data/DDBEnricherData";

export default class Fisticuffs extends DDBEnricherData {

  get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Attack",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Fisticuffs Enchantment",
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
        },
        build: {
          generateActivation: true,
          generateDamage: false,
        },
        overrides: {
          data: {
            restrictions: {
              type: "weapon",
              allowMagical: true,
              categories: ["simpleM", "natural", "improv"],
            },
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Fisticuffs",
        activityMatch: "Fisticuffs Enchantment",
        type: "enchant",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Fisticuffs]`, 10, "name"),
          DDBEnricherData.ChangeHelper.overrideChange("true", 10, "system.damage.base.custom.enabled"),
          DDBEnricherData.ChangeHelper.overrideChange("@scale.pugilist.fisticuffs + @mod", 10, "system.damage.base.custom.formula"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("sap", 10, "system.traits.weaponProf.mastery.bonus"),
        ],
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          type: {
            value: "simpleM",
          },
          damage: {
            base: DDBEnricherData.basicDamagePart({
              customFormula: "@scale.pugilist.fisticuffs + @mod",
            }),
          },
        },
      },
    };
  }

}
