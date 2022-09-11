import {
  child,
  get,
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/9.8.3/firebase-database.js";
import { database } from "./firebase.js";

const endPoint = "http://localhost:3000/";

const loadingContainer = document.querySelector(".loading");
const chartContainer = document.querySelector(".chart-container");
const chartSelector = document.querySelector(".chart-selector");
const timeRangeSelector = document.querySelector(".inp-wrapper");
const optionMenus = document.querySelectorAll(".select-menu"),
  selectBtns = document.querySelectorAll(".select-btn"),
  sBtn_texts = document.querySelectorAll(".sBtn-text"),
  optionsSelects = document.querySelectorAll(".options");

selectBtns.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    optionMenus[index].classList.toggle("active");
  });
});

const LIST_COLOR = [
  {
    co: "rgb(54, 162, 235)",
  },
  {
    humi: "rgb(255, 206, 86)",
  },
  {
    noise: "rgb(75, 192, 192)",
  },
  {
    shine: "rgb(153, 102, 255)",
  },
  {
    temp: "rgb(255, 159, 64)",
  },
  {
    uv: "rgb(255, 99, 132)",
  },
];

let chartSelect = {
  location: "",
  node: "",
  sensor: "",
};

let LIST_CHART = [];

const getColorSensor = (nameSensor) => {
  const color = LIST_COLOR.find((color) => {
    return color[nameSensor];
  })[nameSensor];
  return color;
};

const convertDateToTimestamp = (date, hms) => {
  if (!date || !hms) return;
  const dateTime = date.split("-");
  const time = hms.split(":");

  const dateObj = new Date(
    +dateTime[0],
    +dateTime[1] - 1,
    +dateTime[2],
    +time[0],
    +time[1]
  );

  return dateObj.getTime();
};

const getRangeValueWithTime = (timeList, valueList, firstTime, lastTime) => {
  const timeRange = timeList.filter((time) => {
    if (firstTime === lastTime) {
      return time >= firstTime;
    } else {
      return time >= firstTime && time <= lastTime;
    }
  });

  return {
    timeRange: timeRange,
    valueRange: timeRange.map((time) => {
      return valueList[timeList.indexOf(time)];
    }),
  };
};

