/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class Lucky extends DDBEnricherMixin {

  get type() {
    if (this.featureType !== "feat") return null;
    return "utility";
  }

  get activity() {
    if (this.featureType !== "feat") return null;
    return {
      name: "Spend Luck Point",
      activationType: "special",
      addItemConsume: true,
    };
  }

  get override() {
    if (this.featureType !== "feat") return null;
    const uses = this._getUsesWithSpent({
      type: "feat",
      name: "Luck Points",
      max: this.is2014 ? 3 : "@prof",
      period: "lr",
    });
    return {
      data: {
        "system.uses": uses,
      },
    };
  }


  get effects() {
    if (this.featureType !== "race") return [];

    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherMixin.generateOverrideChange("true", 20, "flags.dnd5e.halflingLucky"),
        ],
      },
    ];
  }

}