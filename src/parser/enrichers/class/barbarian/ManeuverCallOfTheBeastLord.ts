import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverCallOfTheBeastLord extends DDBEnricherData {

  // keeps the shared "Maneuver Points" action, and the point pool it carries, off
  // this document; the pool lives on Martial Maneuvers
  override get builtFeaturesFromActionFilters(): string[] {
    return ["Summon Beast"];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  // no bespoke statblock to generate: the player picks a real beast, so this uses
  // the system's cr summon mode (compendium browser locked to npc, beast, cr <=
  // barbarian level) rather than the profileKeys/summons compendium path.
  // DDB's own snippet renders "your level" as {{classlevel}}.
  override get activity(): IDDBActivityData {
    return {
      name: "Call Bestial Spirit",
      activationType: "action",
      noTemplate: true,
      noConsumeTargets: true,
      addItemConsume: true,
      itemConsumeTargetName: "maneuver-points",
      itemConsumeValue: 5,
      data: {
        range: {
          units: "ft",
          value: "60",
        },
        duration: {
          units: "minute",
          value: "10",
          concentration: true,
        },
        profiles: [
          {
            count: "1",
            cr: "@classes.barbarian.levels",
            types: ["beast"],
          },
        ],
        summon: {
          prompt: true,
          mode: "cr",
        },
        match: {
          disposition: true,
        },
        target: {
          affects: {
            count: "1",
            type: "space",
            special: "unoccupied",
          },
        },
      },
    };
  }

}
