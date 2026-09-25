import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The parent only lists the boons. Left to the defaults it builds every chosen boon's DDB
 * action itself, so each boon appears twice on the sheet (here and on its own choice
 * document), and a lone chosen boon merging into a parent that already has activities throws
 * the boon's own away. Building nothing here lets each boon document supply them.
 */
export default class InterdictBoons extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

}
