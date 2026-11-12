import { DICTIONARY } from "../config/_module";
import { DDBItemImporter, logger } from "../lib/_module";

const SPELL_SLOT_KEYS = ["spell1", "spell2", "spell3", "spell4", "spell5", "spell6", "spell7", "spell8", "spell9", "pact"];

/** A literal maximum ("4") as a number, null for a formula or no maximum. */
function literalMax(max: unknown): number | null {
  const text = `${max ?? ""}`.trim();
  return (/^\d+$/).test(text) ? Number.parseInt(text) : null;
}

function spentNumber(spent: unknown): number {
  return typeof spent === "number" && Number.isFinite(spent) ? spent : 0;
}

/** "1/3 left (2 spent)" when the maximum is known, otherwise "2 spent". */
function usesLabel(spent: number, max: number | null): string {
  if (max === null || max <= 0) return `${spent} spent`;
  return `${Math.max(0, max - spent)}/${max} left (${spent} spent)`;
}

function hasUsesMax(max: unknown): boolean {
  return `${max ?? ""}`.trim() !== "";
}

/**
 * Compares the play state (spent uses, quantities, hit points and similar) of a character in
 * Foundry with the freshly parsed D&D Beyond data, and asks which side to keep for each
 * difference before a re-import writes anything.
 *
 * Row keys are what the importer reads the decisions back with:
 * - `item:<existing item id>:uses`, `item:<id>:activity:<parsed activity id>`, `item:<id>:quantity`
 * - `actor:hp`, `actor:hp-temp`, `actor:inspiration`, `actor:death`, `actor:hd:<class name>`, `actor:spell:<slot key>`
 *
 * A decision of true keeps the Foundry value.
 */
export default class PlayStateReview {

  /**
   * Rows for matched items whose spent uses, activity spent uses or quantity differ. Items or
   * fields an item's own retain flags already decide are left out: the dialog would have no
   * say over them.
   */
  static itemRows(pairs: IPlayStatePair[], defaults: IPlayStateRetainDefaults): IPlayStateRow[] {
    const rows: IPlayStateRow[] = [];

    for (const { item, existing } of pairs) {
      const existingId = (existing.id ?? existing._id) as string | undefined;
      if (!existingId) continue;
      const source = DDBItemImporter.sourceData(existing as unknown as TAll5eItemDocuments) as unknown as I5ePCItem;
      const existingFlags = (source.flags?.ddbimporter ?? {}) as IDDBImporterFlags;
      if (existingFlags.ignoreItemImport || item.flags?.ddbimporter?.ignoreItemImport) continue;
      if (existingFlags.ddbCustomAdded) continue;

      const group: IPlayStateRow["group"] = DICTIONARY.types.inventory.includes(item.type) ? "inventory" : "features";
      const flagValue = <T>(flag: string) =>
        DDBItemImporter.retainFlagValue<T>(existingFlags, item as unknown as TAll5eItemDocuments, flag);
      const parsedSystem = item.system as Record<string, any>;
      const existingSystem = source.system as Record<string, any>;

      // item uses: the prepared maximum on the live item shows what Foundry has now
      const liveMax = foundry.utils.getProperty(existing, "system.uses.max");
      if (parsedSystem.uses && existingSystem.uses && hasUsesMax(parsedSystem.uses.max)
        && typeof liveMax === "number" && liveMax > 0
        && !(flagValue<boolean>("retainUseSpent") ?? false)
      ) {
        const foundrySpent = spentNumber(existingSystem.uses.spent);
        const ddbSpent = spentNumber(parsedSystem.uses.spent);
        if (foundrySpent !== ddbSpent) {
          rows.push({
            key: `item:${existingId}:uses`,
            group,
            label: item.name,
            foundry: usesLabel(foundrySpent, liveMax),
            ddb: usesLabel(ddbSpent, literalMax(parsedSystem.uses.max)),
            keepFoundry: defaults.useSpent,
            remember: { item, flag: "retainUseSpent" },
          });
        }
      }

      // activity uses, matched by id and then by name as restoreActivityUseSpent does
      const activityFlag = flagValue<boolean | string[]>("retainActivityUseSpent");
      if (activityFlag !== true && parsedSystem.activities && existingSystem.activities) {
        const existingActivities = Object.values(existingSystem.activities as Record<string, any>);
        for (const activity of Object.values(parsedSystem.activities as Record<string, any>)) {
          if (!activity?.uses || !hasUsesMax(activity.uses.max)) continue;
          if (Array.isArray(activityFlag) && activityFlag.includes(activity.name ?? "")) continue;
          const original = existingSystem.activities[activity._id ?? ""]
            ?? existingActivities.find((candidate) => Boolean(activity.name) && candidate.name === activity.name);
          if (!original?.uses) continue;
          const foundrySpent = spentNumber(original.uses.spent);
          const ddbSpent = spentNumber(activity.uses.spent);
          if (foundrySpent === ddbSpent) continue;
          const liveActivityMax = (existing.system as unknown as IPreparedUsesHolder).activities
            ?.get?.(original._id)?.uses?.max;
          rows.push({
            key: `item:${existingId}:activity:${activity._id}`,
            group,
            label: `${item.name}: ${activity.name || "Activity"}`,
            foundry: usesLabel(foundrySpent, typeof liveActivityMax === "number" ? liveActivityMax : literalMax(original.uses.max)),
            ddb: usesLabel(ddbSpent, literalMax(activity.uses.max)),
            keepFoundry: defaults.activityUseSpent,
            remember: { item, flag: "retainActivityUseSpent", activityName: activity.name },
          });
        }
      }

      // quantity
      if ("quantity" in parsedSystem && "quantity" in existingSystem
        && !(flagValue<boolean>("retainQuantity") ?? false)
        && Number(parsedSystem.quantity ?? 0) !== Number(existingSystem.quantity ?? 0)
      ) {
        rows.push({
          key: `item:${existingId}:quantity`,
          group: "inventory",
          label: `${item.name} (quantity)`,
          foundry: `${existingSystem.quantity ?? 0}`,
          ddb: `${parsedSystem.quantity ?? 0}`,
          keepFoundry: defaults.quantity,
          remember: { item, flag: "retainQuantity" },
        });
      }
    }

    return rows;
  }

