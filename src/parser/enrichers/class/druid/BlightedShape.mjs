/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class BlightedShape extends DDBEnricherMixin {

  get effects() {
    return [
      {
        name: "Blighted Shape Changes",
        options: {
          description: "You gain +2 AC Bonus in Wild Shape",
        },
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange("2", 20, "system.attributes.ac.bonus"),
          DDBEnricherMixin.generateUnsignedAddChange("60", 20, "system.attributes.senses.darkvision"),
        ],
        atlChanges: [
          DDBEnricherMixin.generateATLChange("ATL.sight.range", CONST.ACTIVE_EFFECT_MODES.ADD, 60, 5),
          DDBEnricherMixin.generateATLChange("ATL.sight.visionMode", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "darkvision", 5),
        ],
      },
    ];
  }

}


