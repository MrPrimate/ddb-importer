import DDBEnricherData from "../data/DDBEnricherData";
import DDBDescriptions from "../../lib/DDBDescriptions";
import * as DDBTemplateStrings from "../../lib/DDBTemplateStrings";

/**
 * How a familiar summon is paid for:
 * - `free`: Familiar Friend's own once per Long Rest cast, spending the feat's use;
 * - `slot`: a spell slot of level 1 or higher, the level picked in the use dialog;
 * - `ritual`: nothing, ten minutes longer;
 * - `imbued`: an imbued cast from a later feat, carrying both Familiar Friend's free cast and a slot
 *   so the player unticks whichever was not used (both for a ritual);
 * - `rider`: nothing, the copy an enchantment adds to the Find Familiar spell, which pays its own way.
 */
type TFamiliarCast = "free" | "slot" | "ritual" | "imbued" | "rider";

interface IFamiliarSummonOptions {
  /** 16 character activity id; several summons share a feature, so ids are explicit. */
  id: string;
  name: string;
  cast: TFamiliarCast;
  /** The feat's text describing the summon, for its card and the copy riding on Find Familiar. */
  description?: string;
}

/**
 * Shared shape for the Arcana Unleashed familiar feats. Each builds its own Find Familiar summons
 * rather than altering the spell: a 2024 CR 0 Beast whose creature type is Celestial, Fey or Fiend,
 * cast over an hour. Every AU familiar feat needs Familiar Friend, so every summon carries
 * Fortified Familiar's twice-your-level HP bonus. Feat imbuements ride on the summon as effects,
 * which dnd5e applies to the summoned creature.
 */
export default class _FamiliarFeat extends DDBEnricherData {

  static FORTIFIED_HP = "2 * @details.level";

  /** Familiar Friend's identifier, shared by its ability variants so other feats can spend its cast. */
  static FAMILIAR_FRIEND_IDENTIFIER = "familiar-friend";

  static familiarSummon({ id, name, cast, description }: IFamiliarSummonOptions): IDDBAdditionalActivity {
    const freeCast = cast === "free" || cast === "imbued";
    const slotCast = cast === "slot" || cast === "imbued";
    const ritual = cast === "ritual";

    return {
      id,
      init: {
        name,
        type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      },
      build: {
        generateSummon: true,
        generateActivation: true,
        generateConsumption: false,
        activationOverride: {
          type: ritual ? "minute" : "hour",
          value: ritual ? 70 : 1,
          condition: ritual ? "Cast as a Ritual" : "",
        },
      },
      overrides: {
        noTemplate: true,
        // cleared first so the deferred uses reconciliation cannot add the feat's uses back
        noConsumeTargets: true,
        addItemConsume: freeCast,
        itemConsumeTargetName: cast === "imbued" ? `feat:${_FamiliarFeat.FAMILIAR_FRIEND_IDENTIFIER}` : undefined,
        addSpellSlotConsume: slotCast,
        spellSlotConsumeTarget: "1",
        spellSlotConsumeValue: "1",
        addSpellSlotScalingMode: "level",
        addConsumptionScalingMax: slotCast ? "9" : undefined,
        data: {
          ..._FamiliarFeat.familiarSummonData(),
          ...(description ? { description: { value: description } } : {}),
        },
      },
    };
  }

  static familiarSummonData(): Record<string, any> {
    return {
      summon: {
        mode: "cr",
        prompt: true,
      },
      match: {
        disposition: true,
      },
      bonuses: {
        hp: _FamiliarFeat.FORTIFIED_HP,
      },
      creatureTypes: ["celestial", "fey", "fiend"],
      profiles: [
        { name: "CR 0 Beast", count: "1", cr: "0", types: ["beast"] },
      ],
    };
  }

  /**
   * The feat's text from the imbuement's label to the end, parsed. DDB labels the benefits listed
   * under the imbuement at the same emphasis as the imbuement itself, so its own section stops at
   * "the following benefits:".
   */
  imbuementDescription(label: string): string | undefined {
    const source = this.ddbParser?.ddbDefinition?.description;
    if (!source) return undefined;
    const normalized = DDBDescriptions.normalizeSectionLabel(label);
    const section = DDBDescriptions.sections(source).find((slice) => slice.label === normalized);
    if (!section) return undefined;
    const text = source.slice(section.start);
    const rawCharacter = this.ddbParser.rawCharacter;
    if (rawCharacter?.type !== "character") return text;
    return DDBTemplateStrings.parse(this.ddbParser.ddbData, rawCharacter, text, this.ddbParser.ddbFeature)?.text ?? text;
  }

