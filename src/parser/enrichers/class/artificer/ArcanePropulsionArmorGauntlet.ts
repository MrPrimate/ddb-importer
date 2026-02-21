import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcanePropulsionArmorGauntlet extends DDBEnricherData {

  get type() {
    return null;
  }

  get activity() {
    return null;
  }

  get effects() {
    return [];
  }

  get additionalActivities() {
    return [];
  }

  get override() {
    return {
      data: {
        "system.properties": utils.addToProperties(this.data.system.properties, "mgc"),
      },
    };
  }


}