  /**
   * Rows for character-level play state. Fields whose update policy is off are already kept
   * from Foundry, so they are left out.
   */
  static actorRows({ parsed, classes, original, liveHP, policies }: IPlayStateActorInput): IPlayStateRow[] {
    const rows: IPlayStateRow[] = [];
    const parsedAttributes = parsed.system.attributes ?? {};
    const originalAttributes = original.system?.attributes ?? {};

    if (policies.hp && liveHP) {
      const flags = parsed.flags?.ddbimporter;
      const total = flags?.totalHP ?? 0;
      const removed = flags?.removedHitPoints ?? 0;
      const ddbTemp = parsedAttributes.hp?.temp ?? 0;
      const foundryDamage = Math.max(0, liveHP.max - liveHP.value);
      if (foundryDamage !== removed) {
        rows.push({
          key: "actor:hp",
          group: "actor",
          label: "Hit points (damage taken)",
          foundry: `${foundryDamage} damage (${liveHP.value}/${liveHP.max})`,
          ddb: `${removed} damage (${total - removed}/${total})`,
          keepFoundry: policies.keepHPDamage,
        });
      }
      if (liveHP.temp !== ddbTemp) {
        rows.push({
          key: "actor:hp-temp",
          group: "actor",
          label: "Temporary hit points",
          foundry: `${liveHP.temp}`,
          ddb: `${ddbTemp}`,
          keepFoundry: policies.keepHPTemp,
        });
      }
    }

    if (policies.inspiration && Boolean(originalAttributes.inspiration) !== Boolean(parsedAttributes.inspiration)) {
      rows.push({
        key: "actor:inspiration",
        group: "actor",
        label: "Inspiration",
        foundry: originalAttributes.inspiration ? "Yes" : "No",
        ddb: parsedAttributes.inspiration ? "Yes" : "No",
        keepFoundry: false,
      });
    }

    const foundryDeath = originalAttributes.death ?? {};
    const ddbDeath = parsedAttributes.death ?? {};
    if ((foundryDeath.success ?? 0) !== (ddbDeath.success ?? 0) || (foundryDeath.failure ?? 0) !== (ddbDeath.failure ?? 0)) {
      rows.push({
        key: "actor:death",
        group: "actor",
        label: "Death saves",
        foundry: `${foundryDeath.success ?? 0} successes, ${foundryDeath.failure ?? 0} failures`,
        ddb: `${ddbDeath.success ?? 0} successes, ${ddbDeath.failure ?? 0} failures`,
        keepFoundry: false,
      });
    }

    if (policies.hitDie) {
      for (const klass of classes) {
        if (klass.type !== "class") continue;
        const originalKlass = (original.items ?? []).find((item) => item.name === klass.name && item.type === "class") as I5eClassItem | undefined;
        const ddbSpent = spentNumber((klass as I5eClassItem).system.hd?.spent);
        const foundrySpent = spentNumber(originalKlass?.system?.hd?.spent);
        if (!originalKlass || ddbSpent === foundrySpent) continue;
        rows.push({
          key: `actor:hd:${klass.name}`,
          group: "actor",
          label: `${klass.name} hit dice`,
          foundry: `${foundrySpent} spent`,
          ddb: `${ddbSpent} spent`,
          keepFoundry: false,
        });
      }
    }

    if (policies.spellUse) {
      const parsedSpells = (parsed.system.spells ?? {}) as Record<string, { value?: number }>;
      const originalSpells = (original.system?.spells ?? {}) as Record<string, { value?: number }>;
      for (const slot of SPELL_SLOT_KEYS) {
        const ddbValue = parsedSpells[slot]?.value;
        const foundryValue = originalSpells[slot]?.value;
        if (typeof ddbValue !== "number" || typeof foundryValue !== "number" || ddbValue === foundryValue) continue;
        rows.push({
          key: `actor:spell:${slot}`,
          group: "actor",
          label: slot === "pact" ? "Pact slots" : `Level ${slot.replace("spell", "")} spell slots`,
          foundry: `${foundryValue} left`,
          ddb: `${ddbValue} left`,
          keepFoundry: false,
        });
      }
    }

    return rows;
  }

