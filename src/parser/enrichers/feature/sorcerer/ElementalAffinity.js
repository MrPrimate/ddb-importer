/* eslint-disable class-methods-use-this */
import utils from "../../../../lib/utils.js";
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class ElementalAffinity extends DDBEnricherMixin {

  get type() {
    return "damage";
  }

  damageTypes() {
    return [
      "acid",
      "cold",
      "fire",
      "lightning",
      "poison",
    ];
  }

  get activity() {
    return {
      name: "Damage bonus",
      type: "damage",
      noeffect: true,
      activationType: "special",
      activationCondition: "1/turn. Damage someone with a spell of the same damage type",
      damageParts: [
        DDBEnricherMixin.basicDamagePart({
          bonus: "@abilities.cha.mod",
          types: this.damageTypes(),
        }),
      ],
    };
  }

  get effects() {
    const activeType = this.ddbParser?._chosen.find((a) =>
      utils.nameString(a.label).endsWith("Damage"),
    )?.label?.split(" Damage")[0].toLowerCase() ?? "";

    return this.damageTypes().map((type) => {
      return {
        name: `Elemental Affinity, Resistance: ${utils.capitalize(type)}`,
        options: {
          transfer: activeType.includes(type),
          disabled: !activeType.includes(type),
        },
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange(type, 20, "system.traits.dr.value"),
        ],
      };
    });
  }

  get clearAutoEffects() {
    return true;
  }

}
