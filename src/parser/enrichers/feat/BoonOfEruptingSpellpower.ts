import DDBEnricherData from "../data/DDBEnricherData";

/**
 * AU epic boon. Spell Overload surges a damaging slot spell: 1s and 2s on its damage dice count as
 * 3 (left to the player, no roll hook can rewrite them), and every creature it damaged is knocked
 * Prone. The single use returns on Initiative or any rest; DDB ships the use without a recovery.
 */
export default class BoonOfEruptingSpellpower extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Spell Overload",
      targetType: "creature",
      activationType: "special",
      activationCondition: "When you cast a spell that deals damage using a spell slot",
      addItemConsume: true,
      noTemplate: true,
      data: {
        range: { units: "any" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Spell Overload: Prone",
        activityMatch: "Spell Overload",
        statuses: ["prone"],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [
          { period: "initiative", type: "recoverAll" },
          { period: "sr", type: "recoverAll" },
          { period: "lr", type: "recoverAll" },
        ],
      },
    };
  }

}
