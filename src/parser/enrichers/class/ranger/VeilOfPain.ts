import DDBEnricherData from "../../data/DDBEnricherData";

export default class VeilOfPain extends DDBEnricherData {

  get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Veil of Pain: Invisible to Target",
        statuses: ["invisible"],
        options: {
          durationSeconds: 60,
          description: "The target dissociates your presence, only perceiving you as a flicker. You have the Invisible condition to the target for 1 minute. The target repeats the save at the end of each of its turns, ending the effect on itself on a success.",
        },
      },
    ];
  }

}
