import DDBEnricherData from "../data/DDBEnricherData";
import _FamiliarFeat from "./_FamiliarFeat";

/**
 * AU origin feat, three ability variants collapse here. Faithful Companion's free Find Familiar
 * cast per long rest, the slot-cast twin and a ritual cast are summons carrying Fortified
 * Familiar's HP bonus. The Fortified Familiar enchant, following the official implementation,
 * adds that bonus to the Find Familiar spell DDB grants alongside. Helpful Friend has its own
 * proficiency-bonus uses.
 */
export default class FamiliarFriend extends _FamiliarFeat {

  // every ability variant shares one identifier, so the imbuing feats can spend the free cast
  override get identifier(): string | null {
    return _FamiliarFeat.FAMILIAR_FRIEND_IDENTIFIER;
  }

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
      _FamiliarFeat.familiarSummon({ id: "famFriendFree000", name: "Find Familiar (Free Cast)", cast: "free" }),
      _FamiliarFeat.familiarSummon({ id: "famFriendSlot000", name: "Find Familiar (Spell Slot)", cast: "slot" }),
      _FamiliarFeat.familiarSummon({ id: "famFriendRitual0", name: "Find Familiar (Ritual)", cast: "ritual" }),
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
      _FamiliarFeat.imbueEnchantActivity("Fortified Familiar"),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        type: "enchant",
        name: "Fortified Familiar",
        activityMatch: "Fortified Familiar",
        options: {
          durationSeconds: null,
          expiry: null,
          description: "The familiar's Hit Point maximum and current Hit Points increase by twice your character level.",
        },
        changes: [
          // an override, not an add, so summons already carrying the bonus do not get it twice
          DDBEnricherData.ChangeHelper.overrideChange(_FamiliarFeat.FORTIFIED_HP, 20, "activities[summon].bonuses.hp"),
        ],
        data: {
          _id: "ddbFortifiedFamE",
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
