import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Eight kinds of ammunition, each with its own rider, and none of them reachable by
 * the parser.
 *
 * The generator that names a save activity per description section cannot split this
 * item: DDB writes most of its labels `<em><strong>Air Ammunition.</strong></em>` but
 * "Water Ammunition." the other way round, and `DDBDescriptions.sections` ranks a
 * marker by its outermost tag, so only the odd one out reads as a boundary. Without
 * two sections it falls back to flat mode and produces "Dex Save"/"Con Save" - and the
 * primary activity ends up carrying every element's damage dice at once.
 *
 * Each element gets its extra damage and its save as separate activities, because they
 * are separate rolls: the extra damage lands whenever the attack hits, while the save
 * is rolled by the target (or by bystanders) afterwards. Folding them together would
 * make the extra damage depend on the save.
 *
 * Not built: Smoke Ammunition, which casts fog cloud and rolls nothing, Water's 3d6
 * against creatures made of fire (a target-conditional die), and Ooze's ongoing 1d6
 * acid for starting a turn prone in the grease.
 */
export default class QuiverOfElementalChaos extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  static SAVE_DC = "15";

  /** Every save the quiver rolls uses the same fixed DC. */
  static saveDC(ability: string): I5eActivitySave {
    return {
      ability: [ability],
      dc: { calculation: "", formula: QuiverOfElementalChaos.SAVE_DC },
    };
  }

  /** The extra damage a piece of ammunition adds when the ranged attack hits. */
  static onHit(name: string, { number, denomination, type, condition }: {
    number: number;
    denomination: number;
    type: string;
    condition: string;
  }): IDDBAdditionalActivity {
    return {
      init: { name, type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
      build: {
        generateDamage: true,
        generateActivation: true,
        generateTarget: true,
        generateConsumption: false,
        includeBaseDamage: false,
        damageParts: [DDBEnricherData.basicDamagePart({ number, denomination, type })],
        activationOverride: { type: "special", value: null, condition },
      },
      overrides: { noTemplate: true, targetType: "creature" },
    };
  }

  /** A rider the ammunition forces on impact, rolled by the target rather than by you. */
  static onImpact(name: string, { ability, condition, damage = null, template = null }: {
    ability: string;
    condition: string;
    damage?: I5eDamagePart | null;
    template?: { type: TTemplate; size: string } | null;
  }): IDDBAdditionalActivity {
    return {
      init: { name, type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
      build: {
        generateSave: true,
        generateDamage: damage !== null,
        generateActivation: true,
        generateTarget: true,
        generateConsumption: false,
        includeBaseDamage: false,
        damageParts: damage ? [damage] : [],
        onSave: "none",
        saveOverride: QuiverOfElementalChaos.saveDC(ability),
        activationOverride: { type: "special", value: null, condition },
      },
      overrides: {
        noTemplate: !template,
        targetType: "creature",
        ...(template
          ? {
            data: {
              target: {
                override: true,
                template: { type: template.type, size: template.size, units: "ft" },
                affects: { type: "creature" },
              },
            },
          }
          : {}),
      },
    };
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Air Ammunition",
      activationType: "special",
      activationCondition: "On a hit with air ammunition",
      noTemplate: true,
      targetType: "creature",
      removeDamageParts: true,
      damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, type: "thunder" })],
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      QuiverOfElementalChaos.onHit("Earth Ammunition", {
        number: 2, denomination: 6, type: "bludgeoning",
        condition: "On a hit with earth ammunition",
      }),
      QuiverOfElementalChaos.onImpact("Earth Ammunition: Push", {
        ability: "str",
        condition: "On a hit with earth ammunition",
      }),
      QuiverOfElementalChaos.onHit("Fire Ammunition", {
        number: 1, denomination: 6, type: "fire",
        condition: "On a hit with fire ammunition",
      }),
      QuiverOfElementalChaos.onImpact("Fire Ammunition: Explosion", {
        ability: "dex",
        condition: "Hit or miss with fire ammunition",
        damage: DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, type: "fire" }),
        template: { type: "radius", size: "5" },
      }),
      QuiverOfElementalChaos.onHit("Water Ammunition", {
        number: 2, denomination: 6, type: "piercing",
        condition: "On a hit with water ammunition; 3d6 if the target is made of fire",
      }),
      QuiverOfElementalChaos.onHit("Ice Ammunition", {
        number: 3, denomination: 6, type: "cold",
        condition: "On a hit with ice ammunition",
      }),
      QuiverOfElementalChaos.onImpact("Ice Ammunition: Paralysis", {
        ability: "con",
        condition: "On a hit with ice ammunition; cold resistance or immunity succeeds automatically",
      }),
      QuiverOfElementalChaos.onHit("Magma Ammunition", {
        number: 3, denomination: 6, type: "fire",
        condition: "On a hit with magma ammunition",
      }),
      QuiverOfElementalChaos.onImpact("Magma Ammunition: Searing Heat", {
        ability: "con",
        condition: "Hit or miss with magma ammunition; fire resistance or immunity succeeds automatically",
        template: { type: "sphere", size: "10" },
      }),
      QuiverOfElementalChaos.onImpact("Ooze Ammunition: Grease", {
        ability: "dex",
        condition: "On impact with ooze ammunition",
        template: { type: "square", size: "20" },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ice Ammunition: Paralyzed",
        activityMatch: "Ice Ammunition: Paralysis",
        statuses: ["Paralyzed"],
        options: {
          // an item effect defaults to transferring to the wearer, and a transferred effect
          // is never linked into an activity
          transfer: false,
          durationSeconds: 60,
          description: "A paralyzed target repeats the save at the end of each of its turns,"
            + " and the effect ends early if it takes fire damage.",
        },
      },
      {
        name: "Ice Ammunition: Slowed",
        activityMatch: "Ice Ammunition: Paralysis",
        onSave: true,
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0.5"),
        ],
        options: {
          transfer: false,
          expiry: "targetEnd",
          description: "On a successful save the target's speed is halved instead.",
        },
      },
    ];
  }

}
