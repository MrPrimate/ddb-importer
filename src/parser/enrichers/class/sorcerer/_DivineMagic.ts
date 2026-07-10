import DDBEnricherData from "../../data/DDBEnricherData";

export default class _DivineMagic extends DDBEnricherData {

  get additionalAdvancements(): I5eAdvancement[] {
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
