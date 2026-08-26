import RegionAutomations from "../../effects/auras/RegionAutomations";
import BaseActivityBehavior from "./baseActivityBehavior";
import { buildMacroBehaviorData, REGION_EVENTS } from "./behaviorData";

const { BooleanField, JSONField, SetField, StringField } = foundry.data.fields;

/**
 * Activity behavior that runs a ddb-importer region automation (damage on
 * entry, condition on entry, movement damage...) in response to core region
 * events. Placement creates a core "executeScript" RegionBehavior whose script
 * dispatches to DDBImporter.effects.AuraAutomations.handleRegionEvent.
 *
 */
export default class DDBMacroActivityBehavior extends BaseActivityBehavior {

  static override LOCALIZATION_PREFIXES = ["ddb-importer.behaviors.macro"];

  static override defineSchema() {
    return {
      function: new StringField({ required: true, blank: false, initial: "useActivity" }),
      events: new SetField(new StringField()),
      activity: new StringField(),
      oncePerTurn: new BooleanField({ initial: true }),
      excludeSelf: new BooleanField({ initial: false }),
      scale: new BooleanField({ initial: true }),
      autoRoll: new BooleanField({ initial: false }),
      // the same size/creature-type filters the 5e area-of-effect behaviors carry,
      // plus an exclusion set for "any creature other than an ooze" wording
      sizes: new SetField(new StringField()),
      types: new SetField(new StringField()),
      excludeTypes: new SetField(new StringField()),
      macroName: new StringField(),
      macroParameters: new JSONField({ required: false, initial: "{}" }),
      args: new JSONField({ required: false, initial: "{}" }),
    };
  }

  override createBehaviorData(_activity: any, _options: { token?: any } = {}) {
    const args: Record<string, unknown> = { ...((this.args as Record<string, unknown> | undefined) ?? {}) };
    if (this.activity) args.activityId = this.activity;
    if (this.macroName) args.macroFunction = this.macroName;
    args.oncePerTurn = this.oncePerTurn;
    args.excludeSelf = this.excludeSelf;
    args.scale = this.scale;
    args.autoRoll = this.autoRoll;
    if ((this.sizes as Set<string> | undefined)?.size) args.sizes = [...(this.sizes as Set<string>)];
    if ((this.types as Set<string> | undefined)?.size) args.types = [...(this.types as Set<string>)];
    if ((this.excludeTypes as Set<string> | undefined)?.size) args.excludeTypes = [...(this.excludeTypes as Set<string>)];
    // the default {} means "no override"; only a filled-in value is passed through
    if (!foundry.utils.isEmpty(this.macroParameters)) {
      args.macroParameters = this.macroParameters;
    }
    return buildMacroBehaviorData({
      handler: this.function,
      events: this.events,
      args,
    });
  }

  override customizeField(field: any, data: any) {
    if (field.name === "function") {
      data.options = Object.keys(RegionAutomations.handlers).map((value) => ({ value, label: RegionAutomations.handlerLabel(value) }));
    } else if (field.name === "events") {
      data.options = REGION_EVENTS.map((value) => ({
        value,
        label: game.i18n.localize(`ddb-importer.behaviors.macro.events.${value}`),
      }));
    } else if (field.name === "sizes") {
      data.options = Object.entries(CONFIG.DND5E.actorSizes as Record<string, { label: string }>)
        .map(([value, config]) => ({ value, label: game.i18n.localize(config.label) }));
    } else if (field.name === "types" || field.name === "excludeTypes") {
      data.options = Object.entries(CONFIG.DND5E.creatureTypes as Record<string, { label: string }>)
        .map(([value, config]) => ({ value, label: game.i18n.localize(config.label) }));
    } else if (field.name === "activity") {
      const activities = (this.parent as { item?: { system?: { activities?: Iterable<{ id?: string; _id?: string; name?: string; type?: string }> } } } | null)
        ?.item?.system?.activities;
      data.options = [
        { value: "", label: game.i18n.localize("ddb-importer.behaviors.macro.placingActivity") },
        ...[...(activities ?? [])].map((activity) => ({
          value: activity.id ?? activity._id ?? "",
          label: activity.name || (activity.type ?? ""),
        })),
      ];
    }
  }

}
