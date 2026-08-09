import DDBEnricherData from "../data/DDBEnricherData";

export default class WarriorsPasskey extends DDBEnricherData {

  override get override(): IDDBOverrideData {
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

  override get documentStub(): IDDBDocumentStub {
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

  override get stopDefaultActivity() {
    return true;
  }

}
