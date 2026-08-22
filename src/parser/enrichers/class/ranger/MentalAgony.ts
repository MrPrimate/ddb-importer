import DDBEnricherData from "../../data/DDBEnricherData";

export default class MentalAgony extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Mental Agony",
        options: {
          durationRounds: 1,
          description: "The target subtracts 1d10 from the triggering Intelligence, Wisdom, or Charisma saving throw. Creatures that are immune to the Frightened condition are immune to this effect.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-1d10", 20, "system.abilities.int.save.roll.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d10", 20, "system.abilities.wis.save.roll.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d10", 20, "system.abilities.cha.save.roll.bonus"),
        ],
      },
    ];
  }

}
