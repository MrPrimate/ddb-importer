import AutoEffects from "../../enrichers/effects/AutoEffects";
import ChangeHelper from "../../enrichers/effects/ChangeHelper";

const TRUE_FORM_EFFECT = "True Form";

/** "Wolf Form" -> "wolf", "Cloud of Mist Form" -> "cloud of mist". */
function formKey(effectName: string): string {
  return effectName.replace(/ Form$/i, "").trim().toLowerCase();
}

/** The forms an item name restricts it to: "Bite (Wolf or Hybrid Form Only)" -> ["wolf", "hybrid"]. */
function restrictedForms(itemName: string): string[] {
  const match = itemName.match(/\(([^)]*?) Forms? Only\)/i);
  if (!match) return [];
  return match[1]
    .split(/\s*,\s*|\s+or\s+|\s+and\s+/i)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 0);
}

/** "mist" names the "cloud of mist" form, "wolf" names "dire wolf". */
function namesForm(token: string, key: string): boolean {
  return token === key || key.split(" ").includes(token) || token.split(" ").includes(key);
}

/**
 * Hide a shape-shifter's form-restricted items ("Bite (Wolf or Hybrid Form Only)") outside their
 * forms. Runs over the finished item list because a Shape-Shift action is parsed before most of
 * the items it restricts exist. A restriction naming none of the transform's forms (humanoid,
 * vampire, yuan-ti...) is the true form.
 *
 * An item usable in the true form is hidden by each form that cannot use it. An item with no
 * true-form use is hidden by a transferred "True Form" effect, which is never linked as a form so
 * it stays in place, and each form that can use the item reveals it at a higher priority. The
 * official lycanthropes instead list their transferred True Form as a form, which leaves its
 * hidden items hidden in the forms that should have them.
 */
export function applyShapeShiftFormItems(items: I5eMonsterItem[]): void {
  for (const shifter of items) {
    const activities = Object.values((foundry.utils.getProperty(shifter, "system.activities") ?? {}) as Record<string, IActivityData>);
    const transform = activities.find((activity) =>
      activity.type === "transform" && activity.transform?.mode === "form",
    );
    if (!transform) continue;

    const formIds = new Set((transform.effects ?? []).map((entry) => entry._id));
    const forms = (shifter.effects ?? []).filter((effect) => formIds.has(effect._id));
    if (forms.length === 0) continue;

    const trueFormHidden: string[] = [];
    for (const item of items) {
      const identifier = item.system?.identifier;
      const tokens = restrictedForms(item.name ?? "");
      if (!identifier || tokens.length === 0 || item === shifter) continue;

      const usableIn = forms.filter((form) => tokens.some((token) => namesForm(token, formKey(form.name ?? ""))));
      const usableInTrueForm = tokens.some((token) => !forms.some((form) => namesForm(token, formKey(form.name ?? ""))));

      if (usableInTrueForm) {
        for (const form of forms.filter((f) => !usableIn.includes(f))) {
          form.system ??= {};
          form.system.changes ??= [];
          form.system.changes.push(ChangeHelper.hiddenItemChange(identifier));
        }
      } else {
        trueFormHidden.push(identifier);
        for (const form of usableIn) {
          form.system ??= {};
          form.system.changes ??= [];
          form.system.changes.push(ChangeHelper.revealedItemChange(identifier));
        }
      }
    }

    if (trueFormHidden.length === 0) continue;
    const trueForm = AutoEffects.BaseEffect(shifter, TRUE_FORM_EFFECT, {
      transfer: true,
      durationSeconds: null,
      showIcon: 0,
      description: "Actions only available in another form are hidden.",
    });
    trueForm._id = foundry.utils.randomID();
    trueForm.system.changes = trueFormHidden.map((identifier) => ChangeHelper.hiddenItemChange(identifier));
    shifter.effects ??= [];
    shifter.effects.push(trueForm);
  }
}
