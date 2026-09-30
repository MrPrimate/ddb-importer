import _FamiliarFeat from "./_FamiliarFeat";

/**
 * AU origin feat, three ability variants collapse here. Faithful Companion's free Find Familiar
 * cast per long rest and the slot-cast twin are summons carrying Fortified Familiar's HP bonus,
 * which dnd5e cannot add to the Find Familiar spell DDB grants alongside. Helpful Friend has its
 * own proficiency-bonus uses.
 */
export default class FamiliarFriend extends _FamiliarFeat {

  override get type(): IDDBActivityType | null {
    return _FamiliarFeat.ACTIVITY_TYPES.NONE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      _FamiliarFeat.familiarSummon({ id: "famFriendFree000", name: "Find Familiar (Free Cast)", itemConsume: true }),
      _FamiliarFeat.familiarSummon({ id: "famFriendSlot000", name: "Find Familiar (Spell Slot)", slotConsume: true }),
      {
        init: { name: "Helpful Friend", type: _FamiliarFeat.ACTIVITY_TYPES.UTILITY },
        build: { generateActivation: true, generateConsumption: true, generateTarget: true },
        overrides: {
          targetType: "self",
          activationType: "special",
          activationCondition: "Ability check with a proficient skill while your familiar is within 5 feet",
          noConsumeTargets: true,
          addActivityConsume: true,
          data: { uses: { spent: 0, max: "@prof", recovery: [{ period: "lr", type: "recoverAll" }] } },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [{ period: "lr", type: "recoverAll" }],
      },
    };
  }

}
