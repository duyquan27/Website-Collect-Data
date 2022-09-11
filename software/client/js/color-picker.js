const config = {
  baseColors: [
    [46, 204, 113],
    [52, 152, 219],
    [155, 89, 182],
    [52, 73, 94],
    [241, 196, 15],
    [230, 126, 34],
    [231, 76, 60],
  ],
  lightModifier: 20,
  darkModifier: 0,
  transitionDuration: 200,
  transitionDelay: 25,
  variationTotal: 10,
};

let color = [];

let state = {
  activeColor: [0, 0, 0],
};

const convertArrayToRGB = (color) => {
  let rgb = "rgb(";
  for (let i = 0; i < color.length; i++) {
    rgb += color[i].toString();
    if (i < color.length - 1) {
      rgb += ", ";
    }
  }
  return rgb + ")";
};

const setActiveBaseColor = (el) => {
  if (document.querySelector(".color.active"))
    document.querySelector(".color.active").classList.remove("active");
  el.classList.add("active");
};

const setActiveColor = (el) => {
  if (document.querySelector(".color-var.active"))
    document.querySelector(".color-var.active").classList.remove("active");
  el.classList.add("active");
  state.activeColor = el.getAttribute("data-color").split(",");
  color = convertArrayToRGB(el.getAttribute("data-color").split(","));
};

const createColorPicker = (callback) => {
  document
    .querySelector(".color-picker")
    .insertAdjacentHTML("beforeend", '<div class="base-colors"></div>');
  document
    .querySelector(".color-picker")
    .insertAdjacentHTML("beforeend", '<div class="varied-colors"></div>');
  document
    .querySelector(".color-picker")
    .insertAdjacentHTML("beforeend", '<div class="active-color"></div>');
  document
    .querySelector(".color-picker")
    .insertAdjacentHTML("beforeend", '<div class="color-history"></div>');

  callback();
};

const appendBaseColors = () => {
  for (let i = 0; i < config.baseColors.length; i++) {
    document
      .querySelector(".base-colors")
      .insertAdjacentHTML(
        "beforeend",
        '<div class="color" data-color="' +
          config.baseColors[i].join() +
          '" style="background-color: rgb(' +
          config.baseColors[i].join() +
          ');"></div>'
      );
  }
};

const setBackgroundColor = () => {
  document.querySelector(
    "body"
  ).style.backgroundColor = `rgb(${state.activeColor})`;
};

const createVariations = (color, callback) => {
  document.querySelector(".varied-colors").innerHTML = "";

  for (var i = 0; i < config.variationTotal; i++) {
    var newColor = [];

    for (var x = 0; x < color.length; x++) {
      var modifiedColor = Number(color[x]) - 100 + config.lightModifier * i;

      if (modifiedColor <= 0) {
        modifiedColor = 0;
      } else if (modifiedColor >= 255) {
        modifiedColor = 255;
      }

      newColor.push(modifiedColor);
    }

    document
      .querySelector(".varied-colors")
      .insertAdjacentHTML(
        "beforeend",
        '<div data-color="' +
          newColor +
          '" class="color-var" style="background-color: rgb(' +
          newColor +
          ');"></div>'
      );
  }

  callback();
};

const setDelays = (callback) => {
  document.querySelectorAll(".color-var").forEach((el, index) => {
    el.style.transitionDelay = `${config.transitionDelay * index}ms`;
  });

  callback();
};

const showVariations = () => {
  setTimeout(() => {
    document.querySelectorAll(".color-var").forEach((el) => {
      el.classList.add("visible");
    });
  }, config.transitionDelay * config.variationTotal);
};

const hideVariations = (callback) => {
  if (document.querySelectorAll(".color-var")) {
    document.querySelectorAll(".color-var").forEach((el) => {
      el.classList.remove("visible");
      el.classList.remove("active");
    });
  }

  setTimeout(() => {
    callback();
  }, config.transitionDelay * config.variationTotal);
};

createColorPicker(() => {
  appendBaseColors();
});

document.querySelectorAll(".color").forEach((el) => {
  el.addEventListener("click", () => {
    var color = el.getAttribute("data-color").split(",");
    setActiveBaseColor(el);

    hideVariations(() => {
      createVariations(color, () => {
        setDelays(() => {
          showVariations();
        });
      });
    });

    setTimeout(() => {
      document.querySelectorAll(".color-var").forEach((el) => {
        el.addEventListener("click", () => {
          setActiveColor(el);
        });
      });
    }, 500);
  });
});

export { color };
