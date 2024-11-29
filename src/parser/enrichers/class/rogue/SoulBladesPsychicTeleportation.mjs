/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SoulBladesPsychicTeleportation extends DDBEnricherData {

  get activity() {
    return {
      name: "Psychic Teleportation",
      data: {
        img: "systems/dnd5e/icons/svg/trait-saves.svg",
      },
    };
  }

}
