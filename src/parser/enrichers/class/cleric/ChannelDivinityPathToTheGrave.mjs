/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ChannelDivinityPathToTheGrave extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Cursed",
        options: {
          durationSeconds: 6,
        },
        daeSpecialDurations: ["isDamaged"],
        changes: DDBEnricherData.allDamageTypes().map((damageType) =>
          DDBEnricherData.ChangeHelper.unsignedAddChange(damageType, 200, "system.traits.dv.value"),
        ),
      },
    ];
  }
}
