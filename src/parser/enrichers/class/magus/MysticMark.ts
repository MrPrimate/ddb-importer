import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Magus level 2. A Bonus Action and a spell slot store a prepared spell and grant Aegis
 * (Resistance to the chosen damage type) or Enspell (weapon and Unarmed Strike damage may use the
 * chosen type) for an hour.
 *
 * "Activate" is a self enchantment: while it is on, the item is renamed "(Active)", the activity
 * reads "Deactivate", and the Aegis, Enspell, Store Spell and Release Spell activities ride onto
 * the item. Outside the mark those riders stay hidden. Aegis applies a resistance effect per damage
 * type; Enspell enchants a weapon (or the Unarmed Strike) so its damage can take the chosen type,
 * plus 1d6 of that type from Sigil Surge (level 11). The Aegis temporary Hit Points of Sigil Surge
 * live on the Sigil Surge activity. Store Spell and Release Spell keep the stored spell (see
 * macroActivity).
 */
export default class MysticMark extends DDBEnricherData {

  static ACTIVATE_ID = "ddbMysticMarkAct";

  static AEGIS_ID = "ddbMysticMarkAeg";

  static ENSPELL_ID = "ddbMysticMarkEns";

  static STORE_ID = "ddbMysticMarkSto";

  static RELEASE_ID = "ddbMysticMarkRel";

  static label(type: string): string {
    return `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
  }

  /** Slot spending shared by Aegis and Enspell: the slot is the stored spell's level or higher. */
  static slotConsumption(): IDDBActivityData {
    return {
      noConsumeTargets: true,
      addSpellSlotConsume: true,
      spellSlotConsumeTarget: "1",
      spellSlotConsumeValue: "1",
      addSpellSlotScalingMode: "level",
      addConsumptionScalingMax: "5",
      activationType: "special",
      activationCondition: "Part of the Bonus Action that activates Mystic Mark; expend a spell slot of the stored spell's level or higher",
      data: {
        duration: { value: "1", units: "hour" },
      },
    };
  }

  get hasSigilSurge(): boolean {
    return this.hasClassFeature({ featureName: "Sigil Surge", className: "Magus" });
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Activate",
      id: MysticMark.ACTIVATE_ID,
      activationType: "bonus",
      targetType: "self",
      rangeSelf: true,
      noConsumeTargets: true,
      data: {
        enchant: {
          self: true,
        },
        duration: { value: "1", units: "hour" },
      },
    };
  }

  /**
   * The stored spell lives in the ddb.generic.mysticMark macro: "store" records a prepared Magus
   * spell and the slot level the Aegis or Enspell activity spent, "release" casts it at that level
   * without a slot and ends the mark.
   */
  static macroActivity(name: string, id: string, action: "store" | "release", activation: I5eActivityActivation): IDDBAdditionalActivity {
    return {
      init: {
        name,
        id,
        type: DDBEnricherData.ACTIVITY_TYPES.DDBMACRO,
      },
      build: {
        generateActivation: true,
        generateConsumption: true,
        generateRange: true,
        generateTarget: true,
        generateDDBMacro: true,
        activationOverride: activation,
        consumptionOverride: { targets: [], scaling: { allowed: false, max: "" } },
        targetOverride: { affects: { type: "self" } },
        rangeOverride: { units: "self" },
        ddbMacroOverride: {
          name,
          function: "ddb.generic.mysticMark",
          visible: false,
          parameters: JSON.stringify({ action, flag: "mystic-mark", classIdentifier: "magus" }),
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Mystic Mark: Aegis",
          id: MysticMark.AEGIS_ID,
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
        },
        overrides: {
          ...MysticMark.slotConsumption(),
          targetType: "self",
          rangeSelf: true,
        },
      },
      {
        init: {
          name: "Mystic Mark: Enspell",
          id: MysticMark.ENSPELL_ID,
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateDuration: true,
          generateDamage: false,
        },
        overrides: {
          ...MysticMark.slotConsumption(),
          data: {
            ...MysticMark.slotConsumption().data,
            restrictions: {
              type: "weapon",
              allowMagical: true,
            },
          },
        },
      },
      MysticMark.macroActivity("Store Spell", MysticMark.STORE_ID, "store", {
        type: "special",
        value: null,
        condition: "After using Mystic Mark: Aegis or Enspell, record the stored spell and the slot level spent",
      }),
      MysticMark.macroActivity("Release Spell", MysticMark.RELEASE_ID, "release", {
        type: "bonus",
        value: 1,
        condition: "Casts the stored spell and ends the mark",
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const types = DDBEnricherData.allDamageTypes();
    const mark: IDDBEffectHint = {
      name: "Mystic Mark",
      type: "enchant",
      activityMatch: "Activate",
      options: {
        durationSeconds: 3600,
      },
      data: {
        flags: {
          ddbimporter: {
            activityRiders: [MysticMark.AEGIS_ID, MysticMark.ENSPELL_ID, MysticMark.STORE_ID, MysticMark.RELEASE_ID],
            effectRiders: [],
          },
        },
      },
      changes: [
        DDBEnricherData.ChangeHelper.overrideChange("{} (Active)", 20, "name"),
        DDBEnricherData.ChangeHelper.overrideChange("Deactivate", 20, `system.activities.${MysticMark.ACTIVATE_ID}.name`),
      ],
    };
    const aegis: IDDBEffectHint[] = types.map((type) => ({
      name: `Aegis (${MysticMark.label(type)})`,
      activityMatch: "Mystic Mark: Aegis",
      options: {
        durationSeconds: 3600,
        description: this.hasSigilSurge
          ? "At the start of each of your turns, gain Temporary Hit Points equal to the expended spell slot level plus your Intelligence modifier (Sigil Surge)."
          : undefined,
      },
      changes: [
        DDBEnricherData.ChangeHelper.damageResistanceChange(type),
      ],
    }));
    const enspell: IDDBEffectHint[] = types.map((type) => ({
      name: `Enspell (${MysticMark.label(type)})`,
      type: "enchant",
      activityMatch: "Mystic Mark: Enspell",
      options: {
        durationSeconds: 3600,
        description: `This weapon's damage can be ${MysticMark.label(type)} instead of its normal type${this.hasSigilSurge ? `, and it deals an extra 1d6 ${MysticMark.label(type)} damage (Sigil Surge)` : ""}.`,
      },
      changes: [
        DDBEnricherData.ChangeHelper.overrideChange(`{} (Enspell: ${MysticMark.label(type)})`, 20, "name"),
        DDBEnricherData.ChangeHelper.unsignedAddChange(type, 20, "system.damage.base.types"),
        DDBEnricherData.ChangeHelper.unsignedAddChange(type, 20, "system.damage.versatile.types"),
        ...(this.hasSigilSurge
          ? [
            DDBEnricherData.ChangeHelper.unsignedAddChange(
              JSON.stringify({ number: 1, denomination: 6, types: [type] }),
              20,
              "activities[attack].damage.parts",
            ),
          ]
          : []),
      ],
    }));
    return [mark, ...aegis, ...enspell];
  }

}
