import DDBEnricherData from "../data/DDBEnricherData";
import utils from "../../../lib/Utils";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty, weaponRange } from "./_ItemActivities";

/**
 * Godsteel Worldcarver: a +2 greatsword or longsword with an extra 1d8 radiant on a hit (DDB's
 * modifier, on the attack). A bonus action stores it in an extradimensional space and another
 * retrieves it, which is a self enchantment that renames the sword and turns its activity into
 * the retrieval, so using it again removes the enchantment.
 *
 * On a 20 the target makes a DC 17 Charisma save: 3d8 radiant and banished (incapacitated) until
 * the start of your next turn, half damage and no banishment on a success. That is the Banishing
 * Strike save; DDB also carries the 3d8 as a "See Description" "Restriction:" attack, which the base
 * drops along with the parser's action-timed save. A cleric or paladin wielder and creatures of
 * their choice within 30 feet then regain hit points equal to half that radiant damage: Radiant
 * Restoration heals 0 plus the amount entered as the situational bonus, as no formula knows it.
 */
export default class GodsteelWorldcarver extends WeaponProperties {

  static STORE = "Send to Extradimensional Space";

  static BANISH = "Banishing Strike";

  static RESTORE = "Radiant Restoration (Cleric or Paladin)";

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(GodsteelWorldcarver.BANISH, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["cha"], formula: "17" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 8, types: ["radiant"] })],
        onSave: "half",
        condition: "When you roll a 20 on an attack roll made with this weapon",
        range: weaponRange(this),
        noeffect: false,
      }),
      (() => {
        const restore = itemProperty(GodsteelWorldcarver.RESTORE, DDBEnricherData.ACTIVITY_TYPES.HEAL, {
          condition: "After Banishing Strike, if you are a cleric or paladin: you and each creature of your choice within 30 feet regain hit points equal to half the radiant damage dealt (enter it as the situational bonus)",
          template: { type: "radius", size: "30" },
          range: { value: null, units: "self" },
          noeffect: true,
          data: { target: { affects: { choice: true, special: "You and each creature of your choice within 30 feet of you" } } },
        });
        return {
          ...restore,
          build: {
            ...restore.build,
            generateHealing: true,
            healingPart: DDBEnricherData.basicDamagePart({ customFormula: "0", types: ["healing"] }),
          },
        };
      })(),
      {
        init: {
          name: GodsteelWorldcarver.STORE,
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
          id: utils.namedIDStub(GodsteelWorldcarver.STORE, { prefix: "ddbItem" }),
        },
        build: {
          generateActivation: true,
          generateDamage: false,
          generateConsumption: false,
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "While holding the weapon; it also vanishes into the space on its own if it is ever more than 30 feet away from you",
          },
        },
        overrides: {
          noConsumeTargets: true,
          data: {
            restrictions: { type: "weapon", allowMagical: true },
            enchant: { self: true },
            // stored until retrieved, so the activity must not cap the enchantment
            duration: { units: "spec" },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        type: "enchant",
        name: "Godsteel Worldcarver: In Extradimensional Space",
        activityMatch: GodsteelWorldcarver.STORE,
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("{} (In Extradimensional Space)", 20, "name"),
          // the sword's only enchant activity is the store, and its next use removes this enchantment
          DDBEnricherData.ChangeHelper.overrideChange("Retrieve from space", 20, "activities[enchant].name"),
        ],
        options: {
          transfer: false,
          durationSeconds: null,
          expiry: null,
          description: "The sword is stored in a special extradimensional space. Use the activity again as a bonus action to make it reappear in your hand.",
        },
      },
      {
        name: "Banished",
        activityMatch: GodsteelWorldcarver.BANISH,
        statuses: ["Incapacitated"],
        options: {
          transfer: false,
          expiry: "sourceStart",
          description: "Banished to a special demiplane until the start of the wielder's next turn, then reappears in the space it left or the nearest unoccupied space.",
        },
      },
    ];
  }

}
