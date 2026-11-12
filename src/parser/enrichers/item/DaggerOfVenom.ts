import DDBEnricherData from "../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../data/SelfEnchant";
import utils from "../../../lib/Utils";

/**
 * Dagger of Venom: coating the blade is an enchantment that spends the
 * daily use and lasts a minute, and its rider is the Poison Save, which only appears while the
 * blade is coated. The coat is a self-enchantment here, so using Coat Blade with Poison again wipes
 * it off for free.
 */
export default class DaggerOfVenom extends DDBEnricherData {

  static COAT_NAME = "Coat Blade with Poison";

  static SAVE_ID = utils.namedIDStub("Poison Save", { prefix: "ddbItem" });

  // the parser's own save would be a second, always-visible copy of the poison
  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: DaggerOfVenom.COAT_NAME, type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT },
        build: { generateActivation: true, generateConsumption: false },
        overrides: {
          activationType: "bonus",
          addItemConsume: true,
          noTemplate: true,
          targetType: "self",
          allowMagical: true,
          data: {
            enchant: { self: true },
            duration: { value: "1", units: "minute" },
          },
        },
      },
      {
        init: { name: "Poison Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE, id: DaggerOfVenom.SAVE_ID },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateSave: true,
          generateDamage: true,
          generateTarget: true,
          saveOverride: { ability: ["con"], dc: { calculation: "", formula: "15" } },
          activationOverride: { type: "special", value: null, condition: "When a coated attack hits a creature; the coat then wipes off" },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 10, types: ["poison"] })],
          targetOverride: { override: true, affects: { type: "creature", count: "1" } },
        },
        overrides: {
          noConsumeTargets: true,
          data: { damage: { onSave: "none" } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned",
        activityMatch: "Poison Save",
        statuses: ["Poisoned"],
        options: {
          transfer: false,
          durationSeconds: 60,
        },
      },
      {
        name: "Poison Coat",
        type: "enchant",
        activityMatch: DaggerOfVenom.COAT_NAME,
        changes: [
          ...toggleOffChanges("Wipe Off Poison"),
          DDBEnricherData.ChangeHelper.overrideChange("{} On Hit: use the Poison Save activity.", 20, "activities[attack].description.chatFlavor"),
        ],
        data: {
          flags: {
            ddbimporter: riders({ activities: [DaggerOfVenom.SAVE_ID] }),
          },
        },
      },
    ];
  }

}
