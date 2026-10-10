import DDBEnricherData from "../../data/DDBEnricherData";

/** Urban Colossus: the animated-object form tramples creatures your size or smaller for 2d6 + Wisdom bludgeoning and knocks them Prone, once per creature per turn. */
export default class UrbanColossus extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Unstoppable",
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "You enter the space of a creature your size or smaller while shape-shifted into an animated object",
      noTemplate: true,
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, bonus: "@abilities.wis.mod", types: ["bludgeoning"] })],
        },
      },
    };
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Prone",
        activityMatch: "Unstoppable",
        statuses: ["prone"],
      },
      {
        name: "Urban Colossus",
        options: {
          transfer: true,
          disabled: true,
          description: "While shape-shifted into an animated object: AC 18, once per turn reduce damage under 10 to 0, Slam twice with the Attack action.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("flat", 20, "system.attributes.ac.calc"),
          DDBEnricherData.ChangeHelper.overrideChange("18", 20, "system.attributes.ac.flat"),
        ],
      },
    ];
  }

}
