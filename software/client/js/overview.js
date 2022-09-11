import {
  onValue,
  ref,
  get,
  child,
  remove,
} from "https://www.gstatic.com/firebasejs/9.8.3/firebase-database.js";
import { database } from "./firebase.js";

const endPoint = "http://127.0.0.1:3000/";
const socket = io(endPoint);

const containerElement = document.querySelector(".container");
let maxLength = localStorage.getItem("maxLength");
let docsValueSensorsThreshold = [];

const loadingContainer = document.querySelector(".loading");
loadingContainer.style.display = "block";
setTimeout(() => {
  loadingContainer.style.display = "none";
}, 1500);

onValue(ref(database, "settings/sensor"), (snapshot) => {
  docsValueSensorsThreshold = snapshot.val();
});

onValue(ref(database, "settings/color"), (snapshot) => {
  const data = snapshot.val();
  const nameLocation = Object.keys(data);
});

// Load filter and load gateway ;
get(child(ref(database), "location")).then((snapshot) => {
  const values = snapshot.val();
  const nameLocationList = Object.keys(values);
  const nodeList = Object.values(values);

  // Create checkbox
  checkboxElementCreated("all");
  nameLocationList.forEach((name) => {
    const divFilterItem = checkboxElementCreated(name);
    document.querySelector(".filter-control").appendChild(divFilterItem);
  });

  const checkboxAll = document.querySelector("#option-all");
  const checkboxes = document.querySelectorAll(
    ".filter-control input[type=checkbox]:not(#option-all)"
  );

  checkboxAll.addEventListener("change", () => {
    if (checkboxAll.checked === true) {
      checkboxes.forEach((checkbox) => {
        checkbox.checked = true;
      });
      containerElement.innerHTML = "";
      nameLocationList.forEach((name, index) => {
        containerElement.appendChild(
          cardElementCreated(getColorLocation(name), name, nodeList[index])
        );
      });
    } else {
      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
      });
      nameLocationList.forEach((name, index) => {
        containerElement.removeChild(
          containerElement.querySelector(`.card[name="${name}"]`)
        );
      });
    }
  });

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked === true) {
        nameLocationList.forEach((name, index) => {
          if (name === checkbox.id) {
            containerElement.appendChild(
              cardElementCreated(getColorLocation(name), name, nodeList[index])
            );
          }
        });
      } else {
        checkboxAll.checked = false;
        nameLocationList.forEach((name, index) => {
          if (name === checkbox.id) {
            containerElement.removeChild(
              containerElement.querySelector(`.card[name="${name}"]`)
            );
          }
        });
      }
    });
  });

  // If all items checked, then check all
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const checkboxItemChecked = document.querySelectorAll(
        ".filter-control input[type=checkbox]:checked"
      );
      if (checkboxItemChecked.length === checkboxes.length) {
        checkboxAll.checked = true;
      } else {
        checkboxAll.checked = false;
      }
    });
  });

  // Tick all filter when load page
  checkboxAll.checked = true;
  checkboxes.forEach((checkbox) => {
    checkbox.checked = true;
    nameLocationList.forEach((name, index) => {
      if (name === checkbox.id) {
        containerElement.appendChild(
          cardElementCreated(getColorLocation(name), name, nodeList[index])
        );
      }
    });
  });
});

onValue(ref(database, "location"), (snapshot) => {
  const data = snapshot.val();
  const nameLocationList = Object.keys(data);
  const nodeList = Object.values(data);

  nameLocationList.forEach((name, index) => {
    updateValueSensor(name, nodeList[index]);
  });
});

