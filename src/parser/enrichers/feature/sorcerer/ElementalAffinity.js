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
      noeffect: true,
      activationType: "special",
      activationCondition: "1/turn. Damage someone with a spell of the same damage type",
      damageParts: [
        DDBEnricherMixin.basicDamagePart({
          customFormula: "@abilites.cha.mod",
          types: this.damageTypes(),
        }),
      ],
    };
  }

  get effect() {
    const activeType = this.ddbParser?._chosen.find((a) =>
      utils.nameString(a.label).startsWith("Elemental Affinity"),
    )?.label ?? "";

    console.warn("Elemental Affinity", {
      this: this,
      activeType,
    });
    return {
      clearAutoEffects: true,
      multiple: this.damageTypes().map((type) => {
        return {
          name: `Elemental Affinity, Resistance: ${utils.capitalize(type)}`,
          options: {
            transfer: !activeType.includes(type),
            disabled: !activeType.includes(type),
          },
          changes: [
            DDBEnricherMixin.generateUnsignedAddChange(type, 20, "system.traits.dr.value"),
          ],
        };
      }),
    };
  }

}
