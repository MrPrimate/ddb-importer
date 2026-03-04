import Generic from "../Generic";

export default class Fisticuffs extends Generic {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Fisticuffs Enchantment",
          type: Generic.ACTIVITY_TYPES.ENCHANT,
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

  get effects() {
    return [
      {
        name: "Fisticuffs",
        activityMatch: "Fisticuffs Enchantment",
        type: "enchant",
        changes: [
          Generic.ChangeHelper.overrideChange(`{} [Fisticuffs]`, 10, "name"),
          Generic.ChangeHelper.overrideChange("true", 10, "system.damage.base.custom.enabled"),
          Generic.ChangeHelper.overrideChange("@scale.pugilist.fisticuffs + @mod", 10, "system.damage.base.custom.formula"),
          Generic.ChangeHelper.unsignedAddChange("sap", 10, "system.traits.weaponProf.mastery.bonus"),
        ],
      },
    ];
  }

  get addToDefaultAdditionalActivities() {
    return true;
  }

}
