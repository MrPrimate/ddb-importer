import { logger } from "../../../../lib/_module";
import Generic from "../Generic";

/**
 * Necromancer (Arcana Unleashed 2024). The necrotic resistance effect comes from the description
 * parser and is kept; Undead Vitality is DDB's action, healed by its own enricher. This adds the
 * Undead Familiar casts, summons that spend a level 1 slot and mirror the 2024 Find Familiar
 * spell: the normal forms with Undead offered as the familiar's creature type, and the special
 * Skeleton or Zombie forms. The spellbook entry itself is an ItemGrant advancement added by
 * DDBSubClass._wizardFixes. Extends Generic so the DDB action matching that builds Undead
 * Vitality still runs alongside the added casts.
 */
export default class NecromancySpellbook extends Generic {

  static SUMMON_ACTIVITY_NAME = "Cast Find Familiar (Undead Familiar)";

  // companions/types/FindFamiliar.ts lists the Skeleton and Zombie profiles for this name
  static UNDEAD_FORMS_ACTIVITY_NAME = "Cast Find Familiar (Skeleton or Zombie)";

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      this._familiarSummon(NecromancySpellbook.SUMMON_ACTIVITY_NAME),
      this._familiarSummon(NecromancySpellbook.UNDEAD_FORMS_ACTIVITY_NAME),
    ];
  }

  _familiarSummon(name: string): IDDBAdditionalActivity {
    return {
      init: {
        name,
        type: Generic.ACTIVITY_TYPES.SUMMON,
      },
      build: {
        generateActivation: true,
        generateConsumption: true,
        generateRange: true,
        generateTarget: true,
      },
      overrides: {
        activationType: "hour",
        activationValue: 1,
        rangeType: "ft",
        rangeValue: 10,
        noTemplate: true,
        noConsumeTargets: true,
        addSpellSlotConsume: true,
        spellSlotConsumeTarget: "1",
        spellSlotConsumeValue: "1",
        func: async ({ activity }) => {
          const parser = this.ddbParser;
          // the feature is not a summoning feature in DDB's terms, so the parser never built a
          // companion factory for it; the Find Familiar summon data lives behind that factory
          if (!("createCompanionFactory" in parser)) return;
          try {
            if (!parser.ddbCompanionFactory) parser.createCompanionFactory();
            await parser.ddbCompanionFactory.addCRSummoning(activity);
          } catch (err) {
            // a failed familiar lookup (no monster compendium, proxy down) should cost the
            // summon its profiles, not the feature its remaining activities and effects
            logger.warn("Unable to add Find Familiar summon data to Necromancy Spellbook", { err, activity });
          }
        },
      },
    };
  }

}
