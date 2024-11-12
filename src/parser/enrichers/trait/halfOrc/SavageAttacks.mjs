/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class SavageAttacks extends DDBEnricherMixin {

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherMixin.generateOverrideChange("true", 20, "flags.dnd5e.savageAttacks"),
          DDBEnricherMixin.generateUnsignedAddChange("+1", 20, "flags.dnd5e.meleeCriticalDamageDice"),
        ],
      },
    ];
  }

}
