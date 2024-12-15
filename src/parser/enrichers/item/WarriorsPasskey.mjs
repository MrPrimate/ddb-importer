/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class WarriorsPasskey extends DDBEnricherData {

  get override() {
    return {
      data: {
        "system.damage.base": {
          number: 1,
          denomination: 10,
          bonus: "",
          type: "force",
        },
      },
    };
  }

  get documentStub() {
    return {
      documentType: "weapon",
      parsingType: "weapon",
      replaceDefaultActivity: false,
      systemType: {
        value: "martialM",
        baseItem: "longsword",
      },
      copySRD: {
        name: "Longsword +1",
        type: "weapon",
        uuid: "Compendium.dnd5e.items.Item.IPkf0XNowClwXnjQ",
      },
    };
  }

  get stopDefaultActivity() {
    return true;
  }

}
