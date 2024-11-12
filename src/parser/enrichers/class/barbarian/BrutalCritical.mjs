/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class BrutalCritical extends DDBEnricherMixin {

  get effects() {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherMixin.generateSignedAddChange("+1", 20, "flags.dnd5e.meleeCriticalDamageDice"),
        ],
      },
    ];
  }

}
