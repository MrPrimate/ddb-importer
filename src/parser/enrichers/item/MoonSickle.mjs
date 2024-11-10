/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class MoonSickle extends DDBEnricherMixin {

  get effects() {
    return [
      {
        noCreate: true,
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange("+4", 20, "system.bonuses.heal.damage"),
        ],
      },
    ];
  }

}
