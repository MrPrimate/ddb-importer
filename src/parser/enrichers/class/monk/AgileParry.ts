import DDBEnricherData from "../../data/DDBEnricherData";

export default class AgileParry extends DDBEnricherData {

  get activity() {
    return {
      activationType: "special",
      targetType: "self",
    };
  }

  get effects() {
    return [
      {
        options: {
          description: "You gain +2 AC Bonus",
          durationSeconds: 6,
        },
        daeSpecialDuration: ["turnStartSource" as const],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }
}
