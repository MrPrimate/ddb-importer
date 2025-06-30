/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Staff extends DDBEnricherData {

  get addAutoAdditionalActivities() {
    return false;
  }

  get stopDefaultActivity() {
    return true;
  }

  get documentStub() {
    return {
      documentType: "weapon",
      parsingType: "staff",
      replaceDefaultActivity: false,
      systemType: {
        value: "simpleM",
        baseItem: "quarterstaff",
      },
      copySRD: {
        name: "Quarterstaff",
        type: "weapon",
        uuid: this.is2014
          ? "Compendium.dnd5e.items.Item.g2dWN7PQiMRYWzyk"
          : "Compendium.dnd5e.equipment24.Item.phbwepQuartersta",
      },
    };
  }


}
