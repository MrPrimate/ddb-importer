import { logger } from "../../../../lib/_module";
import Generic from "../Generic";

/**
 * Necromancer (Arcana Unleashed 2024). The Undead Vitality utility and the necrotic resistance
 * effect come from the description parser and are kept. This adds the Undead Familiar cast: a
 * summon that spends a level 1 slot and mirrors the 2024 Find Familiar spell, with Undead offered
 * as the familiar's creature type. The spellbook entry itself is an ItemGrant advancement added
 * by DDBSubClass._wizardFixes. Extends Generic so the DDB action matching that builds Undead
 * Vitality still runs alongside the added cast.
 */
export default class NecromancySpellbook extends Generic {

  static SUMMON_ACTIVITY_NAME = "Cast Find Familiar (Undead Familiar)";

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: NecromancySpellbook.SUMMON_ACTIVITY_NAME,
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
      },
    ];
  }

}
