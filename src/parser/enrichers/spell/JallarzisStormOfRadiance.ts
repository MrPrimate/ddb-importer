import DDBEnricherData from "../data/DDBEnricherData";

export default class JallarzisStormOfRadiance extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
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

  override get clearAutoEffects(): boolean {
    return true;
  }

}
