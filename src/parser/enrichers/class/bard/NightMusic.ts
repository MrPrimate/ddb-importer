import DDBEnricherData from "../../data/DDBEnricherData";

export default class NightMusic extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Frightened",
        options: {
          durationSeconds: 60,
          description: "Frightened for 1 minute; repeat the Charisma saving throw at the end of each turn, ending the effect on a success.",
        },
        statuses: ["Frightened"],
      },
    ];
  }

}
