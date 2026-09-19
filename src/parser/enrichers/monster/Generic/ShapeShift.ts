import DDBEnricherData from "../../data/DDBEnricherData";

const SPEED_KEYS: Record<string, string> = {
  speed: "walk",
  walk: "walk",
  fly: "fly",
  climb: "climb",
  swim: "swim",
  burrow: "burrow",
};

const SIZE_KEYS: Record<string, string> = {
  tiny: "tiny",
  small: "sm",
  medium: "med",
  large: "lg",
  huge: "huge",
  gargantuan: "grg",
};

const SIZE_WORDS = "Tiny|Small|Medium|Large|Huge|Gargantuan";

// The DDB monster a form takes its token art from, where it is not simply the form's name.
const FORM_MONSTERS: Record<string, string> = {
  "bear": "Brown Bear",
  "centipede": "Giant Centipede",
  "snake": "Constrictor Snake",
  "toad": "Giant Toad",
};

// dnd5e system token art, used only when no monster art can be found (no DDB access, or a form
// that is no monster). It is top-down where DDB tokens are portraits, so monster art wins.
const FALLBACK_ART: Record<string, string> = {
  "bat": "beast/Bat",
  "bear": "beast/BrownBear",
  "boar": "beast/Boar",
  "centipede": "beast/GiantCentipede",
  "cloud of mist": "elemental/InvisibleStalker",
  "dire wolf": "beast/DireWolf",
  "frog": "beast/Frog",
  "hyena": "beast/Hyena",
  "jackal": "beast/Jackal",
  "panther": "beast/Panther",
  "rat": "beast/Rat",
  "raven": "beast/Raven",
  "snake": "beast/ConstrictorSnake",
  "spider": "beast/Spider",
  "tiger": "beast/Tiger",
  "toad": "beast/GiantToad",
  "weasel": "beast/Weasel",
  "wolf": "beast/Wolf",
};

// forms that are no creature of their own, so there is no monster to take art from
const NO_MONSTER = /hybrid$|^human$|^cloud of mist$/i;

// "a Medium Humanoid", "a Large Giant": an appearance of the GM's choosing rather than a named form
const APPEARANCE_ONLY = /^(humanoid|object|beast|giant|undead|creature|version)\b/i;

// words that end a form name in running text ("a Large bear-humanoid hybrid form or a Large bear")
const NAME_STOP_WORDS = "or|and|form|that|with|while|it|he|she|into";

/**
 * Monster Shape-Shift actions (Imp, Quasit, Vampire, were-creatures, Yuan-ti...). Where the text
 * names forms, the action is a form-mode transform: each form is an effect that overrides the
 * listed speeds, the size and the token image, and "No Form" returns the monster to its true
 * form. The token image is the form creature's own monster token where one can be found (see
 * cleanup), else dnd5e system art. Text that only offers an appearance ("a Medium or Small
 * Humanoid") names no form, so the action stays a plain utility.
 */
export default class ShapeShift extends DDBEnricherData {

  _parsedForms: { name: string; size: string | null; speeds: Record<string, number> }[] | null = null;

  override get type(): IDDBActivityType | null {
    return this._forms().length > 0
      ? DDBEnricherData.ACTIVITY_TYPES.TRANSFORM
      : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    const base: IDDBActivityData = {
      name: "Change Form",
      targetType: "self",
      rangeSelf: true,
    };
    if (this._forms().length === 0) return base;
    return {
      ...base,
      data: {
        duration: { units: "inst" },
        ...DDBEnricherData.formTransformData({ formless: true }),
      },
    };
  }

  /**
   * Forms named in the text: those with a parenthetical speed list ("a bat (Speed 10 ft., Fly 40
   * ft.)") and those given only a size ("a Large bear-humanoid hybrid or a Large bear").
   */
  _forms(): { name: string; size: string | null; speeds: Record<string, number> }[] {
    if (this._parsedForms) return this._parsedForms;
    const fullText = (foundry.utils.getProperty(this, "ddbParser.strippedHtml") as string | undefined) ?? "";
    // the true form is not a selectable form, and may carry its own parenthetical ("that of a Small jackal")
    const text = fullText.split(/\breturns? to\b|\bback into\b/i)[0];
    const forms: { name: string; size: string | null; speeds: Record<string, number> }[] = [];

    const speedFormRegex = new RegExp(`(?:a|an|the)?\\s?(${SIZE_WORDS})?\\s?([\\w-]+(?: of [\\w-]+)?) \\(([^)]*\\d+ ft\\.[^)]*)\\)`, "gi");
    for (const match of text.matchAll(speedFormRegex)) {
      const speeds: Record<string, number> = {};
      // a bare "40 ft." first entry is the walking speed; named entries may read "Fly Speed 30 ft."
      const entryRegex = /(?:(Speed|Walk|Fly|Climb|Swim|Burrow)(?: Speed)? )?(\d+) ft\./gi;
      for (const entry of match[3].matchAll(entryRegex)) {
        const key = SPEED_KEYS[(entry[1] ?? "walk").toLowerCase()];
        if (key) speeds[key] = Number(entry[2]);
      }
      if (Object.keys(speeds).length === 0) continue;
      forms.push({ name: match[2].trim().toLowerCase(), size: match[1]?.toLowerCase() ?? null, speeds });
    }

    const word = `(?!(?:${NAME_STOP_WORDS}|${SIZE_WORDS})\\b)[\\w-]+`;
    const sizedFormRegex = new RegExp(`\\b(?:a|an) (${SIZE_WORDS}) (${word}(?: ${word}){0,3})`, "gi");
    for (const match of text.matchAll(sizedFormRegex)) {
      const name = match[2].trim().toLowerCase();
      if (APPEARANCE_ONLY.test(name)) continue;
      if (forms.some((form) => form.name === name)) continue;
      forms.push({ name, size: match[1].toLowerCase(), speeds: {} });
    }

    this._parsedForms = forms;
    return forms;
  }

