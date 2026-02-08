/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class _DivineMagic extends DDBEnricherData {

  get additionalAdvancements() {
    // const spellMap = {
    //   "Good": "cure wounds",
    //   "Evil": "inflict wounds",
    //   "Law": "bless",
    //   "Chaos": "bless",
    //   "Neutrality": "protection from evil and good",
    // };

    return [];
  }

}
