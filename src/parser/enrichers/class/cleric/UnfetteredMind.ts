import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Unfettered Mind (Knowledge Domain, 2024): 60-foot telepathy, carried as a transfer effect
 * because DDB has no language modifier for it.
 */
export default class UnfetteredMind extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Unfettered Mind",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "system.traits.languages.communication.telepathy.value"),
        ],
      },
    ];
  }

}
