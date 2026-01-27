/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TotemSpiritBear extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      name: "Activate",
      activationType: "special",
      data: {
        duration: this.is2014
          ? { units: "second", value: "60" }
          : { units: "minute", value: "10" },
      },
    };
  }

  get effects() {
    return [
      {
        name: "Totem Spirit: Bear",
        options: {
          transfer: true,
          disabled: true,
          durationSeconds: this.is2014 ? 60 : 600,
        },
        activityMatch: "Activate",
        changes: DDBEnricherData.allDamageTypes(["psychic"]).map((damage) => {
          return DDBEnricherData.ChangeHelper.unsignedAddChange(damage, 20, "system.traits.dr.value");
        }),
      },
    ];
  }

}