  /** "bat" -> "Bat Form", "cloud of mist" -> "Cloud of Mist Form", "wolf-humanoid hybrid" -> "Hybrid Form". */
  _formLabel(name: string): string {
    if (name.endsWith("hybrid")) return "Hybrid Form";
    const title = name.split(" ").map((w) => (w === "of" ? w : `${w.charAt(0).toUpperCase()}${w.slice(1)}`)).join(" ");
    return `${title} Form`;
  }

  override get effects(): IDDBEffectHint[] {
    const monsterSpeeds = (foundry.utils.getProperty(this, "ddbParser.ddbMonster.npc.system.attributes.movement.speeds") ?? {}) as Record<string, unknown>;

    return this._forms().map((form) => {
      const changes = Object.entries(form.speeds).map(([type, value]) =>
        DDBEnricherData.ChangeHelper.overrideChange(String(value), 20, `system.attributes.movement.speeds.${type}`),
      );
      // a form that lists its speeds has only those, so the monster's other movement goes
      if (changes.length > 0) {
        for (const [type, value] of Object.entries(monsterSpeeds)) {
          if (type in form.speeds || !Number(value)) continue;
          changes.push(DDBEnricherData.ChangeHelper.overrideChange("0", 20, `system.attributes.movement.speeds.${type}`));
        }
      }
      const size = form.size ? SIZE_KEYS[form.size] : null;
      if (size) changes.push(DDBEnricherData.ChangeHelper.overrideChange(size, 20, "system.traits.size"));

      const art = FALLBACK_ART[form.name] ? `systems/dnd5e/tokens/${FALLBACK_ART[form.name]}.webp` : null;
      const hint: IDDBEffectHint = {
        name: this._formLabel(form.name),
        activityMatch: "Change Form",
        // the form lasts until the monster changes again
        options: { transfer: false, durationSeconds: null },
        changes,
      };
      if (art) {
        hint.img = art;
        hint.tokenChanges = [DDBEnricherData.ChangeHelper.overrideChange(art, 20, "token.texture.src")];
      }
      return hint;
    });
  }

  /** The DDB monster whose token a form should wear, or null for a form that is no creature. */
  _formMonsterName(name: string): string | null {
    if (NO_MONSTER.test(name)) return null;
    return FORM_MONSTERS[name] ?? name.split(" ").map((w) => `${w.charAt(0).toUpperCase()}${w.slice(1)}`).join(" ");
  }

  /**
   * Swap each form's token image for the form creature's monster token: the munched monster's
   * own token if it is in the compendium, else its DDB token image, as companions are imaged.
   * This has to wait for cleanup because the lookup is async and the effect hints are not.
   */
  override async cleanup(): Promise<void> {
    const effects: I5eEffectData[] = this.data?.effects ?? [];
    if (effects.length === 0 || this._forms().length === 0) return;
    // loaded on demand: the resolver pulls in the monster factory, which enricher files must not import
    const { resolveMonsterTokenArt } = await import(/* webpackMode: "eager" */ "../../../companions/types/MonsterTokenArt");

    for (const form of this._forms()) {
      const monsterName = this._formMonsterName(form.name);
      const effect = effects.find((e) => e.name === this._formLabel(form.name));
      if (!monsterName || !effect) continue;
      const art = await resolveMonsterTokenArt({ name: monsterName, is2014: this.is2014 });
      if (!art) continue;

      effect.img = art;
      effect.system ??= {};
      effect.system.changes ??= [];
      const texture = effect.system.changes.find((change) => change.key === "token.texture.src");
      if (texture) texture.value = art;
      else effect.system.changes.push(DDBEnricherData.ChangeHelper.overrideChange(art, 20, "token.texture.src"));
    }
  }

}
