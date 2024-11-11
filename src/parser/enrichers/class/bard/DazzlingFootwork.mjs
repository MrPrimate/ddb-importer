/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class DazzlingFootwork extends DDBEnricherMixin {

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
          DDBEnricherMixin.generateOverrideChange("unarmoredBard", 10, "system.attributes.ac.calc"),
        ],
        data: {
          "flags.ddbimporter.activityMatch": "No Activity",
        },
      },
      {
        type: "enchant",
        changes: [
          DDBEnricherMixin.generateOverrideChange(`{} [Dazzling Footwork]`, 20, "name"),
          DDBEnricherMixin.generateUnsignedAddChange("bludgeoning", 20, "system.damage.base.types"),
          DDBEnricherMixin.generateOverrideChange("dex", 20, "system.ability"),
          DDBEnricherMixin.generateOverrideChange("true", 20, "system.damage.base.custom.enabled"),
          DDBEnricherMixin.generateOverrideChange("@scale.dance.dazzling-footwork + @abilities.dex.mod", 20, "system.damage.base.custom.formula"),
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
