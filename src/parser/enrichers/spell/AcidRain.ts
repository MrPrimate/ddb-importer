import DDBEnricherData from "../data/DDBEnricherData";
import { ongoingClone } from "./_SpellRegions";

/** The deluge rolls its save as it begins, then again for a creature that enters or ends its turn there. */
export default class AcidRain extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      id: "ddbAcidRainSpSav",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityId: "ddbAcidRainZone1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      ongoingClone("ddbAcidRainZone1", "Enters the rain for the first time on its turn or ends its turn there"),
    ];
  }

}
