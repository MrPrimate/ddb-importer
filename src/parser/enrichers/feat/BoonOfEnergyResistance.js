/* eslint-disable class-methods-use-this */
import utils from "../../../lib/utils.js";
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class BoonOfEnergyResistance extends DDBEnricherMixin {

  get activity() {
    return {
      type: "none",
    };
  }

  get additionalActivities() {
    return [
      { action: { name: "Energy Redirection", type: "class" } },
    ];
  }

  get effects() {
    const activeType = this.ddbParser?._chosen.find((a) =>
      utils.nameString(a.label).startsWith("Boon of Energy Resistance"),
    )?.label ?? "";

    const types = ["Acid", "Cold", "Fire", "Lightning", "Necrotic", "Poison", "Psychic", "Radiant", "Thunder"];
    const multiple = [];
    types.forEach((type) => {
      multiple.push({
        name: `Boon of Energy Resistance: ${type}`,
        options: {
          transfer: true,
          disabled: !activeType.includes(type),
        },
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange(type.toLowerCase(), 20, "system.traits.dr.value"),
        ],
      });
    });

    return multiple;
  }

  get clearAutoEffects() {
    return true;
  }
}
