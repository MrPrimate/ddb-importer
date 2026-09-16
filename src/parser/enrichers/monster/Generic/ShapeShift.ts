import DDBEnricherData from "../../data/DDBEnricherData";

const SPEED_KEYS: Record<string, string> = {
  speed: "walk",
  walk: "walk",
  fly: "fly",
  climb: "climb",
  swim: "swim",
  burrow: "burrow",
};

/**
 * Monster Shape-Shift actions (Imp, Quasit, Vampire, were-creatures, Yuan-ti...). Always a
 * utility so the action exists on the sheet; where the text lists a form's speeds in
 * parentheses ("a bat (Speed 10 ft., Fly 40 ft.)") each form becomes an applied effect that
 * overrides those speeds. Forms described only by size or type carry no effect: DDB's movement
 * data has no per-form entries, so "(bear form only)" speeds are not available here.
 */
export default class ShapeShift extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Change Form",
      targetType: "self",
      rangeSelf: true,
    };
  }

  /** Forms named in the text with a parenthetical speed list, e.g. "a bat (Speed 10 ft., Fly 40 ft.)". */
  _speedForms(): { name: string; speeds: Record<string, number> }[] {
    const text = (foundry.utils.getProperty(this, "ddbParser.strippedHtml") as string | undefined) ?? "";
    const forms: { name: string; speeds: Record<string, number> }[] = [];
    const formRegex = /(?:a|an|the)?\s?(?:Tiny|Small|Medium|Large|Huge)?\s?([\w-]+(?: of [\w-]+)?) \(([^)]*\d+ ft\.[^)]*)\)/gi;
    for (const match of text.matchAll(formRegex)) {
      const speeds: Record<string, number> = {};
      // a bare "40 ft." first entry is the walking speed; named entries may read "Fly Speed 30 ft."
      const entryRegex = /(?:(Speed|Walk|Fly|Climb|Swim|Burrow)(?: Speed)? )?(\d+) ft\./gi;
      for (const entry of match[2].matchAll(entryRegex)) {
        const key = SPEED_KEYS[(entry[1] ?? "walk").toLowerCase()];
        if (key) speeds[key] = Number(entry[2]);
      }
      if (Object.keys(speeds).length === 0) continue;
      forms.push({ name: match[1].trim(), speeds });
    }
    return forms;
  }

  override get effects(): IDDBEffectHint[] {
    const title = (name: string) => name.split(" ").map((w) => (w === "of" ? w : `${w.charAt(0).toUpperCase()}${w.slice(1)}`)).join(" ");
    return this._speedForms().map((form) => ({
      name: `${title(form.name)} Form`,
      changes: Object.entries(form.speeds).map(([type, value]) =>
        DDBEnricherData.ChangeHelper.overrideChange(String(value), 20, `system.attributes.movement.speeds.${type}`),
      ),
    }));
  }

}
