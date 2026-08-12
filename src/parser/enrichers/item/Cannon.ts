import { DICTIONARY } from "../../../config/_module";
import { DDBSources } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";

export default class Cannon extends DDBEnricherData {

  get isMageHandPress(): boolean {
    const bookIds = DDBSources.getBookIdsInCategories([DICTIONARY.sourceCategories.mageHandPress]);
    const sources = foundry.utils.getProperty(this.ddbParser.ddbDefinition, "sources") as IDDBSource[] | undefined;
    return sources?.some((source) => bookIds.includes(source.sourceId)) ?? false;
  }

  override get override(): IDDBOverrideData {
    if (!this.isMageHandPress) return {};
    return {
      data: {
        "system.ammunition.type": "cannonballs",
      },
    };
  }

}