const cardElementCreated = (color, name, listNode) => {
  const divCard = document.createElement("div");
  const divFront = document.createElement("div");
  const divStrip = document.createElement("div");
  const divStripTop = document.createElement("div");
  const divLogo = document.createElement("div");

  const divGatewayTitle = document.createElement("div");
  const divGatewayIcon = document.createElement("div");
  const divGatewayContainer = document.createElement("div");

  divCard.classList.add("card");
  divFront.classList.add("front");
  divStrip.classList.add("strip");
  divStripTop.classList.add("strip-top");

  divLogo.classList.add("logo");
  divGatewayTitle.classList.add("gateway-title");
  divGatewayIcon.classList.add("gateway-icon");
  divGatewayContainer.classList.add("gateway-container");

  divCard.appendChild(divFront);
  divFront.appendChild(divStrip);
  divFront.appendChild(divLogo);
  divFront.appendChild(divGatewayTitle);
  divFront.appendChild(divGatewayIcon);
  divFront.appendChild(divGatewayContainer);
  divStrip.appendChild(divStripTop);

  // Remove card when click
  const divRemoveContainer = document.createElement("div");
  const divRemoveBtn = document.createElement("div");
  divRemoveContainer.classList.add("remove-container");
  divRemoveBtn.classList.add("remove-card-btn");
  divRemoveBtn.innerHTML = "&times;";
  divRemoveBtn.classList.add("remove-btn");
  divRemoveContainer.appendChild(divRemoveBtn);

  divFront.appendChild(divRemoveContainer);
  divRemoveBtn.addEventListener("click", () => {
    if (confirm("Are you sure to delete this gateway?")) {
      containerElement.removeChild(divCard);
      remove(child(ref(database, "location"), name));
      socket.emit("remove-location", name);
      window.location.reload();
    } else {
      //do thing
    }
  });
  divRemoveBtn.addEventListener("mouseover", () => {
    divRemoveContainer.style = "background: #d83131eb; color: #fff;";
  });
  divRemoveBtn.addEventListener("mouseout", () => {
    divRemoveContainer.style = "background: transparent; color: #000;";
  });

  //

  divCard.setAttribute("name", name);

  divStripTop.style.backgroundColor = color;

  divLogo.innerHTML = `
    <svg width="40" height="40" viewbox="0 0 122.88 103.23">
       <path d="M20,36.18H103a7.14,7.14,0,0,1,7.14,7.14v4.57h3.69V4.55A4.57,4.57,0,0,1,118.33,0h0a4.57,4.57,0,0,1,4.55,4.55V58.69a.8.8,0,0,1-.8.8h-7.5a.8.8,0,0,1-.8-.8V57.33h-3.69V96.09a7.15,7.15,0,0,1-7.14,7.14H20a7.15,7.15,0,0,1-7.14-7.14V57.33H9.1v1.36a.8.8,0,0,1-.8.8H.8a.8.8,0,0,1-.8-.8V4.55A4.57,4.57,0,0,1,4.55,0h0A4.57,4.57,0,0,1,9.1,4.55V47.89h3.79V43.32A7.14,7.14,0,0,1,20,36.18ZM39.05,14A2.17,2.17,0,0,1,36,13.8v0a2.18,2.18,0,0,1,.25-3h0A43.08,43.08,0,0,1,48.4,3.28a34.6,34.6,0,0,1,26.22.22,43.87,43.87,0,0,1,12.1,7.62.63.63,0,0,1,.12.11,2.11,2.11,0,0,1,.67,1.42A2.17,2.17,0,0,1,87,14.16a.75.75,0,0,1-.12.14,2.23,2.23,0,0,1-1.43.67,2.17,2.17,0,0,1-1.57-.54A39.71,39.71,0,0,0,73,7.55a30.18,30.18,0,0,0-23.11-.2A38.72,38.72,0,0,0,39.05,14Zm14.24,14.8a2.16,2.16,0,0,1-3-.25.69.69,0,0,1-.11-.13,2.18,2.18,0,0,1,.3-2.93l.13-.1a19.87,19.87,0,0,1,5.28-3.12,15.37,15.37,0,0,1,11.27,0,19.52,19.52,0,0,1,5.28,3.14,2.18,2.18,0,0,1,.32,3.06h0a2.2,2.2,0,0,1-1.47.79,2.23,2.23,0,0,1-1.59-.47h0a15.07,15.07,0,0,0-4-2.43,11,11,0,0,0-4.11-.8,11.08,11.08,0,0,0-4.14.83,15.46,15.46,0,0,0-4.11,2.45Zm-6.89-7-.11.09a2.15,2.15,0,0,1-1.5.48,2.12,2.12,0,0,1-1.45-.69.52.52,0,0,1-.1-.11,2.12,2.12,0,0,1-.48-1.49,2.16,2.16,0,0,1,.73-1.5,32.65,32.65,0,0,1,8.9-5.76,22.15,22.15,0,0,1,18.44.3,32.85,32.85,0,0,1,8.72,6.06l.06.05a2.12,2.12,0,0,1,.62,1.46,2.17,2.17,0,0,1-.59,1.56l0,.05a2.18,2.18,0,0,1-1.46.63,2.13,2.13,0,0,1-1.55-.59,28.75,28.75,0,0,0-7.47-5.23A17.75,17.75,0,0,0,54,16.9a28.35,28.35,0,0,0-7.57,4.94ZM75.61,87.16a3.54,3.54,0,1,1-3.54,3.54,3.55,3.55,0,0,1,3.54-3.54Zm-13.84,0a3.54,3.54,0,1,1-3.54,3.54,3.55,3.55,0,0,1,3.54-3.54Zm-13.84,0a3.54,3.54,0,1,1-3.54,3.54,3.54,3.54,0,0,1,3.54-3.54Zm55-46.61H20a2.77,2.77,0,0,0-2.77,2.77V96.09A2.78,2.78,0,0,0,20,98.86H103a2.78,2.78,0,0,0,2.77-2.77V43.32A2.77,2.77,0,0,0,103,40.55Z" fill="white"></path>
    </svg>
  `;

  divGatewayIcon.innerHTML = `
    <div class="master">
      <div class="circle master-red"></div>
      <div class="circle master-yellow"></div>
      <div class="circle master-green"></div>
      <div class="circle master-purple"></div>
    </div>
  `;

  divGatewayTitle.textContent = name;

  const listNodeName = Object.keys(listNode);
  const listNodeSensor = Object.values(listNode);

  listNodeName.forEach((node, index) => {
    const divNode = nodeElementCreate(
      name,
      listNodeName[index],
      listNodeSensor[index].sensors
    );
    divGatewayContainer.appendChild(divNode);
  });

  return divCard;
};

