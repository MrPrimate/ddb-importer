import DDBEnricherData from "../../data/DDBEnricherData";

/** Materializer Minor Creation: a Cube comes free with casting a level 1+ spell; the use pool belongs to Cube Detonation. */
export default class CreateCube extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      noConsumeTargets: true,
      activationCondition: "You cast a level 1+ spell",
    };
  }

}