const convertTimestampToDate = (timestamp) => {
  if (!timestamp) return;
  const date = new Date(timestamp);
  const dateString = `${date.getDate()}/${
    date.getMonth() + 1
  }/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
  return dateString;
};

const chartElementCreated = (
  event,
  nameLocation,
  nameNode,
  timeList,
  nameSensors,
  valueSensors
) => {
  const labels = timeList.map((time) => {
    return convertTimestampToDate(Number(time));
  });

  let datasetList = [];
  nameSensors.forEach((nameSensor, index) => {
    const values = valueSensors.map((value, i) => {
      return value[index];
    });

    if (event === "all") {
      const dataset = {
        label: nameSensor,
        backgroundColor: getColorSensor(nameSensor),
        borderColor: getColorSensor(nameSensor),
        data: values,
        tension: 0.1,
      };
      datasetList.push(dataset);
      datasetList.filter((dataset) => {
        return (dataset.hidden = dataset.label === "shine" ? true : false);
      });
    } else if (event === "sensor") {
      const dataset = {
        label: nameSensor,
        backgroundColor: getColorSensor(nameSensor),
        borderColor: getColorSensor(nameSensor),
        data: valueSensors,
        tension: 0.1,
      };
      datasetList.push(dataset);
    }
  });

  const config = {
    type: "line",
    data: {
      labels: labels,
      datasets: datasetList,
    },
    options: {
      responsive: true,
    },
  };

  const chartDiv = document.createElement("div");
  chartDiv.classList.add("chart");
  chartDiv.setAttribute("name", nameLocation);

  const chartTitleDiv = document.createElement("div");
  chartTitleDiv.classList.add("chart-title");
  chartTitleDiv.innerHTML = `<h2>${nameLocation}</h2><p>${nameNode}</p>`;

  const chartContainerDiv = document.createElement("div");
  chartContainerDiv.classList.add("chart-container");

  const canvas = document.createElement("canvas");
  canvas.id = "chart-" + nameLocation + "-" + nameNode;
  chartContainerDiv.appendChild(canvas);

  chartDiv.appendChild(chartTitleDiv);
  chartDiv.appendChild(chartContainerDiv);

  const myChart = new Chart(canvas, config);
  LIST_CHART.push(myChart);

  return chartDiv;
};

const optionElementCreated = (data) => {
  const liOption = document.createElement("li");
  liOption.classList.add("option");
  liOption.id = data;

  const spanOptionText = document.createElement("span");
  spanOptionText.classList.add("option-text");
  spanOptionText.textContent = data;

  liOption.appendChild(spanOptionText);

  return liOption;
};

const countDown = (time) => {
  setInterval(() => {
    if (time >= 0) {
      document.getElementById("countdown").textContent = time / 1000 + " s";
      time -= 1000;
    } else {
      clearInterval();
    }
  }, 1000);
};

loadingContainer.style.display = "block";
await fetch(endPoint + "location")
  .then((response) => response.json())
  .then((data) => {
    // countDown(3000);

    const nameLocationList = Object.keys(data);
    const nodeList = Object.values(data);

    loadingContainer.style.display = "none";
    nameLocationList.forEach((nameLocation, index) => {
      const nameNodeList = Object.keys(nodeList[index]);
      const valueNodeList = Object.values(nodeList[index]);

      nameNodeList.forEach((nameNode, index) => {
        const timeList = Object.keys(valueNodeList[index]);
        const sensorList = Object.values(valueNodeList[index]);

        let nameSensors = [];
        let valueSensorList = [];
        timeList.forEach((time, index) => {
          nameSensors = Object.keys(sensorList[index]);
          const valueSensor = Object.values(sensorList[index]);
          valueSensorList.push(valueSensor);
        });

        chartContainer.appendChild(
          chartElementCreated(
            "all",
            nameLocation,
            nameNode,
            timeList,
            nameSensors,
            valueSensorList
          )
        );
      });
    });
  })
  .catch((err) => {
    countDown(10000);
    setTimeout(() => {
      loadingContainer.style.display = "none";
      document.querySelector(".error-container").style.display = "block";
    }, 11000);
  });

const drawChart = (location, node, sensor, rangeTime) => {
  fetch(endPoint + "location")
    .then((response) => response.json())
    .then((data) => {
      const nameLocationList = location ? [location] : Object.keys(data);
      const nodeList = Object.values(data);

      chartContainer.innerHTML = "";

      nameLocationList.forEach((nameLocation, index) => {
        const nameNodeList = node
          ? [node]
          : location
          ? Object.keys(data[location])
          : Object.keys(nodeList[index]);

        let nameSensors = [];
        let valueSensorList = [];

        if (sensor) {
          const valueLocation = data[location];
          const valueNodeList = valueLocation[node];
          const timeList = Object.keys(valueNodeList);
          const sensorList = Object.values(valueNodeList);
          nameSensors = [sensor];
          sensorList.forEach((list) => {
            valueSensorList.push(list[sensor]);
          });

          const dataRange = getRangeValueWithTime(
            timeList,
            valueSensorList,
            rangeTime[0],
            rangeTime[1]
          );

          chartContainer.appendChild(
            chartElementCreated(
              "sensor",
              location,
              node,
              dataRange.timeRange.length == 0 ? timeList : dataRange.timeRange,
              nameSensors,
              dataRange.valueRange.length == 0
                ? valueSensorList
                : dataRange.valueRange
            )
          );
        } else {
          const valueNodeList = location
            ? Object.values(data[location])
            : Object.values(nodeList[index]);

          nameNodeList.forEach((nameNode, i) => {
            const timeList = Object.keys(valueNodeList[i]);
            const sensorList = Object.values(valueNodeList[i]);

            timeList.forEach((time, j) => {
              nameSensors = Object.keys(sensorList[j]);
              const valueSensor = Object.values(sensorList[j]);
              valueSensorList.push(valueSensor);
            });

            const dataRange = getRangeValueWithTime(
              timeList,
              valueSensorList,
              rangeTime[0],
              rangeTime[1]
            );

            chartContainer.appendChild(
              chartElementCreated(
                "all",
                location || nameLocation,
                node || nameNode,
                dataRange.timeRange.length == 0
                  ? timeList
                  : dataRange.timeRange,
                nameSensors,
                dataRange.valueRange.length == 0
                  ? valueSensorList
                  : dataRange.valueRange
              )
            );
          });
        }
      });
    });
};

get(child(ref(database), "location")).then((snapshot) => {
  const data = snapshot.val();
  const nameLocationList = Object.keys(data);
  const nodeList = Object.values(data);

  let date1, date2;
  timeRangeSelector.addEventListener("change", (e) => {
    date1 = convertDateToTimestamp(
      document.getElementById("date-1-date").value,
      document.getElementById("date-1-time").value
    );
    date2 = convertDateToTimestamp(
      document.getElementById("date-2-date").value,
      document.getElementById("date-2-time").value
    );

    drawChart(chartSelect.location, chartSelect.node, chartSelect.sensor, [
      date1,
      date2,
    ]);
  });

  optionsSelects.forEach(() => {
    optionsSelects[0].innerHTML = "";

    // optionsSelects[0].appendChild(optionElementCreated("All"));
    nameLocationList.forEach((nameLocation) => {
      optionsSelects[0].appendChild(optionElementCreated(nameLocation));
    });

    optionMenus[0].querySelectorAll(".option").forEach((option, index) => {
      option.addEventListener("click", () => {
        const selectedOption = option.querySelector(".option-text").innerText;
        sBtn_texts[0].innerText = selectedOption;
        chartSelect.location = selectedOption;
        optionMenus[0].classList.remove("active");

        const nameNodeList = Object.keys(nodeList[index]);
        const valueNodeList = Object.values(nodeList[index]);

        optionsSelects[1].innerHTML = "";
        drawChart(chartSelect.location, chartSelect.node, chartSelect.sensor, [
          date1,
          date2,
        ]);
        nameNodeList.forEach((nameNode, i) => {
          optionsSelects[1].appendChild(optionElementCreated(nameNode));
        });

        optionMenus[1].querySelectorAll(".option").forEach((op, j) => {
          op.addEventListener("click", () => {
            const selectedOption = op.querySelector(".option-text").innerText;
            sBtn_texts[1].innerText = selectedOption;
            chartSelect.node = selectedOption;
            optionMenus[1].classList.remove("active");

            drawChart(
              chartSelect.location,
              chartSelect.node,
              chartSelect.sensor,
              [date1, date2]
            );

            const sensorNameList = Object.keys(valueNodeList[j].sensors);
            optionsSelects[2].innerHTML = "";
            sensorNameList.forEach((sensorName) => {
              optionsSelects[2].appendChild(optionElementCreated(sensorName));
            });

            optionMenus[2].querySelectorAll(".option").forEach((o) => {
              o.addEventListener("click", () => {
                const selectedOption =
                  o.querySelector(".option-text").innerText;
                sBtn_texts[2].innerText = selectedOption;
                chartSelect.sensor = selectedOption;
                optionMenus[2].classList.remove("active");

                drawChart(
                  chartSelect.location,
                  chartSelect.node,
                  chartSelect.sensor,
                  [date1, date2]
                );
              });
            });
          });
        });
      });
    });
  });
});

const socket = io(endPoint);

socket.on("sensor", (data) => {
  console.log(data);

  LIST_CHART.forEach((chart) => {
    if (concatIdChart(data.location, data.node) === chart.canvas.id) {
      updateDataChart(
        chart,
        convertTimestampToDate(data.timestamp),
        data.sensors
      );
    }
  });
});

const concatIdChart = (location, node) => {
  return "chart-" + location + "-" + node;
};

let count = 0;

function updateDataChart(chart, label, data) {
  chart.data.labels.push(label);
  count++;
  chart.data.labels.forEach((l, index) => {
    if (l === label && count < 2) {
      count--;
      chart.data.labels.splice(index, 1);
      chart.data.datasets.forEach((dataset, i) => {
        dataset.data.push(Object.values(data)[i]);
      });
    }
  });
  chart.update();
}
