import DDBEnricherData from "../data/DDBEnricherData";
import utils from "../../../lib/Utils";
import TrickWeapon from "./_TrickWeapon";
import { itemProperty } from "./_ItemActivities";

/**
 * Meat Hookshot: Untransformed it is a Sickle (with Finesse) and a one-handed Blunderbuss on a
 * chain; Transformed it is a two-handed Blunderbuss with a bladed attachment used as a two-handed
 * Battleaxe, and gains the Hookshot property.
 *
 * DDB ships a copy per weapon (Sickle, Blunderbuss, Battleaxe) beside the base item. The weapon
 * here is the melee half, Sickle or Battleaxe, and the Blunderbuss, which both states have, is a
 * second attack on it. dnd5e picks ammunition per item, so that attack does not spend any, as the
 * Hoopak's Sling does not. Hookshot is a rider of the Transform enchantment, so it only appears
 * while Transformed.
 */
export default class MeatHookshot extends TrickWeapon {

  static HOOKSHOT = "Hookshot";

  static HOOKSHOT_PULL = "Hookshot: Pull";

  static HOOKSHOT_ID = utils.namedIDStub(MeatHookshot.HOOKSHOT, { prefix: "ddbItem" });

  static HOOKSHOT_PULL_ID = utils.namedIDStub(MeatHookshot.HOOKSHOT_PULL, { prefix: "ddbItem" });

  get weaponName(): string {
    return "Meat Hookshot";
  }

  get transformedCopyName(): string {
    return "Meat Hookshot (Battleaxe)";
  }

  get untransformed(): ITrickWeaponForm {
    return {
      label: "Sickle",
      typeValue: "simpleM",
      baseItem: "sickle",
      number: 1,
      denomination: 4,
      damageType: "slashing",
      properties: ["lgt", "fin"],
      mastery: "nick",
      range: { value: 5 },
      attackType: "melee",
    };
  }

  // a Battleaxe wielded with two hands
  get transformed(): ITrickWeaponForm {
    return {
      label: "Battleaxe",
      typeValue: "martialM",
      baseItem: "battleaxe",
      number: 1,
      denomination: 10,
      damageType: "slashing",
      properties: ["two"],
      mastery: "topple",
      range: { value: 5 },
      attackType: "melee",
    };
  }

  override get transformedActivityRiders(): string[] {
    return [MeatHookshot.HOOKSHOT_ID, MeatHookshot.HOOKSHOT_PULL_ID];
  }

  get blunderbuss(): IDDBAdditionalActivity {
    return {
      init: { name: "Blunderbuss", type: DDBEnricherData.ACTIVITY_TYPES.ATTACK, id: utils.namedIDStub("Blunderbuss", { prefix: "ddbItem" }) },
      build: {
        generateAttack: true,
        generateDamage: true,
        generateActivation: true,
        generateConsumption: false,
        generateTarget: true,
        generateRange: true,
        activationOverride: {
          type: "action",
          value: 1,
          condition: "Untransformed: also as a Bonus Action when you take the Attack action with the Sickle, ignoring the Barrel property",
        },
        targetOverride: {
          affects: { count: "1", type: "creature", choice: false, special: "" },
        },
      },
      overrides: {
        noConsumeTargets: true,
        noeffect: true,
        data: {
          range: { override: true, value: "20", units: "ft" },
          attack: {
            ability: "dex",
            type: { value: "ranged", classification: "weapon" },
          },
          damage: {
            includeBase: false,
            parts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, bonus: "@mod", types: ["piercing"] })],
          },
        },
      },
    };
  }

  get hookshot(): IDDBAdditionalActivity {
    return {
      init: { name: MeatHookshot.HOOKSHOT, type: DDBEnricherData.ACTIVITY_TYPES.ATTACK, id: MeatHookshot.HOOKSHOT_ID },
      build: {
        generateAttack: true,
        generateDamage: true,
        generateActivation: true,
        generateConsumption: false,
        generateTarget: true,
        generateRange: true,
        activationOverride: { type: "action", value: 1, condition: "Utilize action" },
        targetOverride: {
          affects: { count: "1", type: "creature", choice: false, special: "" },
        },
      },
      overrides: {
        noConsumeTargets: true,
        noeffect: true,
        data: {
          range: { override: true, value: "30", units: "ft" },
          attack: {
            ability: "dex",
            type: { value: "ranged", classification: "weapon" },
          },
          damage: {
            includeBase: false,
            parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, bonus: "@abilities.dex.mod", types: ["slashing"] })],
          },
        },
      },
    };
  }

  override get propertyActivities(): IDDBAdditionalActivity[] {
    return [
      this.blunderbuss,
      this.hookshot,
      // itemProperty stubs the same id as HOOKSHOT_PULL_ID from the name
      itemProperty(MeatHookshot.HOOKSHOT_PULL, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["str"], formula: "13" },
        condition: "Hookshot hits a creature your size or smaller: it is pulled in a straight line to the nearest unoccupied space to you. A larger creature pulls you to it instead",
        range: { value: "30", units: "ft" },
        noeffect: true,
      }),
    ];
  }

}
