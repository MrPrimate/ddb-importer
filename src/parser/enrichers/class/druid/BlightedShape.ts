import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlightedShape extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blighted Shape Changes",
        options: {
          description: "You gain +2 AC Bonus in Wild Shape",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("60", 20, "system.attributes.senses.ranges.darkvision"),
        ],
      },
    ];
  }

}

