import DDBEnricherData from "../data/DDBEnricherData";

export default class JallarzisStormOfRadiance extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Within Storm of Radiance",
        statuses: ["Blinded", "Deafened"],
        options: {
          description: "You are unable to cast spells with the verbal component",
        },
      },
    ];
  }

  get clearAutoEffects() {
    return true;
  }

}
