import DDBEnricherData from "../../data/DDBEnricherData";

export default class SoulBladesPsychicTeleportation extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Psychic Teleportation",
      data: {
        img: "systems/dnd5e/icons/svg/trait-saves.svg",
      },
    };
  }

}
