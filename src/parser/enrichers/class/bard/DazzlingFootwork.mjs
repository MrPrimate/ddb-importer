/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DazzlingFootwork extends DDBEnricherData {

  get type() {
    return "enchant";
  }

  get activity() {
    return {
      targetType: "self",
      data: {
        name: "Bardic Damage",
        restrictions: {
          type: "weapon",
          allowMagical: true,
        },
      },
    };
  }

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("unarmoredBard", 10, "system.attributes.ac.calc"),
        ],
        data: {
          "flags.ddbimporter.activityMatch": "No Activity",
        },
      },
      {
        type: "enchant",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Dazzling Footwork]`, 20, "name"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("bludgeoning", 20, "system.damage.base.types"),
          DDBEnricherData.ChangeHelper.overrideChange("dex", 20, "system.ability"),
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "system.damage.base.custom.enabled"),
          DDBEnricherData.ChangeHelper.overrideChange("@scale.dance.dazzling-footwork + @abilities.dex.mod", 20, "system.damage.base.custom.formula"),
        ],
        data: {
          "flags.ddbimporter.activityMatch": "Bardic Damage",
        },
      },
    ];
  }


  get clearAutoEffects() {
    return true;
  }

}
