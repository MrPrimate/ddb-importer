/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class HexWarrior extends DDBEnricherData {
  get type() {
    return "enchant";
  }

  get activity() {
    return {
      activationType: "special",
      data: {
        name: "Bond With Weapon",
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
        type: "enchant",
        ignoreTransfer: true,
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Hex Weapon]`, 20, "name"),
          DDBEnricherData.ChangeHelper.overrideChange("cha", 20, "system.ability"),
        ],
      },
    ];
  }
}
