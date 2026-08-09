import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcanePropulsionArmorGauntlet extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return null;
  }

  override get activity(): IDDBActivityData | null {
    return null;
  }

  override get effects(): IDDBEffectHint[] {
    return [];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [];
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        "system.properties": utils.addToProperties(this.data.system.properties, "mgc"),
      },
    };
  }


}
