import DDBEnricherData from "../data/DDBEnricherData";

export default class EvilEye extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        // the wording names no turn edge, but DDB ships an explicit 1-round duration, so
        // use the counted edge rather than inventing a source anchor (a pseudo expiry would
        // null the duration value)
        name: "Evil Eye: Increased Critical Range",
        ac5eOnly: true,
        options: {
          expiry: "turnStart",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("set=19", 20, "flags.automated-conditions-5e.grants.attack.criticalThreshold"),
        ],
      },
    ];
  }

}
