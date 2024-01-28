import utils from "./utils.js";

class AdvancedDialog {

  /**
   * A class that constructs a chooser dialog with the given prompt information and buttons.
   *
   * @param {Array} inputs - An array of input fields for the dialog.
   *   @param {string} input.label - The label of the input field.
   *   @param {string} input.type - The type of the input field.
   *   @param {Array} input.options - The options of the input field. This varies depending on the type, see notes below.
   * @param {Array} buttons - An array of buttons for the dialog.
   *   @param {string} button.label - The label of the button.
   *   @param {string} button.value - The value associated with the button.
   *   @param {function} button.callback - The (optional) callback function for the button.
   * @param {object} config - The configuration object for the dialog.
   *   @param {string} config.title - The title of the dialog.
   *   @param {string} config.defaultButton - The default button label.
   *   @param {function} config.close - The callback function for closing the dialog.
   *   @param {object} config.options - Additional options for the foundry Dialog.
   *   @param {function} config.render - Optional function to pass to render call for Dialog.
   */
  constructor(inputs = [], buttons = [], // prompt information
    { title = "", defaultButton = "OK", close = (resolve) => resolve({ success: false }), options = {}, render = null } = {}, // dialog config
  ) {
    this.inputs = inputs;
    this.buttons = buttons;
    this.dialog = null;

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
   * @param {type} id - The ID of the input element associated with the label.
   * @param {type} label - The text to be displayed as the label.
   * @return {string} The generated HTML for the table header label.
   */
  static _generateTableHeaderLabel(id, label) {
    return `<th><label for="ddb-${id}">${label}</label></th>`;
  }

  /**
   * Generates the HTML stub for a selection element based on the given type, label, options, and index.
   *
   * @param {string} type - The type of the selection element.
   * @param {string} label - The label of the selection element.
   * @param {array} options - The options for the selection element.
   * @param {number} idx - The index of the selection element.
   * @return {string} The HTML stub for the selection element.
   */
  static _generateSelectionHtmlStub(type, label, options, idx) {
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
          .map((entry, idx) => {
            const selected = entry.selected ? "selected" : "";
            return `<option value="${idx}" ${selected}>${entry.label}</option>`;
          })
          .join("\n");
        return `${thLabel}<td><select id="ddb-${idx}">${optionString}</select></td>`;
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
   * @param {Array} data - An array of objects containing type, label, and options.
   * @return {string} The generated HTML.
   */
  _generateSelectionHtml() {
    return [
      `<table class="ddb-selection-table">`,
      ...this.inputs.map(({ type, label, options }, id) => {
        const rowContent = AdvancedDialog._generateSelectionHtmlStub(type, label, options, id);
        return `<tr>${rowContent}</tr>`;
      }),
      `</table>`
    ].join(`\n`);
  };


  /**
   * Parses the selection results based on the given inputs, HTML, and checked text.
   *
   * @param {HTMLElement} html - The HTML element to parse.
   * @return {Array} The parsed selection results.
   */
  _parseSelectionResults(html) {
    const results = this.inputs
      .map((input, idx) => {
        switch (input.type.toLowerCase()) {
          case "label":
            return null;
          case "radio":
          case "checkbox": {
            return html.find(`input#ddb-${idx}`)[0].checked;
          }
          case "number":
            return html.find(`input#ddb-${idx}`)[0].valueAsNumber;
          case "select":
            // the value is the index of the selected option
            return input.options[html.find(`select#ddb-${idx}`).val()].value;
          default:
            return html.find(`input#ddb-${idx}`)[0].value;
        }
      });
    return results;
  }

}


export class ChooserDialog extends AdvancedDialog {

  /**
   * Asynchronously waits for the dialog choices to be made or closed.
   *
   * @return {Promise} A promise that resolves when the action is completed.
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
    return new Promise((resolve) => {

      const buttonObject = (this.buttons.length > 0)
        ? this.buttons.reduce((o, button) => ({
          ...o,
          [button.label]: {
            label: button.label,
            callback: (html) => {
              const results = {
                button,
                results: this._parseSelectionResults(html),
                inputs: this.inputs,
                success: true,
              };
              if (utils.isFunction(button.callback)) {
                // button.callback(results, html).then(() => {
                //   console.warn("Callbacj resykts", results);
                //   resolve(results);
                // });
                resolve(button.callback(results, html));
              } else {
                resolve(results);
              }
            },
          }
        }), {})
        // inserts default button
        : {
          defaultButton: {
            label: this.config.defaultButtonLabel,
            callback: (html) =>
              resolve({
                button: { value: "default", label: this.config.defaultButtonLabel },
                results: this._parseSelectionResults(html),
                inputs: this.inputs,
                success: true,
              }),
          }
        };

      this.dialog = new Dialog(
        {
          title: this.config.title,
          content: this._generateSelectionHtml(),
          default: this.buttons.find((b) => b.default)?.label ?? this.config.defaultButtonLabel,
          close: (...abc) => this.config.close(resolve, ...abc),
          buttons: buttonObject,
          render: this.config.render,
        },
        {
          classes: this.config.classes,
          focus: true,
          ...this.config.options
        }
      );
      this.dialog.render(true);
    });
  }

  static async Ask(...args) {
    const dialog = new ChooserDialog(...args);
    return dialog.ask();
  }
}
