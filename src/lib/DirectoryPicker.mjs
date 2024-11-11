/**
 * Game Settings: Directory
 */

export class DirectoryPicker extends FilePicker {
  constructor(options = {}) {
    super(options);
  }

  _onSubmit(event) {
    event.preventDefault();
    const path = event.target.target.value;
    const activeSource = this.activeSource;
    const bucket = this.sources.s3?.bucket && this.sources.s3.bucket !== ""
      ? this.sources.s3.bucket
      : null;

    // console.warn("Clicked", {
    //   event,
    //   bucket,
    //   target: event.target.bucket,
    //   targetTargget: event.target.target,
    //   path,
    //   pathv12,
    //   currentTarget,
    //   currentTargetValue: currentTarget.value,
    //   activeSource,
    //   thisBucket: this.sources.s3.bucket,
    // })

    this.field.value = DirectoryPicker.format({
      activeSource,
      bucket,
      path,
    });
    this.close();
  }

  // returns the type "Directory" for rendering the SettingsConfig
  static Directory(val) {
    return val;
  }

  // formats the data into a string for saving it as a GameSetting
  static format(value) {
    return value.bucket !== null && value.bucket !== ""
      ? `[${value.activeSource}:${value.bucket}] ${value.path ?? value.current ?? ""}`
      : `[${value.activeSource}] ${value.path ?? value.current ?? ""}`;
  }

  // parses the string back to something the FilePicker can understand as an option
  static parse(str) {
    let matches = str.match(/\[(.+)\]\s*(.+)/);
    if (matches) {
      let source = matches[1];
      const current = matches[2].trim();
      const [s3, bucket] = source.split(":");
      if (bucket !== undefined) {
        return {
          activeSource: s3,
          bucket: bucket,
          current: current,
          fullPath: str,
        };
      } else {
        return {
          activeSource: s3,
          bucket: null,
          current: current,
          fullPath: str,
        };
      }
    }
    // failsave, try it at least
    return {
      activeSource: "data",
      bucket: null,
      current: str,
    };
  }

  // Adds a FilePicker-Simulator-Button next to the input fields
  static processHtml(html) {
    $(html)
      .find(`input[data-dtype="Directory"], .ddb-directory`)
      .each((index, element) => {
        // disable the input field raw editing
        $(element).prop("readonly", true);

        // if there is no button next to this input element yet, we add it
        if (!$(element).next().length) {
          let picker = new DirectoryPicker({
            field: $(element)[0],
            ...DirectoryPicker.parse($(element).val()),
          });
          let pickerButton = $(
            '<button type="button" class="file-picker" data-type="imagevideo" data-target="img" title="Pick directory"><i class="fas fa-file-import fa-fw"></i></button>',
          );
          pickerButton.on("click", () => {
            picker.render(true);
          });
          $(element).parent().append(pickerButton);
        }
      });
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // remove unnecessary elements
    $(html).find("ol.files-list").remove();
    $(html).find("footer div").remove();
    $(html).find("footer button").text("Select Directory");
  }


  /**
   * Browse files using Forge API
   * @param {string} source
   * @param {string} target directory name
   * @param {object} options options passed to FilePicker
   * @returns {Promise<string|undefined>} path to the created directory, or undefined if
   */
  static async browseForgeFiles(source, target, options = {}) {
    if (target.startsWith(ForgeVTT.ASSETS_LIBRARY_URL_PREFIX)) {
      if (options.wildcard)
        options.wildcard = target;
      target = target.slice(ForgeVTT.ASSETS_LIBRARY_URL_PREFIX.length);
      target = target.split("/").slice(1, -1).join("/"); // Remove userid from url to get target path
    }

    const response = await ForgeAPI.call('assets/browse', { path: decodeURIComponent(target), options });
    if (!response || response.error) {
      ui.notifications.error(response ? response.error : "An unknown error occured accessing The Forge API");
      return { target, dirs: [], files: [], gridSize: null, private: false, privateDirs: [], extensions: options.extensions };
    }
    // Should be decodeURIComponent but FilePicker's _onPick needs to do encodeURIComponent too, but on each separate path.
    response.target = decodeURI(response.folder);
    delete response.folder;
    response.dirs = response.dirs.map((d) => d.path.slice(0, -1));
    response.files = response.files.map((f) => f.url);
    // 0.5.6 specific
    response.private = true;
    response.privateDirs = [];
    response.gridSize = null;
    response.extensions = options.extensions;
    return response;
  }

  /**
   * Browse files using FilePicker
   * @param {string} source
   * @param {string} target directory name
   * @param {object} options options passed to FilePicker
   * @returns {Promise<string|undefined>} path to the created directory, or undefined if
   */
  static async browseFiles(source, target, options = {}) {
    if (typeof ForgeVTT !== "undefined" && ForgeVTT?.usingTheForge) {
      if (target.startsWith(ForgeVTT.ASSETS_LIBRARY_URL_PREFIX)) source = "forgevtt";

      if (source === "forgevtt") {
        return DirectoryPicker.browseForgeFiles(source, target, options);
      }
    }

    return FilePicker.browse(source, target, options);
  }
}
