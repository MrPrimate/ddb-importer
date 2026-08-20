import { DICTIONARY } from "../../config/_module";
import logger from "../../lib/Logger";

// result of getDDBSpellLookup; `data` is the matched DDB entry (trait, feat, class,
// class option or inventory item) typed structurally for what call sites read
export interface IDDBSpellLookup {
  id: number;
  name: string;
  classId?: number;
  componentId?: number | null;
  limitedUse?: unknown;
  equipped?: boolean;
  isAttuned?: boolean;
  canAttune?: boolean;
  canEquip?: boolean;
  data?: {
    name?: string;
    definition?: { id?: number; name?: string; description?: string | null };
  };
}

/**
 * Pure spell data helpers shared by the spell parsers and DDBEnricherData.
 *
 * This module must stay a leaf (no parser class imports)
 */
export default class SpellDataUtils {

  static getDDBSpellLookup(ddb: IDDBData, type: string, id: number | null): IDDBSpellLookup | undefined {
    let lookup: IDDBSpellLookup | undefined;

    switch (type) {
      case "race": {
        let match = ddb.character.race.racialTraits.find((t) => {
          return t.definition.id === id;
        });
        // id may be a race *option* id (e.g. an ASI choice) attached to a trait,
        // not the trait id itself. Resolve option.definition.id -> option.componentId -> trait.
        if (!match) {
          const option = (ddb.character.options?.race ?? []).find((o) => o.definition.id === id);
          if (option) {
            match = ddb.character.race.racialTraits.find((t) => t.definition.id === option.componentId);
          }
        }
        if (match) {
          lookup = {
            id: match.definition.id,
            name: match.definition.name,
            data: match,
          };
        }
        break;
      }
      case "feat": {
        const match = ddb.character.feats.find((f) => {
          return f.definition.id === id;
        });
        if (match) {
          lookup = {
            id: match.definition.id,
            name: match.definition.name,
            componentId: match.componentId,
            data: match,
          };
        }
        break;
      }
      case "class": {
        const match1 = ddb.character.classes.find((c) => {
          return c.definition.id === id;
        });
        if (match1) {
          lookup = {
            id: match1.definition.id,
            name: match1.definition.name,
            data: match1,
          };
          break;
        }
        const match2 = ddb.character.classes.find((c) => {
          return c.subclassDefinition && c.subclassDefinition.id === id;
        });
        if (match2?.subclassDefinition) {
          lookup = {
            id: match2.subclassDefinition.id,
            name: match2.subclassDefinition.name,
            data: match2.subclassDefinition,
          };
          break;
        }
        break;
      }
      case "classFeature": {
        for (const c of ddb.character.classes) {
          if (c.subclassDefinition && c.subclassDefinition.id === id) {
            for (const option of ddb.classOptions) {

              if (option.classId === c.subclassDefinition.id) {
                lookup = {
                  id: option.id,
                  name: option.name,
                  classId: c.subclassDefinition.id,
                  data: option,
                };
                break;
              }
            }
          }
          if (lookup) break;

          const match1 = c.classFeatures.find((f) => {
            return f.definition.id === id;
          });
          if (match1) {
            lookup = {
              id: match1.definition.id,
              name: match1.definition.name,
              classId: match1.definition.classId,
              componentId: match1.definition.componentId,
              data: match1,
            };
            break;
          }

          for (const option of ddb.classOptions) {
            if (option.classId === c.definition.id && option.id === id) {
              lookup = {
                id: option.id,
                name: option.name,
                classId: c.definition.id,
                data: option,
              };
              break;
            }
          }
        }
        if (lookup) break;
        const optionMatch = ddb.character.options.class?.find((o) => {
          return o.definition.id === id;
        });
        if (optionMatch) {
          lookup = {
            id: optionMatch.definition.id,
            name: optionMatch.definition.name,
            componentId: optionMatch.componentId,
            data: optionMatch,
          };
        }
        break;
      }
      case "item": {
        const match = ddb.character.inventory.find((i) => {
          return i.definition.id === id;
        });
        if (match) {
          lookup = {
            id: match.definition.id,
            name: match.definition.name,
            limitedUse: match.limitedUse,
            equipped: match.equipped,
            isAttuned: match.isAttuned,
            canAttune: match.definition.canAttune,
            canEquip: match.definition.canEquip,
            data: match,
          };
        }
        break;
      }
      // no default
    }

    return lookup;
  }

  static getUses(limitedUse: IDDBSpellLimitedUse | null | undefined): I5eSystemLimitedUses {
    let uses: I5eSystemLimitedUses = {
      spent: null,
      max: "",
      recovery: [],
    };

    if (!limitedUse) return uses;
    const resetType = DICTIONARY.resets.find((reset) => reset.id == limitedUse.resetType);
    if (!resetType) {
      logger.warn("Unknown reset type", {
        resetType: limitedUse.resetType,
        limitedUse,
      });
      return uses;
    }

    if (limitedUse.maxUses || limitedUse.statModifierUsesId || limitedUse.useProficiencyBonus) {
      let maxUses = (limitedUse.maxUses && limitedUse.maxUses !== -1) ? limitedUse.maxUses : "";

      if (limitedUse.statModifierUsesId) {
        const ability = DICTIONARY.actor.abilities.find(
          (ability) => ability.id === limitedUse.statModifierUsesId,
        );

        if (!ability) {
          logger.warn("Unknown stat modifier uses id for spell uses", {
            statModifierUsesId: limitedUse.statModifierUsesId,
            limitedUse,
          });
        } else {
          switch (limitedUse.operator) {
            case 2: {
              maxUses = `${maxUses} * @abilities.${ability.value}.mod`;
              break;
            }
            case 1:
            default:
              maxUses = `${maxUses} + @abilities.${ability.value}.mod`;
          }
        }
      }

      if (limitedUse.useProficiencyBonus) {
        switch (limitedUse.proficiencyBonusOperator) {
          case 2: {
            maxUses = `${maxUses} * @prof`;
            break;
          }
          case 1:
          default:
            maxUses = `${maxUses} + @prof`;
        }
      }

      maxUses = maxUses.toString().trim().replace(/^\+/, "").trim();

      const finalMaxUses = (maxUses !== "") ? maxUses : null;

      uses = {
        spent: limitedUse.numberUsed ?? null,
        max: `${finalMaxUses}`,
        recovery: resetType && !["charges", ""].includes(resetType.value)
          ? [{
            period: resetType.value as TLimitedUsePeriod,
            type: "recoverAll",
          }]
          : [],
      };

      return uses;
    }

    return uses;
  }

}
