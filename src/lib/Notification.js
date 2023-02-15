/**
 * Shows notifcations and hints to the user
 */
const MARGIN = 10;

const registerNotifications = () => {
  // register the notification global object

  if ($("#ddbimporter-notifications").length === 0) {
    $("body").append(`<div id="ddbimporter-notifications"></div>`);
  }
  if ($("#ddbimporter-hints").length === 0) {
    $("body").append(`<div id="ddbimporter-hints"></div>`);
  }

  game.modules.get("ddb-importer").api.notification = {
    clear: () => {
      $("#ddbimporter-notifications div").fadeOut(200, () => {
        $("#ddbimporter-notifications").empty();
      });
    },
    show: (message, timeout = 4000) => {
      $("#ddbimporter-notifications").css("left", $("#players").css("left"));
      // prettier-ignore
      $("#ddbimporter-notifications").css("bottom", $("#players").height() + (2 * MARGIN));

      let note = $(`<div style="display: none"></div>`).append(message);
      $("#ddbimporter-notifications").append(note);
      $(note).fadeIn(200);

      if (timeout)
        setTimeout(() => {
          $(note).fadeOut(200, () => {
            $(note).remove();
          });
        }, timeout);
      else
        $(note).append('<p style="text-align: center; color: #7e7e7e; margin: 0px;"><small>Click to close</small>');

      $(note).on("click", () => {
        $(note).fadeOut(200, () => {
          $(note).remove();
        });
      });
    },
  };
  game.modules.get("ddb-importer").api.hint = {
    clear: () => {
      $("#ddbimporter-hints div").hide(200, () => {
        $("#ddbimporter-hints").empty();
      });
    },
    show: (message, options = {}) => {
      return new Promise((resolve) => {
        $("#ddbimporter-hints").css("width", options.width ? options.width : 300);

        // construct the note
        let note = $(`<div style="display: none"></div>`);
        $(note).append(message);
        $(note).append('<div class="buttons"></div>');
        $("#ddbimporter-hints").append(note);
        $(note).fadeIn(200);

        if (!options.align) options.align = options.element ? "RIGHT" : "CENTER";

        let anchor = {
          width: 0,
          height: 0,
          top: Math.round(window.innerHeight / 2),
          left: Math.round(window.innerWidth / 2),
        };

        if (options.element) {
          anchor = Object.assign(
            { width: $(options.element).width(), height: $(options.element).height() },
            $(options.element).offset()
          );
        }
        const noteInfo = Object.assign(
          { width: $("#ddbimporter-hints").width(), height: $("#ddbimporter-hints").height() },
          $("#ddbimporter-hints").position()
        );

        switch (options.align) {
          case "RIGHT":
            $("#ddbimporter-hints").css("top", anchor.top);
            $("#ddbimporter-hints").css("left", anchor.left + anchor.width + MARGIN);
            break;
          case "LEFT":
            $("#ddbimporter-hints").css("top", anchor.top);
            $("#ddbimporter-hints").css("left", anchor.left - noteInfo.width - MARGIN);
            break;
          case "TOP":
            $("#ddbimporter-hints").css("top", anchor.top - noteInfo.height - MARGIN);
            $("#ddbimporter-hints").css("left", anchor.left);
            break;
          case "BOTTOM":
            $("#ddbimporter-hints").css("top", anchor.top + anchor.height + MARGIN);
            $("#ddbimporter-hints").css("left", anchor.left);
            break;

          default:
            // eslint-disable-next-line no-mixed-operators
            $("#ddbimporter-hints").css("top", anchor.top - Math.round(noteInfo.height / 2));
            // eslint-disable-next-line no-mixed-operators
            $("#ddbimporter-hints").css("left", anchor.left - Math.round(noteInfo.width / 2));
        }

        if (options.buttons) {
          for (let name of options.buttons) {
            let btn = $("<button>" + name + "</button>");
            $("div.buttons", note).append(btn);
            $(btn).on("click", () => {
              $(note).fadeOut(100, () => {
                $(note).remove();
                resolve(name);
              });
            });
          }
        }
        if (options.hide) {
          $(options.hide.selector).on(options.hide.event, () => {
            $(note).fadeOut(100, () => {
              $(note).remove();
              resolve(true);
            });
          });
        }
      });
    },
  };
};

export default registerNotifications;
