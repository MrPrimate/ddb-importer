import DDBEnricherData from "../../data/DDBEnricherData";

export default class BranchesOfTheTree extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Branches of the Tree",
      activationType: "reaction",
      data: {
        save: {
          ability: ["str"],
          dc: {
            calculation: "str",
            formula: "",
          },
        },
        target: {
          affects: {
            type: "creature",
            count: "1",
          },
        },
        range: {
          value: "30",
          units: "ft",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Branches of the Tree: Rooted",
        activityMatch: "Branches of the Tree",
        // expiry only, as Sentinel's Halted: "until the end of the current turn"
        options: {
          transfer: false,
          expiry: "turnEnd",
          description: "Speed 0 until the end of the current turn (optional, after the teleport).",
        },
        changes: [
          DDBEnricherData.ChangeHelper.customChange("*0", 20, "system.attributes.movement.all"),
          ...["walk", "fly", "swim", "climb", "burrow"].map((mode) =>
            DDBEnricherData.ChangeHelper.overrideChange("0", 60, `system.attributes.movement.${mode}`)),
        ],
      },
    ];
  }

}
