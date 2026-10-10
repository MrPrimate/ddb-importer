import DDBEnricherData from "../../data/DDBEnricherData";

/** Monster Slayer: add 1d6 to saves the Slayer's Prey target forces and to checks to escape its grapple. */
export default class SupernaturalDefense extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "The target of your Slayer's Prey forces you to make a saving throw, or you try to escape its grapple",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1d6",
          name: "Bonus to Roll",
        },
      },
    };
  }

  // No optinId: AC5e 13 does not reserve that keyword, so it would join the condition and fail it.
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Supernatural Defense",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional 1d6 bonus to saves forced by your Slayer's Prey target and to checks to escape its grapple. AC5e cannot check which creature is marked.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=1d6; optin; description=From target of Slayer's Prey",
            20,
            "flags.automated-conditions-5e.save.bonus",
          ),
          // escaping a grapple is an Athletics or Acrobatics check
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=1d6; optin; description=To escape the grapple of your Slayer's Prey target; skill.acr || skill.ath",
            20,
            "flags.automated-conditions-5e.check.bonus",
          ),
        ],
      },
    ];
  }

}
