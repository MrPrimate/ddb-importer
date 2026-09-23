import { REGION_HIGHLIGHT_LIMITS } from "../../config/regionHighlightProfiles";
import {
  behaviorConfigFromFlag,
  buildHighlightSummaryRow,
  flagFromBehaviorConfig,
  REGION_HIGHLIGHT_FALLBACK_COLOR,
  REGION_HIGHLIGHT_FLAG_KEYS,
  REGION_HIGHLIGHT_NUMERIC_OVERRIDES,
} from "../canvas/regionHighlightSummary";
import BaseActivityBehavior from "./baseActivityBehavior";

/** The class the delegated click handler looks for (hooks/canvas/regionHighlightBehaviorConfigure.ts). */
const CONFIGURE_CLASS = "ddbi-highlight-behavior-configure";

const { ColorField, NumberField, StringField } = foundry.data.fields;

/**
 * Activity behavior that only carries an appearance: which region highlight profile the
 * regions this activity places should use, with optional per-activity overrides. It
 * creates no RegionBehavior; the placement hook copies the choice onto the region flag
 * (see hooks/canvas/regionHighlightStamp.ts) before the region exists.
 */
export default class DDBHighlightActivityBehavior extends BaseActivityBehavior {
  static override LOCALIZATION_PREFIXES = ["ddb-importer.behaviors.highlight"];

  static override defineSchema() {
    const optional = (key: keyof typeof REGION_HIGHLIGHT_LIMITS) =>
      new NumberField({ required: false, nullable: true, initial: null, ...REGION_HIGHLIGHT_LIMITS[key] });
    return {
      profile: new StringField({ required: true, blank: true, initial: "" }),
      pattern: new StringField({ required: false, blank: true, initial: "" }),
      opacity: optional("opacity"),
      gapOpacity: optional("gapOpacity"),
      borderOpacity: optional("borderOpacity"),
      spacing: optional("spacing"),
      thickness: optional("thickness"),
      edgeWidth: optional("edgeWidth"),
      dashed: new StringField({ required: false, blank: true, initial: "" }),
      dashLength: optional("dashLength"),
      angle: optional("angle"),
      border: new StringField({ required: false, blank: true, initial: "" }),
      borderWidth: optional("borderWidth"),
      color: new ColorField({ required: false, nullable: true, initial: null }),
    };
  }

  /** Appearance only: nothing to run on the region. */
  override createBehaviorData(_activity: unknown, _options: { token?: unknown } = {}): false {
    return false;
  }

  /**
   * The whole config renders as one row on the `profile` field: a swatch, the summary and a
   * Configure button that opens the region texture editor. dnd5e rebuilds the behaviors
   * array from the sheet's form on every submit, so every other field rides along as a
   * hidden input (blank numbers read back as null through `data-dtype`), and the editor
   * writes the activity itself.
   */
  override customizeField(field: { name: string }, data: Record<string, unknown>): false | void {
    if (field.name !== "profile") return false;
    const source = this as unknown as Record<string, unknown>;
    data.input = (_field: unknown, config: { name: string; value?: unknown }) => {
      const prefix = config.name.slice(0, -"profile".length);
      const stored = behaviorConfigFromFlag(flagFromBehaviorConfig(source));
      stored.profile = typeof config.value === "string" ? config.value : stored.profile;
      const wrapper = document.createElement("div");
      wrapper.classList.add("ddbi-highlight-behavior");
      const userColor =
        typeof game.user?.color === "string" && game.user.color
          ? String(game.user.color)
          : REGION_HIGHLIGHT_FALLBACK_COLOR;
      wrapper.append(
        buildHighlightSummaryRow({
          flag: flagFromBehaviorConfig(stored),
          color: userColor,
          buttonClass: CONFIGURE_CLASS,
        }),
      );
      const numeric = new Set<string>(REGION_HIGHLIGHT_NUMERIC_OVERRIDES.map((entry) => entry.key));
      for (const key of REGION_HIGHLIGHT_FLAG_KEYS) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = `${prefix}${key}`;
        // the attribute, not the property: the sheet serialises this element to HTML
        const value = stored[key];
        input.setAttribute("value", value === null || value === undefined ? "" : String(value));
        if (numeric.has(key)) input.dataset.dtype = "Number";
        wrapper.append(input);
      }
      return wrapper;
    };
  }
}
