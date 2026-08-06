import DDBEnricherData from "../../data/DDBEnricherData";

export default class MentalAgony extends DDBEnricherData {

  get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Mental Agony",
        options: {
          durationRounds: 1,
          description: "The target subtracts 1d10 from the triggering Intelligence, Wisdom, or Charisma saving throw. Creatures that are immune to the Frightened condition are immune to this effect.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-1d10", 20, "system.abilities.int.bonuses.save"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d10", 20, "system.abilities.wis.bonuses.save"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d10", 20, "system.abilities.cha.bonuses.save"),
        ],
      },
    ];
  }

}
