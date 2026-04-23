import DDBAppV2 from "./DDBAppV2";
import {
  logger,
  CompendiumHelper,
  DDBSources,
  utils,
} from "../lib/_module";

interface IMatchedDocument {
  _id: string;
  name: string;
  sourceBook: string;
}

interface ICompendiumResult {
  title: string;
  setting: string;
  packId: string;
  documents: IMatchedDocument[];
  bySource: Record<string, IMatchedDocument[]>;
}

export default class DDBSourcePruner extends DDBAppV2 {

  scanResults: ICompendiumResult[] = [];
  selectedCategoryIds: number[] = [];
  selectedBookIds: number[] = [];
  selectedCompendiumSettings: string[] = [];

  static DEFAULT_OPTIONS = {
    id: "ddb-source-pruner",
    classes: ["standard-form", "dnd5e2", "ddb-source-pruner"],
    window: {
      title: "DDB Source Pruner",
      icon: "fas fa-broom",
      resizable: true,
    },
    tag: "form",
    actions: {
      scanCompendiums: DDBSourcePruner.scanCompendiums,
      deleteMatched: DDBSourcePruner.deleteMatched,
      cancel: DDBSourcePruner.cancel,
    },
    position: { width: 750, height: 700 },
  };

  static PARTS = {
    content: {
      template: "modules/ddb-importer/handlebars/source-pruner/source-pruner.hbs",
    },
    footer: {
      template: "modules/ddb-importer/handlebars/source-pruner/footer.hbs",
    },
  };

  _getTabs(): IDDBTabs {
    return {};
  }

  static _getMultiSelectValues(element: any): number[] {
    if (!element) return [];
    const val = element.value;
    if (Array.isArray(val) && val.length > 0) {
      return val.map((v) => parseInt(v)).filter((v) => !isNaN(v));
    }
    return [];
  }

  _captureSelections() {
    const categorySelect = this.element?.querySelector("#pruner-categories");
    const bookSelect = this.element?.querySelector("#pruner-books");

    this.selectedCategoryIds = DDBSourcePruner._getMultiSelectValues(categorySelect);
    this.selectedBookIds = DDBSourcePruner._getMultiSelectValues(bookSelect);

    const compendiumCheckboxes = this.element?.querySelectorAll(
      "input[name='compendium-select']",
    ) as NodeListOf<HTMLInputElement> | undefined;
    if (compendiumCheckboxes) {
      this.selectedCompendiumSettings = Array.from(compendiumCheckboxes)
        .filter((cb) => cb.checked)
        .map((cb) => cb.value);
    }
  }

  async _prepareContext(options) {
    const context = await super._prepareContext({ ...options, noCacheLoad: true }) as any;

    const configured = CompendiumHelper.getConfiguredCompendiums();
    const allSettings = configured.filter((c) => c.pack).map((c) => c.setting);
    const checkedSettings = this.selectedCompendiumSettings.length > 0
      ? this.selectedCompendiumSettings
      : allSettings;

    context.compendiums = configured
      .filter((c) => c.pack)
      .map((c) => ({
        setting: c.setting,
        title: c.title,
        label: c.pack?.metadata?.label ?? c.title,
        checked: checkedSettings.includes(c.setting) ? "checked" : "",
      }));

    const categories = DDBSources.getDisplaySourceCategories(true);
    context.sourceCategories = categories
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({
        id: c.id,
        label: c.name,
        description: c.description || c.name,
        selected: this.selectedCategoryIds.includes(c.id) ? "selected" : "",
      }));

    const sources = DDBSources.getDisplaySources();
    context.sourceBooks = sources
      .sort((a, b) => a.description.localeCompare(b.description))
      .map((s) => ({
        id: s.id,
        label: s.description,
        acronym: s.name,
        selected: this.selectedBookIds.includes(s.id) ? "selected" : "",
      }));

    context.scanResults = this.scanResults;
    context.hasResults = this.scanResults.length > 0;
    context.totalMatched = this.scanResults.reduce((sum, r) => sum + r.documents.length, 0);