const nodeElementCreate = (nameGateway, nameNode, sensors) => {
  const sensorName = Object.keys(sensors);
  const sensorValue = Object.values(sensors);

  if (maxLength <= sensorName.length) {
    maxLength = sensorName.length;
    localStorage.setItem("maxLength", maxLength);
  }

  const divNode = document.createElement("div");
  const divNodeName = document.createElement("div");
  const divNodeSensors = document.createElement("div");

  divNode.classList.add("node");
  divNodeName.classList.add("node-name");
  divNodeSensors.classList.add("node-sensors");
  divNodeSensors.style.height = `${maxLength * 50}px`;

  divNode.appendChild(divNodeName);
  divNode.appendChild(divNodeSensors);

  divNode.setAttribute("name", nameNode);
  divNodeName.textContent = nameNode;
  sensorName.forEach((sensor, index) => {
    const divSensor = sensorElementCreate(
      nameGateway,
      sensor,
      sensorValue[index]
    );
    divNodeSensors.appendChild(divSensor);
  });

  return divNode;
};

const sensorElementCreate = (nameGateway, sensorName, sensorValue) => {
  const divSensor = document.createElement("div");
  const divSensorName = document.createElement("div");
  const divSensorValue = document.createElement("div");

  divSensor.classList.add("sensor");
  divSensorName.classList.add("sensor-name");
  divSensorValue.classList.add("sensor-value");

  divSensor.setAttribute("name", sensorName);
  divSensor.appendChild(divSensorName);
  divSensor.appendChild(divSensorValue);

  const labelGateway = document.querySelector(
    `.filter label[for="${nameGateway}"]`
  );

  divSensorName.textContent = sensorName.toUpperCase();
  divSensorValue.textContent = sensorValue;

  return divSensor;
};

