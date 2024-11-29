/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class BlessingOfTheTrickster extends DDBEnricherData {

  get effects() {
    return [
      {
        options: {
          description: "Advantage on Dexterity (Stealth) checks.",
        },
      },
    ];
  }

}
