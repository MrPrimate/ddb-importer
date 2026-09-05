import DDBEnricherData from "../../data/DDBEnricherData";

export default class EldritchStrike extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Eldritch Strike",
      activationType: "special",
      activationCondition: "When you hit a creature with a weapon attack",
      targetType: "creature",
      noTemplate: true,
      data: {
        range: {
          units: "spec",
        },
      },
    };
  }

  // the rule only covers saves against the fighter's own spells; a change condition cannot see
  // which item forced the save, so the disadvantage is unconditional and DAE ends it after one save
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Struck",
        options: {
          expiry: "sourceEnd",
          description: "Disadvantage on the next saving throw against a spell the fighter casts, until the end of the fighter's next turn.",
        },
        daeSpecialDurations: ["isSave"],
        changes: [
          DDBEnricherData.ChangeHelper.ruleDisadvantageChange("save"),
        ],
      },
    ];
  }

}
