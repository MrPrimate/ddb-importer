/* eslint-disable class-methods-use-this */
import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class NaturesWard extends DDBEnricherData {

  get effects() {
    const multiple = [
      {
        name: "Poison Immunity",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("poisoned", 20, "system.traits.ci.value"),
        ],
      },
    ];
    const activeType = this.ddbParser?._chosen?.find((a) =>
      utils.nameString(a.label).startsWith("Nature's Ward"),
    )?.label ?? "";
    [
      { type: "fire", origin: "Arid" },
      { type: "cold", origin: "Polar" },
      { type: "lightning", origin: "Temperate" },
      { type: "poison", origin: "Tropical" },
    ].forEach((effect) => {
      multiple.push({
        name: `${effect.origin}: Resistance to ${effect.type}`,
        options: {
          transfer: true,
          disabled: !activeType.includes(effect.origin),
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(effect.type, 20, "system.traits.dr.value"),
        ],
      });
    });
    return multiple;
  }


  get clearAutoEffects() {
    return true;
  }

}
