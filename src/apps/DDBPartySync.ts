import DDBAppV2 from "./DDBAppV2";
import { logger, PatreonHelper, DDBCampaigns, Secrets } from "../lib/_module";
import DDBPartyInventory, { IDDBCampaignCharacter } from "../muncher/DDBPartyInventory";
import DDBPartyInventoryImporter from "../muncher/DDBPartyInventoryImporter";
import DDBCharacterImporter from "../muncher/DDBCharacterImporter";
import { updateDDBCharacter } from "../updater/character";

const FLAG_SCOPE = "ddbimporter";
const FLAG_CAMPAIGN_KEY = "partyCampaignId";
const FLAG_CAMPAIGN_NAME = "partyCampaignName";
const FLAG_LAST_SYNC = "lastPartySync";

interface ICampaignCharacterRow extends IDDBCampaignCharacter {
  alreadyImported: boolean;
  inParty: boolean;
  disabled: boolean;
  selectedForImport: boolean;
  worldActorId: string | null;
}

interface IPartySyncState {
  campaignId: string;
  campaignName: string | null;
  campaignDM: string | null;
  campaignCharacters: ICampaignCharacterRow[];
  partyItemCount: number;
  partyCurrencySummary: string;
  inventoryStatus: string;
  loadingCharacters: boolean;
  charactersLoaded: boolean;
  charactersError: string | null;
  availableCampaigns: { id: string | number; name: string; dmUsername?: string; selected?: boolean }[];
  campaignsLoaded: boolean;
  campaignsLoading: boolean;
}

export default class DDBPartySync extends DDBAppV2 {

  actor: any;

  campaignId = "";

  partyState: IPartySyncState = {
    campaignId: "",
    campaignName: null,
    campaignDM: null,
    campaignCharacters: [],
    partyItemCount: 0,
    partyCurrencySummary: "-",
    inventoryStatus: "",
    loadingCharacters: false,
    charactersLoaded: false,
    charactersError: null,
    availableCampaigns: [],
    campaignsLoaded: false,
    campaignsLoading: false,
  };

  constructor(options: any = {}) {
    super();
    this.actor = options.actor ?? null;
    const fromActor = this.actor
      ? `${foundry.utils.getProperty(this.actor, `flags.${FLAG_SCOPE}.${FLAG_CAMPAIGN_KEY}`) ?? ""}`
      : "";
    const fromSetting = `${(game as any).settings.get("ddb-importer", "campaign-id") ?? ""}`.split("/").pop() ?? "";
    this.campaignId = options.campaignId ?? fromActor ?? fromSetting ?? "";
    this.partyState.campaignId = this.campaignId;
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "ddb-party-sync",
    classes: ["standard-form", "dnd5e2", "ddb-party-sync"],
    window: {
      title: "DDB Party Sync",
      icon: "fab fa-d-and-d-beyond",
    },
    tag: "div",
    actions: {
      saveCampaignId: DDBPartySync._onSaveCampaignId,
      refresh: DDBPartySync._onRefresh,
      fetchCampaigns: DDBPartySync._onFetchCampaigns,
      importSelected: DDBPartySync._onImportSelected,
      updateSelected: DDBPartySync._onUpdateSelected,
      pullInventory: DDBPartySync._onPullInventory,
      openPartyActor: DDBPartySync._onOpenPartyActor,
    },
    position: {
      width: 720,
      height: "auto" as const,
    },
  };

  /** @inheritDoc */
  static PARTS = {
    ...super.PARTS,
    content: {
      template: "modules/ddb-importer/handlebars/party-sync/ddb-party-sync.hbs",
    },
  };

  override _getTabs() {
    return {} as any;
  }

  _delegationBound = false;

  async _onRender(context: any, options: any) {
    await super._onRender(context, options);
    this._attachCheckboxListeners();
  }

