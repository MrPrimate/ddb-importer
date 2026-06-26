import { DDBProxy, logger, PatreonHelper, Secrets, utils } from "../lib/_module";

export default class MonsterReplacer {

  name: string;

  constructor({
    name,
  }: { name?: string } = {}) {
    this.name = name;
  }

  static fetchUpdatedMonsterInfo(ids: (string | number)[] = []): Promise<IMonsterReplacerData[]> {
    const cobaltCookie = Secrets.getCobalt();
    const parsingApi = DDBProxy.getProxy();
    const betaKey = PatreonHelper.getPatreonKey();
    const body = {
      cobalt: cobaltCookie,
      betaKey: betaKey,
      ids: Array.from(new Set(ids.map((id) => Number.parseInt(String(id))))), // remove duplicates from ids;
      type: "id",
    };

    return new Promise((resolve, reject) => {
      fetch(`${parsingApi}/proxy/monsters/hints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body), // body data type must match "Content-Type" header
      })
        .then((response) => response.json())
        .then((data) => {
          if (!data.success) {
            utils.munchNote(`Failure: ${data.message}`);
            reject(data.message);
          }
          return data.data as IMonsterReplacerData[];
        })
        .then((data) => resolve(data))
        .catch((error) => reject(error));
    });
  }


  async chooseMonstersToReplace(monsterData: IMonsterReplacerData[]): Promise<number[]> {

    logger.info(`Selecting Monsters for ${this.name} - (${monsterData.length} possible monsters for replacement)`);

    // const content = await renderTemplate("modules/ddb-importer/handlebars/adventure/choose-monsters.hbs", {
    //   monsterData: monsterData,
    // });

    const fields = foundry.applications.fields;

    const options = monsterData.map((m) => {
      return {
        label: `${m.name2014} (${m.id2014}) to ${m.name2024} (${m.id2024})`,
        value: m.id2014,
        selected: false,
        disabled: false,
      };
    });

    const multiSelectInput = fields.createMultiSelectInput({
      options,
      sort: true,
      type: "checkboxes",
      name: "ids",
    });


    const content = `${multiSelectInput.outerHTML}`;

    const response = await foundry.applications.api.DialogV2.wait({
      rejectClose: false,
      buttons: [
        {
          action: "select",
          label: "Change Selected",
          icon: "fa-solid fa-floppy-disk",
          callback: (_event, button, _dialog) => new foundry.applications.ux.FormDataExtended(button.form).object,
        },
        {
          action: "all",
          label: "Change All",
          icon: "fa-solid fa-check",
          callback: (_event, _button, _dialog) => {
            const ids = monsterData.map((m) => m.id2014);
            return { ids: ids };
          },
        },
        {
          action: "none",
          label: "Change None",
          icon: "fa-solid fa-ban",
          callback: (_event, _button, _dialog) => {
            return { ids: [] };
          },
        },
      ],
      window: { title: "Select Monsters to Update to latest version" },
      content,
      classes: ["ddb-monster-select-dialog"],
    }) as { ids: string[] };

    return response.ids.map((id) => Number.parseInt(id));
  }

}