  /** The 16 character activity id for one imbued summon, padded with zeros. */
  static imbuedId(idPrefix: string, damageType: string): string {
    return `${idPrefix}${damageType}`.padEnd(16, "0").slice(0, 16);
  }

  static imbuedName(prefix: string, damageType: string): string {
    return `${prefix} ${utilsTitle(damageType)} Familiar`;
  }

  /**
   * One imbued summon per damage type, each linked to an effect granting the familiar Resistance
   * to that type. `prefix` names both ("Otherworldly Necrotic Familiar"). The usable summons spend
   * Familiar Friend's free cast or a spell slot; a second, rider-only set with the same names is
   * what the enchant activity copies onto the Find Familiar spell. `description` is the feat's text
   * for the imbuement (see imbuementDescription); on the spell, a rider without its own text would
   * show Find Familiar's description instead.
   */
  static imbuedSummons(
    prefix: string, idPrefix: string, riderIdPrefix: string, damageTypes: string[], description?: string,
  ): IDDBAdditionalActivity[] {
    return damageTypes.flatMap((damageType) => [
      _FamiliarFeat.familiarSummon({
        id: _FamiliarFeat.imbuedId(idPrefix, damageType),
        name: _FamiliarFeat.imbuedName(prefix, damageType),
        cast: "imbued",
        description,
      }),
      _FamiliarFeat.familiarSummon({
        id: _FamiliarFeat.imbuedId(riderIdPrefix, damageType),
        name: _FamiliarFeat.imbuedName(prefix, damageType),
        cast: "rider",
        description,
      }),
    ]);
  }

  /**
   * The enchant activity, following the official implementation: enchanting the Find Familiar spell
   * adds the rider summons to it, so the spell's own slot or free cast pays for the imbued summon.
   */
  static imbueEnchantActivity(name: string): IDDBAdditionalActivity {
    return {
      init: {
        name,
        type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
      },
      build: {
        generateTarget: true,
        generateActivation: true,
        generateConsumption: false,
        activationOverride: {
          type: "special",
          condition: "Enchant your Find Familiar spell",
        },
        targetOverride: {
          affects: {
            type: "object",
          },
        },
      },
      overrides: {
        noConsumeTargets: true,
        noTemplate: true,
        data: {
          restrictions: {
            type: "spell",
            allowMagical: true,
          },
        },
      },
    };
  }

  static imbueEnchantEffect(name: string, effectId: string, riderIdPrefix: string, damageTypes: string[]): IDDBEffectHint {
    return {
      type: "enchant",
      name,
      activityMatch: name,
      options: {
        durationSeconds: null,
        expiry: null,
        description: "Adds the imbued Find Familiar summons to this spell.",
      },
      data: {
        _id: effectId,
        flags: {
          ddbimporter: {
            activityRiders: damageTypes.map((damageType) => _FamiliarFeat.imbuedId(riderIdPrefix, damageType)),
            effectRiders: [],
          },
        },
      },
    };
  }

  static imbuedEffects(prefix: string, damageTypes: string[], description: string): IDDBEffectHint[] {
    return damageTypes.map((damageType) => {
      const title = utilsTitle(damageType);
      return {
        name: `${prefix} Familiar: ${title} Resistance`,
        // links both the usable summon and its rider copy, which share the name
        activityMatch: _FamiliarFeat.imbuedName(prefix, damageType),
        options: {
          durationSeconds: null,
          description: `${description} Resistance to ${title} damage.`,
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange(damageType),
        ],
      };
    });
  }

  /** The secret "Implementation Details" section explaining how the imbued summons are paid for. */
  static imbuedImplementationDetails(featName: string, enchantName: string): string {
    const slug = featName.replace(/[^a-zA-Z]/g, "");
    return `
<section class="secret ddbSecret" id="secret-ddb${slug}">
<p><strong>Implementation Details</strong></p>
<p>Each imbued summon on this feat spends both Familiar Friend's free cast and a spell slot by default. In the use dialog, untick whichever you are not using, or untick both when casting Find Familiar as a Ritual.</p>
<p>Alternatively, use ${enchantName} to enchant your Find Familiar spell, which adds the imbued summons to the spell so it pays for them itself.</p>
</section>`;
  }

}

function utilsTitle(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
