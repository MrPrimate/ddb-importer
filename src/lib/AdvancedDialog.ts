import utils from "./Utils";

/**
 * Maps the legacy Dialog `options` bag (`{ width, height }`) onto a DialogV2
 * `position` object. Non-numeric values (e.g. the historic `height: "auto"`)
 * are dropped because DialogV2 auto-sizes.
 */
export function optionsToPosition(options: Record<string, any> = {}): Record<string, number> {
  const position: Record<string, number> = {};
  if (typeof options?.width === "number") position.width = options.width;
  if (typeof options?.height === "number") position.height = options.height;
  return position;
}

class AdvancedDialog {

  inputs: IAdvancedDialogInput[];

  buttons: IAdvancedDialogButton[];

  config: {
    title: string;
    defaultButtonLabel: string;
    close: (...args: any[]) => unknown;
    options: Record<string, any>;
    render: ((...args: any[]) => unknown) | null;
    classes: string[];
  };

  /**
   * A class that constructs a chooser dialog with the given prompt information and buttons.
   *
   * @param {{label: string, type: string, options: Array}[]} inputs An array of input fields for the dialog.
   *   input.label The label of the input field.
   *   input.type The type of the input field.
   *   input.options The options of the input field. This varies depending on the type, see notes below.
   * @param {{label: string, value: string, callback: Function}[]} buttons An array of buttons for the dialog.
   *   button.label The label of the button.
   *   button.value The value associated with the button.
   *   button.callback The (optional) callback function for the button.
   * @param {object} config The configuration object for the dialog.
   *   @param {string} config.title The title of the dialog.
   *   @param {string} config.defaultButton The default button label.
   *   @param {Function} config.close The callback function for closing the dialog.
   *   @param {object} config.options Additional options for the foundry Dialog.
   *   @param {Function} config.render Optional function to pass to render call for Dialog.
   */
  constructor(inputs: IAdvancedDialogInput[] = [], buttons: IAdvancedDialogButton[] = [], // prompt information
    { title = "", defaultButton = "OK", close = () => ({ success: false }), options = {}, render = null as ((...args: any[]) => void) | null } = {}, // dialog config
  ) {
    this.inputs = inputs;
    this.buttons = buttons;

    this.config = {
      title,
      defaultButtonLabel: defaultButton,
      close,
      options,
      render,
      classes: ["dialog", "ddb-advanced-dialog"],
    };
  }

  /**
   * Generates the table header label HTML element with the specified ID and label text.
   *
   * @param {type} id The ID of the input element associated with the label.
   * @param {type} label The text to be displayed as the label.
   * @returns {string} The generated HTML for the table header label.
   */
  static _generateTableHeaderLabel(id: string | number, label: string) {
    return `<th><label for="ddb-${id}">${label}</label></th>`;
  }

  /**
   * Generates the HTML stub for a selection element based on the given type, label, options, and index.
   *
   * @param {string} type The type of the selection element.
   * @param {string} label The label of the selection element.
   * @param {Array} options The options for the selection element.
   * @param {number} idx The index of the selection element.
   * @returns {string} The HTML stub for the selection element.
   */
  static _generateSelectionHtmlStub(type: string, label: string, options: any, idx: number) {
    const thLabel = AdvancedDialog._generateTableHeaderLabel(idx, label);
    switch (type.toLowerCase()) {
      case "button":
        return "";
      case "checkbox": {
        const checked = options?.checked ? "checked" : "";
        return `${thLabel}<td><input type="${type}" id="ddb-${idx}" ${checked} value="${idx}"/></td>`;
      }
      case "label":
        return `<td class="colspan2">${label}</td>`;
      case "radio": {
        const checked = options?.checked ? "checked" : "";
        const group = options?.group ?? "radio";
        return `${thLabel}<td><input type="${type}" id="ddb-${idx}" ${checked} value="${idx}" name="${group}"/></td>`;
      }
      case "select": {
        const optionString = options
          .map((entry: Record<string, any>, idx: number) => {
            const selected = entry.selected ? "selected" : "";
            return `<option value="${idx}" ${selected}>${entry.label}</option>`;
          })
          .join("\n");
        return `${thLabel}<td><select id="ddb-${idx}">${optionString}</select></td>`;
      }
      case "number": {
        let value;
        if (utils.isObject(options)) {
          const values = [];
          for (const [key, v] of Object.entries(options)) {
            const stringValue = `${v}`.trim();
            values.push(`${key}="${stringValue}"`);
          }
          value = values.join(" ");
        } else if (Array.isArray(options)) {
          const values = [];
          for (const option of options) {
            values.push(`${option.key}="${option.value}"`);
          }
          value = values.join(" ");
        } else if (utils.isString(options)) {
          value = `value="${options}"`;
        } else {
          value = `value=""`;
        }
        return `${thLabel}</th><td><input type="${type}" id="ddb-${idx}" ${value}/></td>`;
      }
      default: {
        const value = Array.isArray(options) ? options[0] : options;
        return `${thLabel}</th><td><input type="${type}" id="ddb-${idx}" value="${value}"/></td>`;
      }
    }
  }


