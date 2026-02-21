import DDBEnricherData from "../data/DDBEnricherData";

export default class BoonOfTheNightSpirit extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Shadowy Form",
      activationType: "special",
      activationCondition: "Within dim light or darkness",
      targetType: "self",
    };
  }

  get additionalActivities() {
    return [
      { action: { name: "Merge with Shadows", type: "feat", rename: ["Merge with Shadows"] } },
    ];
  }

  get effects() {
    const shadow = {
      name: "Shadowy Form",
      changes: [
        "bludgeoning", "piercing", "slashing",
        "acid", "cold", "fire", "force", "lightning", "necrotic", "poison", "thunder",
      ].map((element) =>
        DDBEnricherData.ChangeHelper.damageResistanceChange(element),
      ),
      activityMatch: "Shadowy Form",
    };
    const merge = {
      name: "Merge with Shadows: Invisible",
      statuses: ["Invisible"],
      options: {
        description: " The condition ends on you immediately after you take an action, a Bonus Action, or a Reaction.",
        durationSeconds: 6,
      },
      activityMatch: "Merge with Shadows",
    };
    return [shadow, merge];
  }

}
