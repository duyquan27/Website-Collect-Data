import {
  onValue,
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/9.8.3/firebase-database.js";
import { color } from "./color-picker.js";
import { database } from "./firebase.js";

const loadingSensor = document.querySelector(".loader-container.sensor-loader");
const loadingColor = document.querySelector(".loader-container.color-loader");

const tableSensor = document.querySelector(".responsive-table");
const optionsSelect = document.querySelector(".color-selector .options");

const btnSaveSensor = document.querySelector("#btn-save-sensor");
const btnSaveColor = document.querySelector("#btn-save-color");

const optionMenu = document.querySelector(".select-menu"),
  selectBtn = optionMenu.querySelector(".select-btn"),
  sBtn_text = optionMenu.querySelector(".sBtn-text");

const loadingContainer = document.querySelector(".loading");
loadingContainer.style.display = "block";
setTimeout(() => {
  loadingContainer.style.display = "none";
}, 1500);

let locationColorSelect = {
  id: "",
  name: "",
  color: "",
};

let thresholdList = [];

selectBtn.addEventListener("click", () =>
  optionMenu.classList.toggle("active")
);

onValue(ref(database, "settings/sensor"), (snapshot) => {
  const data = snapshot.val();
  const names = Object.keys(data);
  const values = Object.values(data);

  tableSensor.innerHTML = "";
  names.forEach((name, index) => {
    tableSensor.appendChild(
      tableRowElementCreated(
        name,
        values[index].min,
        values[index].max,
        values[index].minT,
        values[index].maxT
      )
    );

    const thresholdValue = getValueSlider(name);
    thresholdList.push({ name: name, value: thresholdValue });

    document.querySelectorAll(".table-row").forEach((el) => {
      const nameEl = el.id;
      el.addEventListener("change", () => {
        const thresholdValue = getValueSlider(nameEl);
        thresholdList.map((el) => {
          if (el.name === nameEl) {
            el.value = thresholdValue;
          }
        });
      });
    });
  });
});

onValue(ref(database, "location"), (snapshot) => {
  const data = snapshot.val();
  const nameLocationList = Object.keys(data);
  const values = Object.values(data);

  optionsSelect.innerHTML = "";
  nameLocationList.forEach((name, index) => {
    optionsSelect.appendChild(optionColorElementCreated(name));
  });

  optionMenu.querySelectorAll(".option").forEach((option) => {
    option.addEventListener("click", () => {
      let selectedOption = option.querySelector(".option-text").innerText;
      sBtn_text.innerText = selectedOption;
      optionMenu.classList.remove("active");
      locationColorSelect.name = selectedOption;
    });
  });
});

btnSaveColor.addEventListener("click", (e) => {
  console.log(color);
  if (color.length === 0) {
    alert("Please select a color");
    return;
  } else {
    set(ref(database, `settings/color/${locationColorSelect.name}`), color);
    loadingColor.style.display = "flex";
    setTimeout(() => {
      loadingColor.style.display = "none";
      // window.location.reload();
    }, 2000);
  }
});

btnSaveSensor.addEventListener("click", () => {
  thresholdList.forEach((el) => {
    set(ref(database, "settings/sensor/" + el.name + "/minT"), el.value[0]);
    set(ref(database, "settings/sensor/" + el.name + "/maxT"), el.value[1]);
  });

  loadingSensor.style.display = "flex";
  setTimeout(() => {
    // window.location.reload();
    loadingSensor.style.display = "none";
  }, 2000);
});

const getValueSlider = (name) => {
  const parent = document.querySelector(`#${name} .range-slider`);
  const rangeS = parent.querySelectorAll(`#${name} input[type=range]`),
    numberS = parent.querySelectorAll(`#${name} input[type=number]`);

  rangeS.forEach(function (el) {
    el.oninput = function () {
      const slide1 = parseFloat(rangeS[0].value),
        slide2 = parseFloat(rangeS[1].value);

      if (slide1 > slide2) {
        [slide1, slide2] = [slide2, slide1];
      }

      numberS[0].value = slide1;
      numberS[1].value = slide2;
    };
  });

  numberS.forEach(function (el) {
    el.oninput = function () {
      const number1 = parseFloat(numberS[0].value),
        number2 = parseFloat(numberS[1].value);

      if (number1 > number2) {
        const tmp = number1;
        numberS[0].value = number2;
        numberS[1].value = tmp;
      }

      rangeS[0].value = number1;
      rangeS[1].value = number2;
    };
  });

  return [numberS[0].value, numberS[1].value];
};

const tableRowElementCreated = (
  name,
  minValue,
  maxValue,
  minThreshold,
  maxThreshold
) => {
  const liTableRow = document.createElement("li");
  liTableRow.classList.add("table-row");
  liTableRow.setAttribute("id", name);

  const divCol1 = document.createElement("div");
  divCol1.classList.add("col", "col-1");
  divCol1.setAttribute("data-label", name);
  divCol1.textContent = name.toUpperCase();

  const divCol2 = document.createElement("div");
  divCol2.classList.add("col", "col-2");
  divCol2.setAttribute("data-label", "threshold");

  const divRangerSlider = document.createElement("div");
  divRangerSlider.classList.add("range-slider");

  const label = document.createElement("label");
  label.textContent = "Levels:";

  const divNumberGroup = document.createElement("div");
  divNumberGroup.classList.add("number-group");

  const inputNumberMin = document.createElement("input");
  inputNumberMin.classList.add("number-input");
  inputNumberMin.setAttribute("type", "number");
  inputNumberMin.setAttribute("value", minThreshold);
  inputNumberMin.setAttribute("min", minValue);
  inputNumberMin.setAttribute("max", maxValue);

  const span = document.createElement("span");
  span.textContent = "to";

  const inputNumberMax = document.createElement("input");
  inputNumberMax.classList.add("number-input");
  inputNumberMax.setAttribute("type", "number");
  inputNumberMax.setAttribute("value", maxThreshold);
  inputNumberMax.setAttribute("min", minValue);
  inputNumberMax.setAttribute("max", maxValue);

  const divRangeGroup = document.createElement("div");
  divRangeGroup.classList.add("range-group");

  const inputRangeMin = document.createElement("input");
  inputRangeMin.classList.add("range-input");
  inputRangeMin.setAttribute("value", minThreshold);
  inputRangeMin.setAttribute("min", minValue);
  inputRangeMin.setAttribute("max", maxValue);
  inputRangeMin.setAttribute("step", "1");
  inputRangeMin.setAttribute("type", "range");

  const inputRangeMax = document.createElement("input");
  inputRangeMax.classList.add("range-input");
  inputRangeMax.setAttribute("value", maxThreshold);
  inputRangeMax.setAttribute("min", minValue);
  inputRangeMax.setAttribute("max", maxValue);
  inputRangeMax.setAttribute("step", "1");
  inputRangeMax.setAttribute("type", "range");

  divNumberGroup.appendChild(inputNumberMin);
  divNumberGroup.appendChild(span);
  divNumberGroup.appendChild(inputNumberMax);
  divRangeGroup.appendChild(inputRangeMin);
  divRangeGroup.appendChild(inputRangeMax);
  divRangerSlider.appendChild(label);
  divRangerSlider.appendChild(divNumberGroup);
  divRangerSlider.appendChild(divRangeGroup);
  divCol2.appendChild(divRangerSlider);

  liTableRow.appendChild(divCol1);
  liTableRow.appendChild(divCol2);
  return liTableRow;
};

const optionColorElementCreated = (data) => {
  const liOption = document.createElement("li");
  liOption.classList.add("option");

  const spanColorCircle = document.createElement("span");
  spanColorCircle.classList.add("color-circle");
  spanColorCircle.style.backgroundColor = data.color;

  const spanOptionText = document.createElement("span");
  spanOptionText.classList.add("option-text");
  spanOptionText.textContent = data;

  liOption.appendChild(spanColorCircle);
  liOption.appendChild(spanOptionText);

  return liOption;
};
