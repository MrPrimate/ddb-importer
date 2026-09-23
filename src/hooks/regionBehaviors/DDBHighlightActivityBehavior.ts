import {
  REGION_HIGHLIGHT_LIMITS,
  REGION_HIGHLIGHT_PATTERN_LABELS,
  REGION_HIGHLIGHT_PATTERNS,
} from "../../config/regionHighlightProfiles";
import { createProfilePicker } from "../canvas/regionHighlightPicker";
import BaseActivityBehavior from "./baseActivityBehavior";

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

  override customizeField(field: { name: string }, data: Record<string, unknown>) {
    if (field.name === "profile") {
      data.input = (_field: unknown, config: { name: string; value?: unknown }) =>
        createProfilePicker({
          name: config.name,
          value: config.value,
          blank: game.i18n.localize("ddb-importer.behaviors.highlight.noProfile"),
        });
    } else if (field.name === "pattern") {
      data.options = [
        { value: "", label: game.i18n.localize("ddb-importer.behaviors.highlight.profileDefault") },
        ...REGION_HIGHLIGHT_PATTERNS.map((value) => ({ value, label: REGION_HIGHLIGHT_PATTERN_LABELS[value] })),
      ];
    } else if (field.name === "dashed") {
      data.options = [
        { value: "", label: game.i18n.localize("ddb-importer.behaviors.highlight.profileDefault") },
        { value: "dashed", label: game.i18n.localize("ddb-importer.behaviors.highlight.dashed") },
        { value: "continuous", label: game.i18n.localize("ddb-importer.behaviors.highlight.continuous") },
      ];
    } else if (field.name === "border") {
      data.options = [
        { value: "", label: game.i18n.localize("ddb-importer.behaviors.highlight.profileDefault") },
        { value: "border", label: game.i18n.localize("ddb-importer.behaviors.highlight.border") },
        { value: "none", label: game.i18n.localize("ddb-importer.behaviors.highlight.noBorder") },
      ];
    }
  }
}
