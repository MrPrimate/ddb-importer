/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TeamTactics extends DDBEnricherData {

  get activity() {
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

  get effects() {
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
