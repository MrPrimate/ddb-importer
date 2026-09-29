import { CompendiumHelper, logger } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";

/**
 * AU 2024. Beast Transformation shape-shifts the wearer's familiar into the gem's Beast for 10
 * minutes, keeping its creature type and Hit Points and gaining the Beast's HP as temporary HP.
 * The Beast is named in DDB's variant ("Necklace of the Beastly Familiar (Mammoth)") and linked
 * from the monster compendium on import, so it must have been munched; the unnamed base item
 * leaves the form to pick. The Find Familiar cast is DDB's item spell and stays as it is.
 */
export default class NecklaceOfTheBeastlyFamiliar extends DDBEnricherData {

  static TRANSFORM_ID = "ddbBeastlyFamTr1";

  /** The Beast named in the variant, if any. */
  get beastName(): string | null {
    return this.name.match(/\(([^)]+)\)/)?.[1]?.trim() ?? null;
  }

  // DDB's own activity is the Magic action for this transformation
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TRANSFORM;
  }

  override get activity(): IDDBActivityData {
    return {
      id: NecklaceOfTheBeastlyFamiliar.TRANSFORM_ID,
      name: "Beast Transformation",
      activationType: "action",
      activationCondition: "Your familiar is within 60 feet",
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 60,
      noTemplate: true,
      noConsumeTargets: true,
      data: {
        duration: { value: "10", units: "minute", concentration: false },
        transform: {
          customize: true,
          mode: "",
          preset: "polymorph",
        },
        settings: {
          effects: ["origin", "otherOrigin", "spell"],
          keep: ["bio", "type", "hp"],
          tempFormula: "@source.attributes.hp.max",
          preset: "polymorph",
          transformTokens: true,
        },
        profiles: [],
      },
    };
  }

  override async cleanup(): Promise<void> {
    const beast = this.beastName;
    if (!beast) return;
    const activities = (this.data?.system?.activities ?? {}) as Record<string, I5eActivity>;
    const transform = Object.values(activities).find((a): a is I5eTransformActivity => a.type === "transform");
    if (!transform) return;

    // no configured monster compendium (e.g. the audit harness): the form cannot be linked
    const pack = CompendiumHelper.getCompendiumType("monster", false);
    if (!pack) return;
    await pack.getIndex({ fields: ["name", "system.source.rules"] });
    const entry = pack.index.find((i) => i.name === beast
      && foundry.utils.getProperty(i, "system.source.rules") === "2024");
    if (!entry) {
      logger.warn(`${this.name}: no 2024 ${beast} in the monster compendium; munch it and re-import to link the Beast Transformation form`);
      return;
    }
    transform.profiles = [{
      _id: foundry.utils.randomID(),
      name: beast,
      uuid: entry.uuid,
      cr: "",
      level: { min: null, max: null },
      sizes: [],
      types: [],
      movement: [],
    }];
  }

}
