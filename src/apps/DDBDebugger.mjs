import {
  logger,
  DDBDebug,
} from "../lib/_module.mjs";
import DDBAppV2 from "./DDBAppV2.js";


export default class DDBDebugger extends DDBAppV2 {

  constructor({ actor } = {}) {
    super();
    this.actor = actor ?? null;

    this.debug = new DDBDebug({ actor });
  }


  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    id: "ddb-debugger",
    classes: ["sheet", "standard-form", "dnd5e2"],
    actions: {
      downloadDebug: DDBDebugger.downloadDebug,
    },
    position: {
      width: "900",
      height: "auto",
    },
    window: {
      icon: 'fab fa-d-and-d-beyond',
      resizable: true,
      minimizable: true,
      subtitle: "",
    },
  };

  get id() {
    return `ddb-debugger-${this.actor?.id ?? "global"}`;
  }

  /** @override */
  // eslint-disable-next-line class-methods-use-this
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
  async _prepareContext(options) {

    let context = this.debug.data;
    const parentContext = await super._prepareContext(options);
    context = foundry.utils.mergeObject(parentContext, context, { inplace: false });
    logger.debug("DDBDebug: _prepareContext", context);
    return context;
  }

  /** @override */
  // eslint-disable-next-line class-methods-use-this
  async _preparePartContext(partId, context) {
    switch (partId) {
      default: {
        context.tab = context.tabs[partId];
        break;
      }
    };
    return context;
  }

  static async downloadDebug(_event, _target) {
    this.debug.download();
  }

}
