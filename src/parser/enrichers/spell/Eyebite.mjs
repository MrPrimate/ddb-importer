/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Eyebite extends DDBEnricherData {

  get clearAutoEffects() {
    return true;
  }

  get effects() {
    return [
      {
        name: "Asleep",
        data: {
          img: "systems/dnd5e/icons/svg/statuses/unconscious.svg",
        },
        statuses: ["Unconscious"],
      },
      {
        name: "Panicked",
        data: {
          img: "systems/dnd5e/icons/svg/statuses/frightened.svg",
        },
        statuses: ["Frightened"],
      },
      {
        name: "Sickened",
        data: {
          img: "systems/dnd5e/icons/svg/statuses/poisoned.svg",
        },
        statuses: this.is2014 ? [] : ["Poisoned"],
      },
    ];
  }

  get additionalActivities() {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Concentration Action",
          noSpellslot: true,
        },
      },
    ];
  }

}
