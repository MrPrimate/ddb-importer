import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Agonizing Blast: an enchant rider adding the Charisma modifier to a cantrip's damage. In 2014
 * it always targets Eldritch Blast; the 2024 invocation is repeatable and DDB names each pick
 * after its cantrip ("Agonizing Blast (Eldritch Blast)"), so the target is read from the name.
 * The character importer's enchantment step applies it to that cantrip; the Eldritch Blast spell
 * enricher no longer bakes the bonus, so the enchantment is the only source of the damage.
 */
export default class EldritchInvocationsAgonizingBlast extends DDBEnricherData {

  static ACTIVITY_ID = "ddbAgonBlastEn01";

  static EFFECT_ID = "ddbAgonBlastEf01";

  /** The cantrip named in the 2024 pick, Eldritch Blast for the 2014 invocation. */
  get targetCantrip(): string {
    return this.name.match(/\(([^)]+)\)/)?.[1]?.trim() ?? "Eldritch Blast";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Make Agonizing",
      id: EldritchInvocationsAgonizingBlast.ACTIVITY_ID,
      activationType: "special",
      activationCondition: `Applied to ${this.targetCantrip} on import; apply to another warlock cantrip by hand`,
      targetType: "self",
      data: {
        restrictions: {
          type: "spell",
          allowMagical: true,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Agonizing Blast",
        type: "enchant",
        activityMatch: "Make Agonizing",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("{} [Agonizing]", 20, "name"),
          DDBEnricherData.ChangeHelper.addChange("@abilities.cha.mod", 20, "system.damage.bonus"),
        ],
        options: {
          description: "Agonizing Blast: add your Charisma modifier to the damage this cantrip deals on a hit.",
        },
        data: {
          _id: EldritchInvocationsAgonizingBlast.EFFECT_ID,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    const name = this.ddbParser.isMuncher
      ? this.name.split("(")[0].trim()
      : this.name;
    const flags: IDDBImporterFlags = this.ddbParser.isMuncher
      ? {}
      : {
        transferEnchantment: {
          targetItemName: this.targetCantrip,
          effectId: EldritchInvocationsAgonizingBlast.EFFECT_ID,
          activityId: EldritchInvocationsAgonizingBlast.ACTIVITY_ID,
        },
      };
    return {
      data: {
        name,
        "system.prerequisites.repeatable": true,
        flags: {
          ddbimporter: {
            originalName: name,
            ...flags,
          },
        },
      },
    };
  }

}
