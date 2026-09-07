import DDBEnricherData from "../../data/DDBEnricherData";

export default class SoulBlades extends DDBEnricherData {

  override get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: ["Psychic Teleportation"],
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const homingStrikes = this.is2014
      ? "Soul Blades: Homing Strikes"
      : "Psychic Blades: Homing Strikes";
    const psychicTeleportation = this.is2014
      ? "Soul Blades: Psychic Teleportation"
      : "Psychic Teleportation";

    return [
      {
        action: { name: homingStrikes, type: "class" },
        overrides: {
          useActivitySnippet: { name: homingStrikes, type: "class" },
        },
      },
      { action: { name: psychicTeleportation, type: "class" } },
    ];
  }

}
