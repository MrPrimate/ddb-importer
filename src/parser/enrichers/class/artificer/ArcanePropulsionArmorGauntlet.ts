import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcanePropulsionArmorGauntlet extends DDBEnricherData {

  get type() {
    return null;
  }

  get activity(): IDDBActivityData {
    return null;
  }

  get effects(): IDDBEffectHint[] {
    return [];
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [];
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        "system.properties": utils.addToProperties(this.data.system.properties, "mgc"),
      },
    };
  }


}
