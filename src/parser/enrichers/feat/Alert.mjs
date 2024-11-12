/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class Alert extends DDBEnricherMixin {

  get effects() {
    if (this.is2014) {
      return [
        {
          options: {
            transfer: true,
          },
          changes: [
            DDBEnricherMixin.generateOverrideChange("true", 20, "flags.dnd5e.initiativeAlert"),
          ],
        },
      ];
    }
    return [];
  }

}
