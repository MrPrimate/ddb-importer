import {
  logger,
  DDBDebug,
} from "../lib/_module";
import DDBAppV2 from "./DDBAppV2";

interface IDDBDebuggerOptions {
  actor?: TImporterActor | null;
  extra?: Record<string, unknown>;
}

export default class DDBDebugger extends DDBAppV2 {

  actor: TImporterActor | null;

  debug: DDBDebug;

  constructor({ actor = null, extra }: IDDBDebuggerOptions = {}) {
    super();
    this.actor = actor;

    this.debug = new DDBDebug({ actor, extra });
  }


  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    id: "ddb-debugger",
    classes: ["sheet", "standard-form", "dnd5e2"],
    actions: {
      downloadDebug: DDBDebugger.downloadDebug,
    },
    position: {
      width: 900,
      height: "auto" as const,
    },
    window: {
      icon: "fab fa-d-and-d-beyond",
      resizable: true,
      minimizable: true,
      subtitle: "",
    },
  };

  get id() {
    return `ddb-debugger-${this.actor?.id ?? "global"}`;
  }

  /** @override */
  get title() {
    return `DDB Importer Debugger`;
  }


  static PARTS = {
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    main: { template: "modules/ddb-importer/handlebars/debug/main.hbs" },
    // recommendations: { template: "modules/ddb-importer/handlebars/debug/recommendations.hbs" },
  };

  /** @override */
  tabGroups = {
    sheet: "main",
  };


  _getTabs() {
    const tabs = this._markTabs({
      main: {
        id: "main", group: "sheet", label: "Debug", icon: "fas hand-holding-heart",
      },
      // recommendations: {
      //   id: "recommendations", group: "sheet", label: "Recommendations", icon: "fas gem",
      // },
    });
    return tabs;
  }

  /** @override */
  async _prepareContext(options: any) {

    let context = this.debug.data as DDBAppV2Context;
    const parentContext = await super._prepareContext(options);
    context = foundry.utils.mergeObject(parentContext, context, { inplace: false }) as DDBAppV2Context;
    logger.debug("DDBDebug: _prepareContext", context);
    return context;
  }

  /** @override */
  async _preparePartContext(partId: string, context: any) {
    switch (partId) {
      default: {
        context.tab = context.tabs[partId];
        break;
      }
    };
    return context;
  }

  static async downloadDebug(this: DDBDebugger, _event: any, _target: any) {
    await this.debug.fetch();
    this.debug.download();
  }

}
