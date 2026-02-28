import DDBEnricherData from "../../data/DDBEnricherData";

export default class ReliableTalent extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "flags.dnd5e.reliableTalent"),
        ],
      },
    ];
  }

}
