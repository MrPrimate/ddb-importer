/* eslint-disable class-methods-use-this */
import DDBDataUtils from "../../lib/DDBDataUtils.mjs";
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class _GreaterMarkOf extends DDBEnricherData {

  get effects() {
    const parentName = this.name.replace("Greater ", "").trim();
    const id = DDBDataUtils.classIdentifierName(parentName);
    return [
      {
        options: {
          transfer: true,
          durationSeconds: null,
          durationRounds: null,
        },
        data: {
          duration: {
            seconds: null,
            rounds: null,
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("6", 20, `system.scale.${id}.die.faces`),
        ],
      },
    ];

  }

}
