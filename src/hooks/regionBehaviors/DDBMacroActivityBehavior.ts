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
      scale: new BooleanField({ initial: true }),
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
    args.scale = this.scale;
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
