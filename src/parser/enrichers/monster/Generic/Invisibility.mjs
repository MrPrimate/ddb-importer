/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Invisibility extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      rangeSelf: true,
    };
  }

  get effects() {
    const permanent = ["special"].includes(foundry.utils.getProperty(this.data, "flags.monsterMunch.type"));
    const improvedEffect = ["Superior Invisibility"].includes(this.data.name);

    return [
      {
        options: {
          transfer: permanent,
        },
        name: "Invisibility",
        statuses: ["Invisible"],
        daeStackable: "noneName",
        daeSpecialDurations: improvedEffect
          ? []
          : ["1Attack", "1Spell", "1Action"],
        midiProperties: {
          concentration: true,
        },
      },
    ];
  }

}
