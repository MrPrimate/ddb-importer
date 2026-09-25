import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Container for the Misfortune options. DDB hangs the "Jinx Points" action and the raw curse
 * actions off this feature; none are built here. Jinx Points is its own document (KEEP_ACTIONS,
 * rogue/JinxPoints) and each chosen option parses as its own "Misfortunes: Curse of the X"
 * feature consuming it.
 */
export default class Misfortunes extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get override(): IDDBOverrideData {
    return {
      descriptionSuffix: "<p><i>Your chosen Misfortunes are separate features that consume points from the Jinx Points feature.</i></p>",
    };
  }

}
