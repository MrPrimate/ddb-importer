import { REGION_DISPLAY_FIELDS, REGION_DISPLAY_I18N, REGION_DISPLAY_LIMITS } from "../../config/regionDisplayProfiles";
import {
  BEHAVIOR_CONFIGURE_CLASS,
  behaviorConfigFromFlag,
  buildDisplaySummaryRow,
  flagFromBehaviorConfig,
  REGION_DISPLAY_FLAG_KEYS,
  userPreviewColor,
} from "../canvas/regionDisplaySummary";
import BaseActivityBehavior from "./baseActivityBehavior";

const { ColorField, NumberField, StringField } = foundry.data.fields;

/**
 * Activity behavior that only carries a region display: which display profile the
 * regions this activity places should use, with optional per-activity overrides. It
 * creates no RegionBehavior; the placement hook copies the choice onto the region flag
 * (see hooks/canvas/regionDisplayStamp.ts) before the region exists.
 */
export default class DDBDisplayActivityBehavior extends BaseActivityBehavior {
  static override LOCALIZATION_PREFIXES = [REGION_DISPLAY_I18N];

  static override defineSchema() {
    // min and max only: a NumberField rounds to its step on clean, which would turn the
    // spacing for three symbols per square (0.3333) into 0.35
    const optional = (key: keyof typeof REGION_DISPLAY_LIMITS) => {
      const { min, max } = REGION_DISPLAY_LIMITS[key];
      return new NumberField({ required: false, nullable: true, initial: null, min, max });
    };
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
      crossRotation: optional("crossRotation"),
      crossLength: optional("crossLength"),
      waveAmplitude: optional("waveAmplitude"),
      waveLength: optional("waveLength"),
      offset: optional("offset"),
      border: new StringField({ required: false, blank: true, initial: "" }),
      borderWidth: optional("borderWidth"),
      color: new ColorField({ required: false, nullable: true, initial: null }),
    };
  }

  /** Display only: nothing to run on the region. */
  override createBehaviorData(_activity: unknown, _options: { token?: unknown } = {}): false {
    return false;
  }

  /**
   * The whole config renders as one row on the `profile` field: a swatch, the summary and a
   * Configure button that opens the region display editor. dnd5e rebuilds the behaviors
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
      wrapper.classList.add("ddbi-display-region-behavior");
      wrapper.append(
        buildDisplaySummaryRow({
          flag: flagFromBehaviorConfig(stored),
          color: userPreviewColor(),
          buttonClass: BEHAVIOR_CONFIGURE_CLASS,
        }),
      );
      const numeric = new Set<string>(REGION_DISPLAY_FIELDS.map((entry) => entry.key));
      for (const key of REGION_DISPLAY_FLAG_KEYS) {
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
