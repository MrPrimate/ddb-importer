import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Soul of Artifice (2024): Cheat Death comes from the DDB action; Magical Guidance restores all
 * Flash of Genius uses on a short rest. The 2014 printing's save bonus per attuned item is a
 * DDB modifier, so nothing is added there.
 */
export default class SoulOfArtifice extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction || !this.is2024) return [];
    return [
      {
        init: {
          name: "Magical Guidance",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: true,
          generateUtility: true,
          activationOverride: {
            type: "shortRest",
            value: null,
            condition: "Regain all expended uses of Flash of Genius",
          },
        },
        overrides: {
          targetType: "self",
          rangeSelf: true,
          addItemConsume: true,
          itemConsumeTargetName: "Flash of Genius",
          itemConsumeValue: "-max(1, @abilities.int.mod)",
        },
      },
    ];
  }

}
