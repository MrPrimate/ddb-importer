import DDBEnricherData from "../../data/DDBEnricherData";
import _VestigeCompanionForm from "./_VestigeCompanionForm";

type TVestigeForm = "Celestial" | "Fiend" | "Undead";

/** The Divine Power option each vestige form manifests, as named in the stat block. */
const FORM_POWERS: Record<TVestigeForm, string> = {
  Celestial: "Healing Touch",
  Fiend: "Fiendish Swap",
  Undead: "Cursed Invocation",
};

/**
 * Vestige Patron (AU 2024) companion stat block. Divine Power (1/Day) lists all three forms'
 * options, but each companion actor ("Vestige Companion (Celestial)") only has its own: the
 * description keeps that option alone and the activity implements it. The summoner's Charisma
 * modifier on Healing Touch is the Vestige Companion summon's healing bonus. The item keeps the
 * Divine Power name, which Vestige Power's rest recovery looks for.
 */
export default class DivinePower extends _VestigeCompanionForm {

  override get type(): IDDBActivityType | null {
    switch (this.form) {
      case "Celestial": return DDBEnricherData.ACTIVITY_TYPES.HEAL;
      // dnd5e 5.x has no teleport activity; the swap is moved by hand
      case "Fiend": return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
      case "Undead": return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
      default: return null;
    }
  }

  override get activity(): IDDBActivityData | null {
    switch (this.form) {
      case "Celestial":
        return {
          name: "Healing Touch",
          activationType: "bonus",
          targetType: "creature",
          addItemConsume: true,
          noTemplate: true,
          data: {
            range: { units: "touch" },
            healing: DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, types: ["healing"] }),
          },
        };
      case "Fiend":
        return {
          name: "Fiendish Swap",
          activationType: "bonus",
          addItemConsume: true,
          noTemplate: true,
          data: {
            range: { value: "60", units: "ft" },
            target: {
              override: true,
              prompt: false,
              affects: { count: "2", type: "creature", special: "The vestige and you, swapping places" },
              template: {},
            },
          },
        };
      case "Undead":
        return {
          name: "Cursed Invocation",
          activationType: "bonus",
          targetType: "creature",
          addItemConsume: true,
          noTemplate: true,
          data: {
            range: { value: "30", units: "ft" },
            duration: { value: "1", units: "minute" },
          },
        };
      default:
        return null;
    }
  }

  override get effects(): IDDBEffectHint[] {
    if (this.form !== "Undead") return [];
    return [
      {
        name: "Cursed by Vestige",
        statuses: ["Cursed"],
        activityMatch: "Cursed Invocation",
        // the flags cannot single out the warlock and the vestige as targets
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
        options: {
          durationSeconds: 60,
          description: "Disadvantage on attack rolls against the warlock and the vestige.",
        },
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  /**
   * Keep only this form's option, without the list's lead-in or its "(Celestial Only)" marker.
   * DDB prints the list two ways: the generic stat block gives each option its own paragraph,
   * a chosen form's stat block keeps the lead-in and its option in one paragraph split by line
   * breaks.
   */
  static formDescription(html: string, form: TVestigeForm): string {
    const power = FORM_POWERS[form];
    let result = html.replace(
      /\s*Your vestige manifests a remnant of its divine power[^:.<]*[:.]\s*(?:<br\s*\/?>\s*)*/gi,
      " ",
    );
    for (const other of Object.values(FORM_POWERS).filter((name) => name !== power)) {
      const title = `<strong>\\s*(?:<em>)?\\s*${other}[^<]*(?:</em>)?\\s*</strong>`;
      result = result
        .replace(new RegExp(`<p>\\s*${title}[\\s\\S]*?</p>`, "g"), "")
        .replace(new RegExp(`${title}[\\s\\S]*?(?:<br\\s*/?>|(?=</p>))`, "g"), "");
    }
    return result
      .replace(/\s*\((?:Celestial|Fiend|Undead) Only\)/g, "")
      .replace(/(?:<br\s*\/?>\s*)+(?=<\/p>)/g, "")
      .replace(/<p>\s+/g, "<p>")
      .replace(/<p><\/p>/g, "");
  }

  override async cleanup(): Promise<void> {
    const form = this.form;
    const description = this.data?.system?.description;
    if (!form || !description) return;
    description.value = DivinePower.formDescription(description.value ?? "", form);
    if (description.chat) description.chat = DivinePower.formDescription(description.chat, form);
  }

}
