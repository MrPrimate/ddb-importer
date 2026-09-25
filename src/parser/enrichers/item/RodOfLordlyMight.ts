import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Rod of Lordly Might: a +3 magic mace, the three weapon buttons as attacks, and the Drain Life,
 * Paralyze and Terrify properties as saves that each recover separately at dawn.
 *
 * DDB types the rod as a rod, so it is stubbed as the SRD mace to become a real weapon: the
 * default attack is the mace, and dnd5e applies proficiency and the +3 itself. DDB's text makes
 * the parser give the whole rod a single once-per-dawn use that every activity spends, so the
 * item uses are cleared and each property carries its own.
 */
export default class RodOfLordlyMight extends DDBEnricherData {

  static ON_HIT = "When you hit a creature with a melee attack using the rod";

  static dawnUse(): I5eSystemLimitedUses {
    return {
      spent: 0,
      max: "1",
      recovery: [{ period: "dawn", type: "recoverAll" }],
    };
  }

  /**
   * A button's weapon form. dnd5e only adds the ability modifier and the rod's magical bonus to
   * a weapon's base damage, so the form's own damage writes them in. The attack roll already
   * carries the rod's proficiency and magical bonus; a form without the +3 (the flame tongue
   * blade) uses a flat bonus instead, which skips both, and adds the rod's own proficiency term
   * back (`@item.prof`, the mace's, as dnd5e has no per-activity base weapon).
   */
  static weaponForm({ name, number, denomination, damageType, magical, extraDamage = [] }: {
    name: string;
    number: number;
    denomination: number;
    damageType: string;
    magical: boolean;
    extraDamage?: I5eDamagePart[];
  }): IDDBAdditionalActivity {
    return {
      init: {
        name,
        type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
      },
      build: {
        generateAttack: true,
        generateDamage: true,
        generateActivation: true,
        generateConsumption: false,
        generateTarget: true,
        generateRange: true,
        activationOverride: { type: "action", value: 1, condition: "" },
        targetOverride: {
          affects: { count: "1", type: "creature", choice: false, special: "" },
        },
      },
      overrides: {
        noConsumeTargets: true,
        rangeType: "ft",
        rangeValue: 5,
        noeffect: true,
        data: {
          attack: {
            ...(magical ? {} : { flat: true, bonus: "@mod + @item.prof" }),
            type: { value: "melee", classification: "weapon" },
          },
          damage: {
            includeBase: false,
            parts: [
              DDBEnricherData.basicDamagePart({
                number,
                denomination,
                bonus: magical ? "@mod + @item.magicalBonus" : "@mod",
                types: [damageType],
              }),
              ...extraDamage,
            ],
          },
        },
      },
    };
  }

  override get documentStub(): IDDBDocumentStub {
    return {
      documentType: "weapon",
      parsingType: "weapon",
      replaceDefaultActivity: true,
      systemType: {
        value: "simpleM",
        baseItem: "mace",
      },
      copySRD: {
        name: "Mace",
        type: "weapon",
        uuid: "Compendium.dnd5e.items.Item.Ajyq6nGwF7FtLhDQ",
      },
    };
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Mace",
      noConsumeTargets: true,
      noeffect: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Drain Life",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          generateUses: true,
          includeBaseDamage: false,
          saveOverride: { ability: ["con"], dc: { calculation: "", formula: "17" } },
          activationOverride: { type: "special", value: null, condition: RodOfLordlyMight.ON_HIT },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 4, denomination: 6, types: ["necrotic"] })],
          onSave: "none",
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
          usesOverride: RodOfLordlyMight.dawnUse(),
        },
        overrides: {
          noConsumeTargets: true,
          addActivityConsume: true,
          rangeType: "ft",
          rangeValue: 5,
          noeffect: true,
          data: {
            description: {
              chatFlavor: "On a failed save you regain Hit Points equal to half the Necrotic damage dealt.",
            },
          },
        },
      },
      // the flame tongue blade is a plain magic longsword with the extra fire damage, not a +3 weapon
      RodOfLordlyMight.weaponForm({
        name: "Button 1: Flame Tongue",
        number: 1,
        denomination: 8,
        damageType: "slashing",
        magical: false,
        extraDamage: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["fire"] })],
      }),
      RodOfLordlyMight.weaponForm({
        name: "Button 2: Battleaxe",
        number: 1,
        denomination: 8,
        damageType: "slashing",
        magical: true,
      }),
      RodOfLordlyMight.weaponForm({
        name: "Button 3: Spear",
        number: 1,
        denomination: 6,
        damageType: "piercing",
        magical: true,
      }),
      {
        init: {
          name: "Paralyze",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          generateUses: true,
          // 2014 calls for a Strength save, the 2024 reprint a Constitution save
          saveOverride: { ability: [this.is2014 ? "str" : "con"], dc: { calculation: "", formula: "17" } },
          activationOverride: { type: "special", value: null, condition: RodOfLordlyMight.ON_HIT },
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
          usesOverride: RodOfLordlyMight.dawnUse(),
        },
        overrides: {
          noConsumeTargets: true,
          addActivityConsume: true,
          rangeType: "ft",
          rangeValue: 5,
        },
      },
      {
        init: {
          name: "Terrify",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          generateUses: true,
          saveOverride: { ability: ["wis"], dc: { calculation: "", formula: "17" } },
          activationOverride: { type: "action", value: 1, condition: "While holding the rod" },
          targetOverride: {
            template: { type: "radius", size: "30", width: "", units: "ft", count: "" },
            affects: { count: "", type: "creature", choice: false, special: "Each creature you can see" },
          },
          usesOverride: RodOfLordlyMight.dawnUse(),
        },
        overrides: {
          noConsumeTargets: true,
          addActivityConsume: true,
          rangeSelf: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Paralyzed",
        activityMatch: "Paralyze",
        statuses: ["Paralyzed"],
        options: {
          transfer: false,
          durationSeconds: 60,
        },
      },
      {
        name: "Frightened",
        activityMatch: "Terrify",
        statuses: ["Frightened"],
        options: {
          transfer: false,
          durationSeconds: 60,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      retainActivityUseSpent: true,
      data: {
        // the 2024 item carries a +3 magic bonus modifier, the 2014 one only says so in its text
        "system.magicalBonus": 3,
      },
      uses: {
        spent: 0,
        max: "",
        recovery: [],
      },
    };
  }

}
