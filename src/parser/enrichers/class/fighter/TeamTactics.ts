import DDBEnricherData from "../../data/DDBEnricherData";

export default class TeamTactics extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      addItemConsume: true,
      activationCondition: "You use Group Recovery",
      activationType: "special",
      targetType: "ally",
      targetCount: "max(1, @abilities.cha.mod)",
      data: {
        target: {
          affects: {
            type: "ally",
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "@scale.banneret.group-recovery",
            units: "ft",
          },
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Team Tactics",
        changes: [
          // to do: add advantage on all d20 test
        ],
      },
    ];
  }

}
