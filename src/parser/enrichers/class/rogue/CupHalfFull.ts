import DDBEnricherData from "../../data/DDBEnricherData";
import { fortuneDieConsumption } from "./_FortuneRogue";

/** Fortune Rogue (OTFY). A natural 20 within 60 feet gives back one expended Fortune Die. */
export default class CupHalfFull extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Regain Fortune Die",
      activationType: "special",
      activationCondition: "You or a creature within 60 feet of you rolls a 20 on a D20 Test",
      targetType: "self",
      additionalConsumptionTargets: [fortuneDieConsumption("-1")],
    };
  }

}
