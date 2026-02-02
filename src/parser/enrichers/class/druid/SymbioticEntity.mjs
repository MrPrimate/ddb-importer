/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SymbioticEntity extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      name: "Create Symbiotic Entity",
      targetType: "self",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@classes.druid.levels * 4",
          types: ["temphp"],
        }),
        duration: {
          value: "10",
          units: "minute",
        },
      },
    };
  }

  get effects() {
    return [
      {
        name: "Symbiotic Entity",
        activityMatch: "Create Symbiotic Entity",
        options: {
          description: "Ends when temporary hit points are lost.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d6[necrotic]", 20, "system.bonuses.mwak.damage"),
          DDBEnricherData.ChangeHelper.addChange("1", 20, `system.scale.spores.halo-of-spores.number`),
        ],
      },

    ];
  }

}