  _syncCheckbox(el: HTMLInputElement) {
    if (el.classList.contains("ddb-party-import-toggle")) {
      const id = parseInt(el.getAttribute("data-character-id") ?? "");
      if (!Number.isInteger(id)) return;
      const row = this.partyState.campaignCharacters.find((c) => c.characterId === id);
      if (row && !row.disabled) row.selectedForImport = el.checked;
      logger.debug(`DDBPartySync: sync import id=${id} -> ${el.checked}`);
    } else if (el.classList.contains("ddb-party-import-toggle-all")) {
      const rows = this.element.querySelectorAll<HTMLInputElement>(".ddb-party-import-toggle:not([disabled])");
      rows.forEach((row) => {
        row.checked = el.checked;
        this._syncCheckbox(row);
      });
      logger.debug(`DDBPartySync: sync import toggle-all -> ${el.checked}`);
    }
  }

  _attachCheckboxListeners() {
    if (!this.element || this._delegationBound) return;

    const handler = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.tagName !== "INPUT") return;
      if (!(target as HTMLInputElement).matches?.("input[type=\"checkbox\"]")) return;
      // schedule one tick so the browser has committed the toggle
      setTimeout(() => this._syncCheckbox(target as HTMLInputElement), 0);
    };

    this.element.addEventListener("change", handler, true);
    this.element.addEventListener("click", handler, true);
    this._delegationBound = true;
    logger.debug("DDBPartySync: bound delegated checkbox listeners on element", this.element);
  }

  get title() {
    const campaignName = this.partyState.campaignName
      ?? (this.actor
        ? (foundry.utils.getProperty(this.actor, `flags.${FLAG_SCOPE}.${FLAG_CAMPAIGN_NAME}`) as string | undefined)
        : undefined);
    if (campaignName) return `DDB Party Sync - ${campaignName}`;
    return this.actor ? `DDB Party Sync - ${this.actor.name}` : "DDB Party Sync";
  }

  get isPartyActor() {
    return this.actor?.type === "group";
  }

  /* -------------------------------------------- */
  /*  Context preparation                         */
  /* -------------------------------------------- */

  async _prepareContext(_options: any): Promise<any> {
    if (!this.partyState.campaignsLoaded && !this.partyState.campaignsLoading) {
      this.partyState.campaignsLoading = true;
      this._loadAvailableCampaigns().catch((err) => logger.error("DDBPartySync campaigns load error", err));
    }

    if (this.campaignId && !this.partyState.charactersLoaded && !this.partyState.loadingCharacters) {
      // First render with a campaign id: trigger an async load (guard prevents the render loop)
      this.partyState.loadingCharacters = true;
      this._loadCharacters().catch((err) => logger.error("DDBPartySync load error", err));
    }

    const partyData = await this._partyInventorySnapshot();
    if (partyData) {
      this.partyState.partyItemCount = partyData.partyItemCount;
      this.partyState.partyCurrencySummary = partyData.partyCurrencySummary;
    }

    const lastSyncMs = this.actor
      ? foundry.utils.getProperty(this.actor, `flags.${FLAG_SCOPE}.${FLAG_LAST_SYNC}`) as number | undefined
      : undefined;
    const lastSync = lastSyncMs ? new Date(lastSyncMs).toLocaleString() : "never";

    const cachedCampaignName = this.actor
      ? (foundry.utils.getProperty(this.actor, `flags.${FLAG_SCOPE}.${FLAG_CAMPAIGN_NAME}`) as string | undefined)
      : undefined;
    const campaignName = this.partyState.campaignName ?? cachedCampaignName ?? null;

    const availableCampaigns = this.partyState.availableCampaigns.map((c) => ({
      ...c,
      selected: `${c.id}` === `${this.campaignId}`,
    }));

    return {
      actorName: this.actor?.name ?? "(no actor)",
      isPartyActor: this.isPartyActor,
      campaignId: this.campaignId,
      hasCampaignId: !!this.campaignId,
      campaignName,
      campaignDM: this.partyState.campaignDM,
      availableCampaigns,
      hasAvailableCampaigns: availableCampaigns.length > 0,
      campaignsLoaded: this.partyState.campaignsLoaded,
      campaignsLoading: this.partyState.campaignsLoading,
      lastSync,
      campaignCharacters: this.partyState.campaignCharacters,
      allImportsChecked: this.partyState.campaignCharacters.length > 0
        && this.partyState.campaignCharacters.every((c) => c.disabled || c.selectedForImport),
      patreonSupporter: DDBPartySync._isPatreonSupporter(),
      partyItemCount: this.partyState.partyItemCount,
      partyCurrencySummary: this.partyState.partyCurrencySummary,
      inventoryStatus: this.partyState.inventoryStatus,
      loadingCharacters: this.partyState.loadingCharacters,
      charactersError: this.partyState.charactersError,
    };
  }

  /* -------------------------------------------- */
  /*  Data loading                                */
  /* -------------------------------------------- */

  async _loadAvailableCampaigns(force = false) {
    try {
      const cobalt = Secrets.getCobalt();
      if (!cobalt || `${cobalt}`.trim() === "") {
        logger.warn("DDBPartySync: no cobalt cookie set; cannot fetch campaigns");
        if (force) ui.notifications?.warn("No Cobalt cookie set - open DDB Setup to add one before fetching campaigns.");
        this.partyState.availableCampaigns = [];
        return;
      }
      if (force) {
        // bust the in-memory cache so refreshCampaigns will re-fetch
        foundry.utils.setProperty(CONFIG, "DDBI.CAMPAIGNS", null);
        const fresh = await DDBCampaigns.getDDBCampaigns(cobalt);
        foundry.utils.setProperty(CONFIG, "DDBI.CAMPAIGNS", fresh ?? []);
      }
      const campaigns = await DDBCampaigns.getAvailableCampaigns({
        campaignId: this.campaignId === "" ? null : this.campaignId,
        cobalt,
      });
      const normalised = (campaigns ?? [])
        .filter((c: any) => c && c.id !== undefined && c.id !== null && c.dateCreated !== null)
        .map((c: any) => ({
          id: `${c.id}`,
          name: c.name ?? `Campaign ${c.id}`,
          dmUsername: c.dmUsername ?? "",
        }));
      this.partyState.availableCampaigns = normalised;
      if (force) {
        if (normalised.length === 0) {
          ui.notifications?.warn("No campaigns returned from DDB. You can still enter a campaign id manually.");
        } else {
          ui.notifications?.info(`Fetched ${normalised.length} campaign(s) from DDB`);
        }
      }
    } catch (err: any) {
      logger.warn("DDBPartySync: unable to fetch available campaigns", err);
      this.partyState.availableCampaigns = [];
      if (force) ui.notifications?.error(`Failed to fetch campaigns: ${err?.message ?? err}`);
    } finally {
      this.partyState.campaignsLoading = false;
      this.partyState.campaignsLoaded = true;
      this.render(false);
    }
  }

  async _loadCharacters() {
    this.partyState.charactersError = null;
    try {
      const info = await DDBPartyInventory.fetchCampaignInfo({ campaignId: this.campaignId });
      const characters = info?.characters ?? [];
      const partyMemberIds = this.isPartyActor
        ? new Set<string>((this.actor.system?.members ?? []).map((m: any) => m.actor).filter((id: string) => !!id))
        : new Set<string>();
      const enriched: ICampaignCharacterRow[] = characters.map((c) => {
        const owner = DDBPartySync._findOwnerActor(c.characterId);
        const inParty = !!owner && partyMemberIds.has(owner.id);
        const alreadyImported = !!owner;
        return {
          ...c,
          alreadyImported,
          inParty,
          disabled: false,
          selectedForImport: false,
          worldActorId: owner?.id ?? null,
        };
      });
      this.partyState.campaignCharacters = enriched;
      this.partyState.campaignName = info?.name ?? null;
      this.partyState.campaignDM = info?.dmUsername ?? null;

      if (characters.length === 0) {
        this.partyState.charactersError = "No characters returned for this campaign.";
      }

      if (this.actor && info?.name) {
        try {
          await this.actor.update({ [`flags.ddbimporter.${FLAG_CAMPAIGN_NAME}`]: info.name });
        } catch (err) {
          logger.warn("Could not persist campaign name flag", err);
        }
      }
    } catch (err: any) {
      logger.error("Failed to fetch campaign characters", err);
      this.partyState.charactersError = `Failed to fetch campaign characters: ${err?.message ?? err}`;
    } finally {
      this.partyState.loadingCharacters = false;
      this.partyState.charactersLoaded = true;
      this.render(false);
    }
  }

  async _partyInventorySnapshot() {
    if (!this.campaignId || !DDBPartySync._isPatreonSupporter()) return null;
    try {
      const data = await DDBPartyInventory.fetchPartyInventory({ campaignId: this.campaignId });
      const items = data?.partyItems ?? [];
      const c = data?.currency ?? {};
      const summary = ["pp", "gp", "ep", "sp", "cp"]
        .map((k) => `${(c as any)[k] ?? 0}${k}`)
        .join(" ");
      return { partyItemCount: items.length, partyCurrencySummary: summary };
    } catch (err) {
      logger.warn("DDBPartySync inventory snapshot failed", err);
      return null;
    }
  }

  static _findOwnerActor(ddbCharacterId: number): any | null {
    if (!Number.isInteger(ddbCharacterId)) return null;
    return ((game as any).actors as any[]).find((a) => {
      if (a.type !== "character") return false;
      const id = parseInt(`${foundry.utils.getProperty(a, "flags.ddbimporter.dndbeyond.characterId") ?? ""}`);
      return id === ddbCharacterId;
    }) ?? null;
  }

  static _isPatreonSupporter(): boolean {
    const tier = `${PatreonHelper.getPatreonTier() ?? ""}`.toUpperCase();
    return ["GOD", "UNDYING", "POWER", "CUSTOM"].includes(tier);
  }

  /* -------------------------------------------- */
  /*  Action handlers                             */
  /* -------------------------------------------- */

  static async _onFetchCampaigns(this: DDBPartySync, _event: Event) {
    this.partyState.campaignsLoading = true;
    this.partyState.campaignsLoaded = false;
    this.render(false);
    await this._loadAvailableCampaigns(true);
  }

  static async _onSaveCampaignId(this: DDBPartySync, _event: Event) {
    const select = this.element.querySelector("#ddb-party-campaign-select") as HTMLSelectElement | null;
    const fallback = this.element.querySelector("#ddb-party-campaign-id") as HTMLInputElement | null;
    const selectValue = select?.value && select.value !== "" ? select.value : null;
    const fallbackValue = `${fallback?.value ?? ""}`.trim();
    const value = selectValue ?? fallbackValue;
    this.campaignId = value;
    this.partyState.campaignId = value;
    this.partyState.campaignCharacters = [];
    this.partyState.charactersError = null;
    this.partyState.charactersLoaded = false;
    this.partyState.campaignName = null;
    this.partyState.campaignDM = null;

    if (this.actor) {
      try {
        await this.actor.update({
          [`flags.ddbimporter.${FLAG_CAMPAIGN_KEY}`]: value,
          [`flags.ddbimporter.-=${FLAG_CAMPAIGN_NAME}`]: null,
        });
      } catch (err) {
        logger.warn("Could not persist party campaign flags", err);
      }
    }

    if (value) {
      this.partyState.loadingCharacters = true;
      this.render(false);
      await this._loadCharacters();
    } else {
      this.render(false);
    }
  }

  static async _onRefresh(this: DDBPartySync, _event: Event) {
    if (!this.campaignId) return;
    this.partyState.loadingCharacters = true;
    this.partyState.charactersLoaded = false;
    this.partyState.campaignCharacters = [];
    this.partyState.charactersError = null;
    this.render(false);
    await this._loadCharacters();
  }


  _readSelectedRows(): ICampaignCharacterRow[] {
    const inputs = Array.from(this.element.querySelectorAll<HTMLInputElement>(".ddb-party-import-toggle"));
    const ids = new Set<number>();
    for (const el of inputs) {
      if (!el.checked || el.disabled) continue;
      const id = parseInt(el.getAttribute("data-character-id") ?? "");
      if (Number.isInteger(id)) ids.add(id);
    }
    const stateSelected = this.partyState.campaignCharacters.filter((c) => c.selectedForImport);
    logger.debug(`DDBPartySync: selectedRows DOM=${ids.size}/${inputs.length} state=${stateSelected.length}`);
    let rows = this.partyState.campaignCharacters.filter((c) => ids.has(c.characterId));
    if (rows.length === 0 && stateSelected.length > 0) {
      logger.warn("DOM checkbox read returned 0; falling back to in-memory selection state");
      rows = stateSelected;
    }
    return rows;
  }

  static async _onImportSelected(this: DDBPartySync) {
    const selected = this._readSelectedRows();
    if (selected.length === 0) {
      ui.notifications?.info("No characters selected");
      return;
    }
    const targets = selected.filter((c) => !c.alreadyImported);
    if (targets.length === 0) {
      ui.notifications?.info("All selected characters are already imported");
      return;
    }
    ui.notifications?.info(`Importing ${targets.length} character(s) from DDB...`);
    let imported = 0;
    for (const c of targets) {
      try {
        await DDBCharacterImporter.importCharacterById(c.characterId, undefined, null);
        imported += 1;
      } catch (err) {
        logger.error(`Failed to import ${c.characterName} (${c.characterId})`, err);
        ui.notifications?.error(`Failed to import ${c.characterName} - see console`);
      }
    }
    ui.notifications?.info(`Imported ${imported} of ${targets.length} character(s).`);
    this.partyState.charactersLoaded = false;
    await this._loadCharacters();
  }

  static async _onUpdateSelected(this: DDBPartySync) {
    const selected = this._readSelectedRows();
    if (selected.length === 0) {
      ui.notifications?.info("No characters selected");
      return;
    }
    const targets = selected.filter((c) => c.alreadyImported && c.worldActorId);
    if (targets.length === 0) {
      ui.notifications?.info("No selected characters are imported yet - use Import first");
      return;
    }
    ui.notifications?.info(`Updating ${targets.length} character(s) to DDB...`);
    let updated = 0;
    for (const c of targets) {
      const actor = (game as any).actors.get(c.worldActorId);
      if (!actor) {
        logger.warn(`No actor found for ${c.characterName} (${c.worldActorId})`);
        continue;
      }
      try {
        await updateDDBCharacter(actor);
        updated += 1;
      } catch (err) {
        logger.error(`Failed to update ${c.characterName} (${c.characterId}) to DDB`, err);
        ui.notifications?.error(`Failed to update ${c.characterName} - see console`);
      }
    }
    ui.notifications?.info(`Updated ${updated} of ${targets.length} character(s) to DDB.`);
    this.partyState.charactersLoaded = false;
    await this._loadCharacters();
  }


  static async _onPullInventory(this: DDBPartySync) {
    if (!DDBPartySync._isPatreonSupporter()) {
      ui.notifications?.warn("Party inventory sync requires a Patreon supporter key");
      return;
    }
    if (!this.campaignId) {
      ui.notifications?.warn("Set a campaign id before pulling party inventory");
      return;
    }
    this.partyState.inventoryStatus = "Pulling party inventory...";
    this.render(false);
    try {
      const result = await DDBPartyInventoryImporter.pull({
        campaignId: this.campaignId,
        actor: this.isPartyActor ? this.actor : null,
        create: !this.isPartyActor,
      });
      if (!result) {
        this.partyState.inventoryStatus = "Pull failed (see console)";
      } else {
        this.partyState.inventoryStatus = `Synced: ${result.creates ?? 0} created, ${result.updates ?? 0} updated, ${result.deletes ?? 0} removed`;
        if (!this.actor && result.actor) this.actor = result.actor;
      }
    } catch (err: any) {
      this.partyState.inventoryStatus = `Pull failed: ${err?.message ?? err}`;
    }
    const snapshot = await this._partyInventorySnapshot();
    if (snapshot) {
      this.partyState.partyItemCount = snapshot.partyItemCount;
      this.partyState.partyCurrencySummary = snapshot.partyCurrencySummary;
    }
    this.render(false);
  }

  static _onOpenPartyActor(this: DDBPartySync) {
    if (!this.actor) return;
    this.actor.sheet?.render(true);
  }

  /* -------------------------------------------- */
  /*  Factory                                     */
  /* -------------------------------------------- */

  static open({ actor = null, campaignId = null }: { actor?: any; campaignId?: string | null } = {}) {
    const app = new this({ actor, campaignId });
    app.render(true);
    return app;
  }

}