  /**
   * Shows the rows and waits for a choice. Resolves to the decisions keyed by row key (true
   * keeps Foundry) plus whether to remember item choices, or null when the import is cancelled.
   */
  static async prompt(rows: IPlayStateRow[], characterName: string): Promise<IPlayStateDialogResult | null> {
    const groups = [
      { label: "Character", rows: [] as (IPlayStateRow & { index: number })[] },
      { label: "Features", rows: [] as (IPlayStateRow & { index: number })[] },
      { label: "Inventory", rows: [] as (IPlayStateRow & { index: number })[] },
    ];
    rows.forEach((row, index) => {
      const group = row.group === "actor" ? groups[0] : row.group === "features" ? groups[1] : groups[2];
      group.rows.push({ ...row, index });
    });

    const content = await foundry.applications.handlebars.renderTemplate(
      "modules/ddb-importer/handlebars/character/import/play-state.hbs",
      { groups: groups.filter((group) => group.rows.length > 0), character: characterName },
    );

    const readForm = (form: HTMLFormElement | null): IPlayStateDialogResult => {
      const decisions: Record<string, boolean> = {};
      rows.forEach((row, index) => {
        const checked = form?.querySelector<HTMLInputElement>(`input[name="row-${index}"]:checked`);
        decisions[row.key] = checked ? checked.value === "foundry" : row.keepFoundry;
      });
      const remember = form?.querySelector<HTMLInputElement>("input[name=\"remember\"]")?.checked ?? false;
      return { decisions, remember };
    };

    const result = await foundry.applications.api.DialogV2.wait({
      window: { title: `Review play state for ${characterName}` },
      content,
      position: { width: 720 },
      classes: ["ddb-play-state-review"],
      buttons: [
        {
          action: "import",
          label: "Import",
          icon: "fas fa-file-import",
          default: true,
          callback: (_event: Event, button: HTMLButtonElement) => readForm(button.form),
        },
        {
          action: "cancel",
          label: "Cancel import",
          icon: "fas fa-times",
          callback: () => null,
        },
      ],
      render: (_event: Event, dialog: foundry.applications.api.DialogV2) => {
        const setAll = (value: "foundry" | "ddb") => {
          dialog.element.querySelectorAll<HTMLInputElement>(`input[type="radio"][value="${value}"]`)
            .forEach((input) => {
              input.checked = true;
            });
        };
        dialog.element.querySelector("[data-play-state=\"all-foundry\"]")
          ?.addEventListener("click", () => setAll("foundry"));
        dialog.element.querySelector("[data-play-state=\"all-ddb\"]")
          ?.addEventListener("click", () => setAll("ddb"));
      },
      rejectClose: false,
    });

    if (!result || typeof result !== "object") return null;
    return result as IPlayStateDialogResult;
  }

  /**
   * Writes the per-item retain flags for rows kept from Foundry onto the parsed items, so the
   * next import keeps them without asking.
   */
  static rememberChoices(rows: IPlayStateRow[], decisions: Record<string, boolean>) {
    for (const row of rows) {
      if (!row.remember || !decisions[row.key]) continue;
      const { item, flag, activityName } = row.remember;
      if (flag === "retainActivityUseSpent") {
        const current = foundry.utils.getProperty(item, "flags.ddbimporter.retainActivityUseSpent") as boolean | string[] | undefined;
        if (current === true) continue;
        const names = new Set(Array.isArray(current) ? current : []);
        if (activityName) names.add(activityName);
        foundry.utils.setProperty(item, "flags.ddbimporter.retainActivityUseSpent", Array.from(names));
      } else {
        foundry.utils.setProperty(item, `flags.ddbimporter.${flag}`, true);
      }
      logger.debug(`Remembering ${flag} for ${item.name}`, { activityName });
    }
  }
}