// Checkbox
const checkboxElementCreated = (name) => {
  const divFilterItem = document.createElement("div");
  const labelCheckbox = document.createElement("label");
  const inputCheckbox = document.createElement("input");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const labelTitle = document.createElement("label");

  divFilterItem.classList.add("filter-item");
  divFilterItem.setAttribute("name", name);
  labelCheckbox.classList.add("checkbox");
  labelCheckbox.classList.add("path");
  inputCheckbox.type = "checkbox";
  inputCheckbox.id = `${name}`;
  svg.setAttribute("viewBox", "0 0 21 21");
  path.setAttributeNS(
    null,
    "d",
    "M5,10.75 L8.5,14.25 L19.4,2.3 C18.8333333,1.43333333 18.0333333,1 17,1 L4,1 C2.35,1 1,2.35 1,4 L1,17 C1,18.65 2.35,20 4,20 L17,20 C18.65,20 20,18.65 20,17 L20,7.99769186"
  );
  labelTitle.setAttribute("for", `${name}`);
  labelTitle.textContent = name;

  divFilterItem.appendChild(labelCheckbox);
  labelCheckbox.appendChild(inputCheckbox);
  labelCheckbox.appendChild(svg);
  svg.appendChild(path);
  divFilterItem.appendChild(labelTitle);

  return divFilterItem;
};

// Update value sensor
const updateValueSensor = (nameLocation, nodeList) => {
  const nodes = Object.keys(nodeList).map((node) => {
    return [node, nodeList[node]];
  });

  let totalSensorOverloadThreshold = 0;
  const nameLocationElement = document.querySelector(
    `label[for="${nameLocation}"]`
  );

  nodes.forEach((node) => {
    const nameNode = node[0];
    const sensors = node[1].sensors;

    const nameSensorList = Object.keys(sensors);
    const valueSensorList = Object.values(sensors);

    let nameTempList = ["co", "humi", "temp", "noise", "shine", "uv"];
    let valueTempList = ["", "", "", "", "", ""];

    nameTempList.forEach((name, index) => {
      nameSensorList.forEach((sensor, indexSensor) => {
        if (name === sensor) {
          valueTempList[index] = valueSensorList[indexSensor];
        }
      });
    });

    nameSensorList.forEach((sensor, index) => {
      const sensorValue = valueSensorList[index];
      const sensorName = nameSensorList[index];

      const sensorValueElement = document.querySelector(
        `.card[name="${nameLocation}"] .node[name="${nameNode}"] .sensor[name="${sensorName}"] .sensor-value`
      );

      const sensorNameElement = document.querySelector(
        `.card[name="${nameLocation}"] .node[name="${nameNode}"] .sensor[name="${sensorName}"] .sensor-name`
      );
      if (sensorValueElement && sensorNameElement && nameLocationElement) {
        sensorValueElement.textContent = sensorValue;
        if (
          parseInt(sensorValue) <
          parseInt(docsValueSensorsThreshold[sensorName].minT)
        ) {
          sensorValueElement.style.color = "orange";
          sensorNameElement.style.color = "orange";
          nameLocationElement.style.color = "orange";
          totalSensorOverloadThreshold++;
        } else if (
          parseInt(sensorValue) >
          parseInt(docsValueSensorsThreshold[sensorName].maxT)
        ) {
          sensorValueElement.style.color = "red";
          sensorNameElement.style.color = "red";
          nameLocationElement.style.color = "red";
          totalSensorOverloadThreshold++;
        } else {
          sensorValueElement.style.color = "black";
          sensorNameElement.style.color = "black";
        }
      }
    });
  });
  if (totalSensorOverloadThreshold === 0) {
    if (nameLocationElement) nameLocationElement.style.color = "black";
  }
};

const getColorLocation = (nameLocation) => {
  let color = "";
  onValue(ref(database, "settings/color/" + nameLocation), (snapshot) => {
    color = snapshot.val();
  });
  return color;
};
