/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class EmptyBody extends DDBEnricherData {
  get activity() {
    return {
      targetType: "self",
    };
  }

  get effects() {
    return [
      {
        options: {
          durationSeconds: 60,
        },
        statuses: ["invisible"],
        changes: DDBEnricherData.allDamageTypes(["force"]).map((element) =>
          DDBEnricherData.ChangeHelper.unsignedAddChange(element, 20, "system.traits.dr.value"),
        ),
      },
    ];
  }
}
