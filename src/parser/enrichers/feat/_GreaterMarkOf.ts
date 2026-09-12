import DDBDataUtils from "../../lib/DDBDataUtils";
import DDBEnricherData from "../data/DDBEnricherData";

export default class _GreaterMarkOf extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    const parentName = this.name.replace("Greater ", "").trim();
    const id = DDBDataUtils.classIdentifierName(parentName);
    return [
      {
        options: {
          transfer: true,
          durationSeconds: undefined,
        },
        data: {
          duration: {
            value: null,
            expiry: null,
            expired: undefined,
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("6", 20, `system.scale.${id}.die.faces`),
        ],
      },
    ];

  }

}
