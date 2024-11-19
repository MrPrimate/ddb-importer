/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class JallarzisStormOfRadiance extends DDBEnricherData {

  get effects() {
    return [
      {
        clearAutoEffects: true,
        name: "Within Storm of Radiance",
        statuses: ["Blinded", "Deafened"],
        options: {
          description: "You are unable to cast spells with the verbal component",
        },
      },
    ];
  }

}
