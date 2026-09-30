import DDBEnricherData from "../data/DDBEnricherData";
import { setItemCastUses } from "./_ItemActivities";

/** AU idol: its Augury cast is once per dawn on the cast activity. */
export default class TarnishedIdolOfGoodFortunes extends DDBEnricherData {

  override async cleanup(): Promise<void> {
    setItemCastUses(this.data, { limited: ["Augury"] });
  }

}