    return context;
  }

  static async scanCompendiums(this: DDBSourcePruner, _event, _target) {
    this._captureSelections();

    if (this.selectedCategoryIds.length === 0 && this.selectedBookIds.length === 0) {
      ui.notifications.warn("Please select at least one source category or source book to filter by.");
      return;
    }

    if (this.selectedCompendiumSettings.length === 0) {
      ui.notifications.warn("Please select at least one compendium to scan.");
      return;
    }

    this.scanResults = [];
    const configured = CompendiumHelper.getConfiguredCompendiums();
    const toScan = configured.filter((e) => this.selectedCompendiumSettings.includes(e.setting) && e.pack);

    utils.munchNote(`Scanning ${toScan.length} compendiums...`);

    for (const entry of toScan) {
      utils.munchNote(`Scanning ${entry.title}...`, { nameField: true });
      const indexFields = ["name", "flags.ddbimporter", "system.source.book"];
      const index = await entry.pack.getIndex({ fields: indexFields });
      const matched: IMatchedDocument[] = [];

      for (const doc of index) {
        if (DDBSources.matchesSourceFilter(doc, {
          sourceIds: this.selectedBookIds.length > 0 ? this.selectedBookIds : undefined,
          categoryIds: this.selectedCategoryIds.length > 0 ? this.selectedCategoryIds : undefined,
        })) {
          matched.push({
            _id: doc._id,
            name: doc.name,
            sourceBook: DDBSources.getDocumentSourceBookName(doc),
          });
        }
      }

      if (matched.length > 0) {
        const bySource: Record<string, IMatchedDocument[]> = {};
        for (const doc of matched) {
          if (!bySource[doc.sourceBook]) bySource[doc.sourceBook] = [];
          bySource[doc.sourceBook].push(doc);
        }

        this.scanResults.push({
          title: entry.title,
          setting: entry.setting,
          packId: entry.pack.metadata.id,
          documents: matched,
          bySource,
        });
      }
    }

    const totalMatched = this.scanResults.reduce((sum, r) => sum + r.documents.length, 0);
    utils.munchNote("");
    utils.munchNote("", { nameField: true });

    if (totalMatched === 0) {
      ui.notifications.info("No matching documents found in the selected compendiums.");
    } else {
      ui.notifications.info(`Found ${totalMatched} matching documents across ${this.scanResults.length} compendiums.`);
    }

    this.render();
  }

  static async deleteMatched(this: DDBSourcePruner, _event, _target) {
    if (this.scanResults.length === 0) {
      ui.notifications.warn("No scan results to delete. Run a scan first.");
      return;
    }

    for (const result of this.scanResults) {
      const sourceEntries = Object.entries(result.bySource)
        .sort(([a], [b]) => a.localeCompare(b));

      const listHtml = sourceEntries.map(([source, docs]) => {
        const names = docs
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((d) => `<li>${d.name}</li>`)
          .join("");
        return `<h4>${source} (${docs.length})</h4><ul style="max-height: 150px; overflow-y: auto; margin-bottom: 8px;">${names}</ul>`;
      }).join("");

      const content = `
        <p>Delete <strong>${result.documents.length}</strong> documents from <strong>${result.title}</strong> compendium?</p>
        <div style="max-height: 400px; overflow-y: auto;">${listHtml}</div>
      `;

      const proceed = await foundry.applications.api.DialogV2.confirm({
        rejectClose: false,
        window: {
          title: `Delete from ${result.title}?`,
        },
        content,
      });

      if (!proceed) {
        logger.info(`Skipped deletion for ${result.title}`);
        continue;
      }

      const pack = game.packs.get(result.packId);
      if (!pack) {
        logger.error(`Could not find compendium ${result.packId}`);
        continue;
      }

      const ids = result.documents.map((d) => d._id);
      logger.info(`Deleting ${ids.length} documents from ${result.title}`);
      await pack.documentClass.deleteDocuments(ids, { pack: result.packId });
      ui.notifications.info(`Deleted ${ids.length} documents from ${result.title}.`);
    }

    this.scanResults = [];
    this.render();
  }

  static async cancel(this: DDBSourcePruner) {
    await this.close();
  }

}
