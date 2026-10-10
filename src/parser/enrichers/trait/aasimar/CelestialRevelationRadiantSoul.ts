import DDBEnricherData from "../../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../../data/SelfEnchant";

/**
 * Activating is a self-enchantment whose riders are the flight effect and Bonus Damage, so the
 * damage only appears for the minute it lasts.
 */
export default class CelestialRevelationRadiantSoul extends DDBEnricherData {

  static DAMAGE_ID = "ddbCelRevRSoulDm";

  static EFFECT_ID = "ddbCelRevRSoulEf";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Activate",
      addItemConsume: true,
      activationType: "action",
      targetType: "self",
      noTemplate: true,
      data: {
        duration: { value: "1", units: "minute" },
        enchant: {
          self: true,
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Bonus Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noeffect: true,
        },
        overrides: {
          id: CelestialRevelationRadiantSoul.DAMAGE_ID,
          activationType: "special",
          activationCondition: "1/turn",
          targetType: "creature",
          damageParts: [
            DDBEnricherData.basicDamagePart({
              bonus: "@prof",
              type: "radiant",
            }),
          ],
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Radiant Soul",
        options: {
          transfer: true,
          durationSeconds: 60,
        },
        data: {
          _id: CelestialRevelationRadiantSoul.EFFECT_ID,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        ],
        midiOptionalChanges: [
          {
            name: "radiantSoul",
            data: {
              label: `Radiant Soul Bonus Damage`,
              count: "each-round",
              "damage.all": "@prof[radiant]",
            },
          },
        ],
      },
      {
        name: "Radiant Soul",
        type: "enchant",
        activityMatch: "Activate",
        changes: toggleOffChanges("End Radiant Soul"),
        data: {
          flags: {
            ddbimporter: riders({
              activities: [CelestialRevelationRadiantSoul.DAMAGE_ID],
              effects: [CelestialRevelationRadiantSoul.EFFECT_ID],
            }),
          },
        },
      },
    ];
  }

}
