import DDBEnricherData from "../data/DDBEnricherData";
import utils from "../../../lib/Utils";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty, noExtraAttackDamage, weaponDamageBonus } from "./_ItemActivities";

/**
 * Warhammer of Eruptions: once smoldering (after its first hit in a combat) it adds 1d6 fire, and
 * at the end of your third turn smoldering it erupts in a 30 foot cone with no action: a Dexterity
 * save against 3d6 fire and 3d6 lightning, half on a success. It then rests for 2d6 hours.
 * Smoldering is a self enchantment from its own activity, carrying the 1d6 as a damage rule for
 * the hammer's hits, so the die is not part of every hit; while it lasts the activity reads "Cool
 * Warhammer", as using it again ends the enchantment.
 */
export default class WarhammerOfEruptions extends WeaponProperties {

  static SMOLDER = "Smoldering";

  override get activity(): IDDBActivityData {
    return { ...noExtraAttackDamage(), noeffect: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: WarhammerOfEruptions.SMOLDER,
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
          id: utils.namedIDStub(WarhammerOfEruptions.SMOLDER, { prefix: "ddbItem" }),
        },
        build: {
          generateActivation: true,
          generateDamage: false,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            value: null,
            condition: "The first time the hammer hits a target in a combat (no action required); it smolders until it erupts at the end of your third turn, or combat ends",
          },
        },
        overrides: {
          noConsumeTargets: true,
          data: {
            restrictions: { type: "weapon", allowMagical: true },
            enchant: { self: true },
            duration: { value: "3", units: "round" },
          },
        },
      },
      itemProperty("Eruption", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "13" },
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["fire"] }),
          DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["lightning"] }),
        ],
        onSave: "half",
        condition: "Automatically at the end of your third turn with the hammer smoldering, in a direction of your choice",
        template: { type: "cone", size: "30" },
        range: { value: null, units: "self" },
        noeffect: true,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        type: "enchant",
        name: "Warhammer of Eruptions: Smoldering",
        activityMatch: WarhammerOfEruptions.SMOLDER,
        options: {
          transfer: false,
          // three rounds, ending with the eruption at the end of your third turn rather than at
          // the start of the next one, which the text's turn wording would otherwise set
          durationSeconds: 18,
          expiry: "turnEnd",
          description: "The hammer deals an extra 1d6 fire damage to any target it hits. It erupts at the end of your third turn smoldering.",
        },
        changes: [
          weaponDamageBonus(this, "1d6[fire]"),
          // the hammer's only enchant activity is Smoldering, and its next use removes this enchantment
          DDBEnricherData.ChangeHelper.overrideChange("Cool Warhammer", 20, "activities[enchant].name"),
        ],
      },
    ];
  }

}
