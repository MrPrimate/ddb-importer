/* eslint-disable class-methods-use-this */
import utils from "../../../lib/utils.js";
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class BoonOfEnergeResistance extends DDBEnricherMixin {

  get effect() {
    const activeType = this.ddbParser?._chosen.find((a) =>
      utils.nameString(a.label).startsWith("Boon of Energe Resistance"),
    )?.label ?? "";

    const types = ["Acid", "Cold", "Fire", "Lightning", "Necrotic", "Poison", "Psychic", "Radiant", "Thunder"];
    const multiple = [];
    types.forEach((type) => {
      multiple.push({
        name: `Boon of Energe Resistance: ${type}`,
        options: {
          transfer: true,
          disabled: !activeType.includes(type),
        },
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange(type.toLowerCase(), 20, "system.traits.dr.value"),
        ],
      });
    });

    return {
      multiple,
    };
  }
}
