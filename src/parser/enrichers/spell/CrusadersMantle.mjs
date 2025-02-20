/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class CrusadersMantle extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4[radiant]", 20, "system.bonuses.mwak.damage"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4[radiant]", 20, "system.bonuses.rwak.damage"),
        ],
        data: {
          flags: {
            ActiveAuras: {
              isAura: true,
              aura: "Allies",
              radius: 30,
              alignment: "",
              type: "",
              ignoreSelf: false,
              height: false,
              hidden: false,
              onlyOnce: false,
              save: false,
              savedc: null,
              displayTemp: true,
            },
          },
        },
      },
    ];
  }

}
