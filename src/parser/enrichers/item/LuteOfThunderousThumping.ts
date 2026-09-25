import DDBEnricherData from "../data/DDBEnricherData";

export default class LuteOfThunderousThumping extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbBardLuteAtk01",
        overrides: {
          name: "Bard Attack",
          activationCondition: "While singing or humming, if you are a Bard",
          noConsumeTargets: true,
          // The source replaces only the attack modifier; damage keeps Strength.
          data: { attack: { ability: "str", bonus: "@abilities.cha.mod - @abilities.str.mod" } },
        },
      },
    ];
  }

}