  /**
   * Generate the HTML for the selection table.
   *
   * @returns {string} The generated HTML.
   */
  _generateSelectionHtml() {
    return [
      `<table class="ddb-selection-table">`,
      ...this.inputs.map(({ type, label, options }, id) => {
        const rowContent = AdvancedDialog._generateSelectionHtmlStub(type, label, options, id);
        return `<tr>${rowContent}</tr>`;
      }),
      `</table>`,
    ].join(`\n`);
  };


  /**
   * Parses the selection results from the DialogV2 form element.
   *
   * @param {HTMLElement} form The `<form>` element of the dialog (from `button.form`).
   * @returns {Array} The parsed selection results, positionally aligned to `this.inputs`.
   */
  _parseSelectionResults(form: HTMLElement) {
    const results = this.inputs
      .map((input, idx) => {
        switch (input.type.toLowerCase()) {
          case "label":
            return null;
          case "radio":
          case "checkbox":
            return (form.querySelector(`#ddb-${idx}`) as HTMLInputElement).checked;
          case "number":
            return (form.querySelector(`#ddb-${idx}`) as HTMLInputElement).valueAsNumber;
          case "select": {
            // the select's value is the index of the selected option
            const select = form.querySelector(`#ddb-${idx}`) as HTMLSelectElement;
            return input.options?.[Number(select.value)].value;
          }
          default:
            return (form.querySelector(`#ddb-${idx}`) as HTMLInputElement).value;
        }
      });
    return results;
  }

}


export class ChooserDialog extends AdvancedDialog {

  /**
   * Asynchronously waits for the dialog choices to be made or closed.
   *
   * @returns {Promise} A promise that resolves when the action is completed.
   * @example
   *  let dialog = new DDBImporter.DialogHelper.ChooserDialog([{
   *      label: 'Group 1 Radio Label 1',
   *      type: 'radio',
   *      options: {
   *        group: 'group1',
   *      },
   *    }, {
   *      label: 'Group 1 Radio Label 2',
   *      type: 'radio',
   *      options: {
   *        group: 'group1',
   *        checked: true,
   *      },
   *    },
   *    {
   *      label: 'Group 2 Radio Label 1',
   *      type: 'radio',
   *      options: {
   *        group: 'group2',
   *      },
   *    },
   *    {
   *      label: 'Group 2 Radio Label 2',
   *      type: 'radio',
   *      options: {
   *        group: 'group2',
   *      },
   *    },
   *    {
   *      label: 'Default Group Radio Label 1',
   *      type: 'radio',
   *    },
   *    {
   *      label: 'Default Group Radio Label 2',
   *      type: 'radio',
   *    },
   *    {
   *      label: 'Checkbox Label',
   *      type: 'checkbox',
   *      options: {
   *        checked: true,
   *      },
   *    },{
   *      type: 'select',
   *      label: 'Select Dialog Label',
   *      options: [
   *          { label: 'String Option', value: "option1" },
   *          { label: 'Map Option', value: { valuesCanBeObjects: true }, selected:true },
   *          { label: 'Int Option', value: 3 },
   *      ],
   *    }],
   *    [{
   *      label: "Yes",
   *      value: "yes",
   *      callback: () => console.log("Yes was clicked"),
   *    }, {
   *      label: "No",
   *      value: "no"
   *    }, {
   *      label: "<b>Callback Function</b>",
   *      value: "html",
   *      default: true,
   *      callback: (results) => {
   *        console.warn(results);
   *        results.extra =  {
   *          a: 1,
   *          b: 2,
   *        };
   *        console.log("Adding some extra data");
   *      },
   *    }],
   *    {
   *     title: 'A wrapped choice dialog',
   *      options: {
   *        width: 450,
   *      }
   *    });
   *
   *  let result = await d.ask();
   */
  async ask() {
    // The label of the button that should be focused/submitted by default.
    const defaultLabel = this.buttons.find((b) => b.default)?.label ?? this.config.defaultButtonLabel;

    const dialogButtons = (this.buttons.length > 0)
      ? this.buttons.map((button, index) => ({
        action: `button-${index}`,
        label: button.label,
        default: button.label === defaultLabel,
        callback: (_event: Event, htmlButton: HTMLButtonElement) => {
          const results = {
            button,
            results: this._parseSelectionResults(htmlButton.form!),
            inputs: this.inputs,
            success: true,
          };
          return utils.isFunction(button.callback)
            ? button.callback(results, htmlButton.form)
            : results;
        },
      }))
      // inserts default button
      : [{
        action: "defaultButton",
        label: this.config.defaultButtonLabel,
        default: true,
        callback: (_event: Event, htmlButton: HTMLButtonElement) => ({
          button: { value: "default", label: this.config.defaultButtonLabel },
          results: this._parseSelectionResults(htmlButton.form!),
          inputs: this.inputs,
          success: true,
        }),
      }];

    return foundry.applications.api.DialogV2.wait({
      window: { title: this.config.title },
      content: this._generateSelectionHtml(),
      classes: this.config.classes,
      position: optionsToPosition(this.config.options),
      buttons: dialogButtons,
      rejectClose: false,
      close: (...args: any[]) => this.config.close(...args),
      ...(utils.isFunction(this.config.render) ? { render: this.config.render } : {}),
    } as any);
  }

  static async Ask(...args: any[]) {
    const dialog = new ChooserDialog(...args);
    return dialog.ask();
  }
}
