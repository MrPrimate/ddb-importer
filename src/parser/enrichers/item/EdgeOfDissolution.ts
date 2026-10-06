import DDBEnricherData from "../data/DDBEnricherData";
import utils from "../../../lib/Utils";
import WeaponProperties from "./_WeaponProperties";
import { noExtraAttackDamage, unrestrictedDamageFormulas, weaponDamageBonus } from "./_ItemActivities";

/**
 * Edge of Dissolution: a bonus action and the command word make acid seep from the blade until the
 * word is spoken again or the sword is dropped or sheathed. While it drips, the sword deals an extra
 * 2d6 acid on a hit and the acid shows the target's location until the start of your next turn,
 * even if it is invisible. The extra die is a damage rule on a self enchantment from that
 * activity, so it is not part of every hit, and the enchantment renames the activity "Remove Acid"
 * while it lasts; the parser's "Invisible" status, read from the sentence about revealing
 * invisible creatures, goes with the base's auto status effect.
 */
export default class EdgeOfDissolution extends WeaponProperties {

  static ACID = "Acid Blade";

  override get activity(): IDDBActivityData {
    return { ...noExtraAttackDamage(), noeffect: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: EdgeOfDissolution.ACID,
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
          id: utils.namedIDStub(EdgeOfDissolution.ACID, { prefix: "ddbItem" }),
        },
        build: {
          generateActivation: true,
          generateDamage: false,
          generateConsumption: false,
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "Speak the command word; the acid drips until you speak it again or drop or sheathe the sword",
          },
        },
        overrides: {
          noConsumeTargets: true,
          data: {
            restrictions: { type: "weapon", allowMagical: true },
            enchant: { self: true },
            // lasts until the word is spoken again, so the activity must not cap the enchantment
            duration: { units: "spec" },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const dice = unrestrictedDamageFormulas(this);
    return [
      {
        type: "enchant",
        name: "Edge of Dissolution: Dripping Acid",
        activityMatch: EdgeOfDissolution.ACID,
        options: {
          transfer: false,
          // the text's "start of your next turn" is the revealed target's, not the blade's
          durationSeconds: null,
          expiry: null,
          description: "Acid drips from the blade, shedding dim light in a 5-foot emanation. A hit deals an extra 2d6 acid damage and shows the target's location until the start of your next turn, even if it is invisible or heavily obscured.",
        },
        changes: [
          ...(dice.length > 0 ? dice : ["2d6[acid]"]).map((formula) => weaponDamageBonus(this, formula)),
          // the sword's only enchant activity is Acid Blade, and its next use removes this enchantment
          DDBEnricherData.ChangeHelper.overrideChange("Remove Acid", 20, "activities[enchant].name"),
        ],
      },
    ];
  }

}
