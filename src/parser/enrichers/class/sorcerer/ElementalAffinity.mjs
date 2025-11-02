/* eslint-disable class-methods-use-this */
import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ElementalAffinity extends DDBEnricherData {

  get type() {
    return this.isAction ? "damage" : "none";
  }

  get damageTypes() {
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
        DDBEnricherData.basicDamagePart({
          bonus: "@abilities.cha.mod",
          types: this.damageTypes,
        }),
      ],
    };
  }

  get chosenDamageType() {
    if (this.ddbParser.isMuncher) return "";
    const activeType = this.ddbParser._chosen?.find((a) =>
      utils.nameString(a.label).endsWith("Damage"),
    )?.label?.split(" Damage")[0].toLowerCase();

    if (activeType) return activeType;

    const featureType = this.name.match(/\(([^)]+)\)/);
    if (featureType && featureType.length > 1) {
      return featureType[1].toLowerCase();
    }
    return "";
  }

  get effects() {
    const activeType = this.chosenDamageType ?? "";

    return this.damageTypes.map((type) => {
      return {
        name: `Elemental Affinity, Resistance: ${utils.capitalize(type)}`,
        options: {
          transfer: activeType.includes(type),
          disabled: !activeType.includes(type),
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(type, 20, "system.traits.dr.value"),
        ],
      };
    });
  }

  get clearAutoEffects() {
    return true;
  }

  get override() {
    const activeType = this.chosenDamageType;
    const flags = {
      ddbimporter: {
        originalName: "Elemental Affinity",
      },
    };
    const result = activeType !== ""
      ? { data: { name: `Elemental Affinity (${utils.capitalize(activeType)})`, flags } }
      : { data: { name: "Elemental Affinity", flags } };

    return result;
  }

}
