import DDBEnricherData from "../../data/DDBEnricherData";

export default class SoulBlades extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return this.is2014
      ? [
        { action: { name: "Soul Blades: Homing Strikes", type: "class" } },
        { action: { name: "Soul Blades: Psychic Teleportation", type: "class" } },
      ]
      : [
        { action: { name: "Psychic Blades: Homing Strikes", type: "class" } },
        { action: { name: "Psychic Teleportation", type: "class" } },
      ];
  }

}
