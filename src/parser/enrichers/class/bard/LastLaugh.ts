import DDBEnricherData from "../../data/DDBEnricherData";

export default class LastLaugh extends DDBEnricherData {

  get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Last Laugh",
        options: {
          durationSeconds: 60,
          description: "Cackling with fatalistic glee, you have Resistance to all damage for 1 minute. You also regain all expended Bardic Inspiration dice, and can expend up to three of them when hit to force the attacker to make a Charisma save or take Psychic damage.",
        },
        changes: DDBEnricherData.allDamageTypes().map((t) => {
          return DDBEnricherData.ChangeHelper.damageResistanceChange(t);
        }),
      },
    ];
  }

}
