"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __rest =
  (this && this.__rest) ||
  function (s, e) {
    var t = {};
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (
          e.indexOf(p[i]) < 0 &&
          Object.prototype.propertyIsEnumerable.call(s, p[i])
        )
          t[p[i]] = s[p[i]];
      }
    return t;
  };
figma.showUI(__html__, { themeColors: true, width: 400, height: 800 });
function getVariableNameById(id) {
  return __awaiter(this, void 0, void 0, function* () {
    const variable = yield figma.variables.getVariableById(id);
    return variable ? variable.name : id;
  });
}
function sendCollectionNamesAndIds() {
  return __awaiter(this, void 0, void 0, function* () {
    // Récupérer les collections de variables
    const collections = yield figma.variables.getLocalVariableCollections();
    // Extraire à la fois l'id et le nom de chaque collection
    const collectionsData = collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
    }));
    // Envoyer les noms des collections à l'interface utilisateur
    figma.ui.postMessage({
      type: "collections",
      data: collectionsData,
    });
  });
}
sendCollectionNamesAndIds();
function getAllColorVariables(collectionId) {
  return __awaiter(this, void 0, void 0, function* () {
    let colorVariableData = [];
    const allVariables = yield figma.variables.getLocalVariables("COLOR");
    const collections = yield figma.variables.getLocalVariableCollections();
    const getVariableNameById = (variableId) =>
      __awaiter(this, void 0, void 0, function* () {
        if (typeof variableId === "string") {
          const variable = yield figma.variables.getVariableById(variableId);
          return variable ? variable.name : "";
        }
        return "";
      });
    const getModeNameById = (modeId) => {
      for (const collection of collections) {
        const mode = collection.modes.find((m) => m.modeId === modeId);
        if (mode) {
          return mode.name;
        }
      }
      return "";
    };
    const getValueName = (valueId) =>
      __awaiter(this, void 0, void 0, function* () {
        const variableId = valueId.split(":").slice(0, -1).join(":");
        const variable = allVariables.find((v) => v.id === variableId);
        return variable ? variable.name : valueId;
      });
    const selectedCollection = yield figma.variables.getVariableCollectionById(
      collectionId
    );
    if (!selectedCollection) {
      console.error("Collection not found");
      return [];
    }
    const selectedVariableIds = selectedCollection
      ? selectedCollection.variableIds
      : [];
    for (let variable of allVariables) {
      if (selectedVariableIds.includes(variable.id)) {
        let Mode = {};
        for (const modeKey in variable.valuesByMode) {
          const value = variable.valuesByMode[modeKey];
          if (typeof value === "object" && value.type === "VARIABLE_ALIAS") {
            const aliasValue = value;
            const valueId = aliasValue.id;
            const valueName = yield getVariableNameById(valueId);
            const valueWithNames = {
              type: "VARIABLE_ALIAS",
              id: valueId,
              name: valueName,
            };
            Mode[getModeNameById(modeKey)] = valueWithNames;
          } else {
            Mode[getModeNameById(modeKey)] = value;
          }
        }
        colorVariableData.push({
          id: variable.id,
          name: variable.name,
          description: variable.description,
          type: variable.resolvedType,
          Mode,
        });
      }
    }
    return colorVariableData;
  });
}
function transformData(data) {
  const transformedData = {};
  for (let variable of data) {
    const { id } = variable,
      rest = __rest(variable, ["id"]);
    const Mode = {};
    for (const modeKey in variable.Mode) {
      const value = variable.Mode[modeKey];
      if (typeof value === "object" && value.type === "VARIABLE_ALIAS") {
        const aliasValue = value;
        const { id } = aliasValue,
          aliasRest = __rest(aliasValue, ["id"]);
        Mode[modeKey] = aliasRest;
      } else {
        Mode[modeKey] = value;
      }
    }
    transformedData[variable.name] = Object.assign(Object.assign({}, rest), {
      Mode,
    });
  }
  return transformedData;
}
figma.ui.onmessage = (message) => {
  if (message.type === "fetchColorVariables") {
    const selectedCollectionId = message.collectionId;
    exportToJSON(selectedCollectionId);
    getAllColorVariables(selectedCollectionId).then((colorVariableData) => {
      const transformedData = transformData(colorVariableData);
      figma.ui.postMessage({
        type: "colorData",
        data: transformedData,
      });
    });
  }
  if (message.type === "IMPORT") {
    const { fileName, body } = message;
    importJSONFile({ fileName, body });
  }
};

function createModes(collection, modes) {
  let modeIds = {};
  let existingModeNames = collection.modes.map((mode) => mode.name);

  for (let mode of modes) {
    if (!existingModeNames.includes(mode)) {
      // Ajoutez chaque mode à la collection
      let modeId = collection.addMode(mode);
      modeIds[mode] = modeId;
    }
  }

  return modeIds;
}

function createCollection(name, modes) {
  const collection = figma.variables.createVariableCollection(name);
  let modeIds = {};

  for (let mode of modes) {
    let modeId;

    // Pour le mode par défaut ("Mode 1"), utiliser l'ID de mode par défaut
    if (mode === "Mode 1") {
      modeId = collection.defaultModeId;
    } else {
      // Pour les autres modes, les créer et utiliser l'ID de mode nouvellement créé
      modeId = collection.addMode(mode);
    }

    modeIds[mode] = modeId;
  }

  return { collection, modeIds };
}

function createToken(collection, modeIds, type, key, values) {
  if (values && values["value"]) {
    const variable = figma.variables.createVariable(key, collection.id, type);

    // Define the value for the default mode
    if (isAlias(values["value"])) {
      // If it's an alias, assign it directly
      variable.setValueForMode(collection.defaultModeId, values["value"]);
    } else {
      variable.setValueForMode(
        collection.defaultModeId,
        parseValue(values["value"], type)
      );
    }

    for (let modeName in values) {
      // Skip the default value
      if (modeName === "value") continue;

      let convertedModeName =
        modeName.charAt(0) === "$" ? modeName.slice(1) : modeName;
      let modeIdKey = convertedModeName.replace("mode", "");
      if (modeIds[modeIdKey]) {
        let modeId = modeIds[modeIdKey];
        let parsedValue;
        if (isAlias(values[modeName])) {
          // If it's an alias, assign it directly
          parsedValue = values[modeName];
        } else {
          parsedValue = parseValue(values[modeName], type);
        }
        variable.setValueForMode(modeId, parsedValue);
      }
    }
    return variable;
  }
}

function parseValue(value, type) {
  if (!value) {
    throw new Error(`Invalid value for type ${type}: undefined`);
  }
  if (type === "COLOR" || type === "color") {
    return parseColor(value);
  } else if (type === "NUMBER" || type === "number") {
    return parseFloat(value);
  } else {
    throw new Error(`Unsupported type: ${type}`);
  }
}

function importJSONFile({ fileName, body }) {
  try {
    const json = JSON.parse(body);

    console.log("JSON content:", json); // Log the entire JSON content

    let firstObject = json[Object.keys(json)[0]];
    let modes = Object.keys(firstObject)
      .filter((key) => key.startsWith("$mode") || key === "$value")
      .map((key) => (key === "$value" ? "Mode 1" : key.slice(5)));

    console.log("Modes from JSON:", modes); // Log the modes extracted from JSON

    const { collection, modeIds } = createCollection(fileName, modes);
    console.log("Created modeIds:", modeIds); // Log the mode IDs from the created collection
    console.log("Collection after modes creation:", collection); // Log the collection after modes creation

    const aliases = {};
    const tokens = {};
    Object.entries(json).forEach(([key, object]) => {
      console.log(`Processing key: ${key}, object: ${object}`); // Log each key and object being processed
      traverseToken({
        collection,
        modeIds,
        type: json.$type,
        key,
        object,
        tokens,
        aliases,
      });
    });
    processAliases({ collection, modeIds, aliases, tokens });

    console.log("Tokens after processing:", tokens); // Log the tokens after processing
    console.log("Aliases after processing:", aliases); // Log the aliases after processing

    figma.notify("Your JSON file has been successfully imported!");
  } catch (error) {
    console.log(error);
    figma.notify("An error occurred while importing your JSON file.");
  }
}

async function processAliases({ collection, modeId, aliases, tokens }) {
  aliases = Object.values(aliases);
  let generations = aliases.length;
  while (aliases.length && generations > 0) {
    for (let i = 0; i < aliases.length; i++) {
      const { key, type, valueKey } = aliases[i];
      const token = tokens[valueKey] || findTokenInAllCollections(valueKey);
      if (token) {
        console.log(`Found matching token for alias ${key}: ${token.name}`);
        aliases.splice(i, 1);
        tokens[key] = createToken(collection, modeId, token.resolvedType, key, {
          type: "VARIABLE_ALIAS",
          id: `${token.id}`,
        });
      } else {
        console.log(`No matching token found for alias ${key}`);
        figma.notify(`No matching token found for alias ${key}`, {
          timeout: 5000,
        });
      }
    }
    generations--;
  }
  // Check if there are any unresolved aliases
  if (aliases.length > 0) {
    console.error("Unresolved aliases found:");
    for (const alias of aliases) {
      console.error(
        `- Alias: ${alias.key}, Collection: ${alias.collectionName}`
      );
    }
  }
}

function findTokenInAllCollections(tokenKey) {
  // Remplace les tirets par des slashs pour correspondre au format de nom des tokens dans Figma
  tokenKey = tokenKey.replace(/-/g, "/");
  let allColors = figma.variables.getLocalVariables("COLOR");
  for (let i = 0; i < allColors.length; i++) {
    if (allColors[i].name === tokenKey) {
      console.log(
        `Found matching token in all collections: ${allColors[i].name}`
      );
      return allColors[i];
    }
  }
  console.log(`No matching token found in all collections for ${tokenKey}`);
  return null;
}

function isAlias(value) {
  return value.toString().trim().charAt(0) === "{";
}

function isValidColor(color) {
  const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return HEX_COLOR_REGEX.test(color);
}

function traverseToken({
  collection,
  modeIds,
  type,
  key,
  object,
  tokens,
  aliases,
}) {
  type = type || object.$type;

  // Si la clé est un champ meta, passez au suivant
  if (key.charAt(0) === "$") {
    return;
  }

  // Extrait toutes les valeurs des modes du JSON
  let modeValues = {};
  for (let prop in object) {
    if (prop.startsWith("$")) {
      let modeName = prop.slice(1); // Retire le signe dollar
      modeValues[modeName] = object[prop];
    }
  }

  // Si $value est présent, renommez-le en Mode 1
  if (modeValues["$value"] !== undefined) {
    modeValues["Mode 1"] = modeValues["$value"];
    delete modeValues["$value"];
  }

  if (Object.keys(modeValues).length > 0) {
    for (const modeName in modeValues) {
      const modeValue = modeValues[modeName];
      if (isAlias(modeValue)) {
        const valueKey = modeValue
          .trim()
          .replace(/\./g, "/")
          .replace(/[\{\}]/g, "");
        const resolvedToken =
          tokens[valueKey] || findTokenInAllCollections(valueKey);
        if (resolvedToken) {
          modeValues[modeName] = resolvedToken;
        } else {
          console.log(`No matching token found for alias ${valueKey}`);
        }
      } else {
        if (type === "COLOR" || type === "color") {
          if (isValidColor(modeValues)) {
            modeValues[modeName] = parseColor(modeValue);
          } else {
            console.log(`Invalid color value: ${modeValue}`);
          }
        }
      }
    }

    tokens[key] = createToken(collection, modeIds, type, key, modeValues);
  } else {
    Object.entries(object).forEach(([key2, object2]) => {
      if (key2.charAt(0) !== "$") {
        traverseToken({
          collection,
          modeIds,
          type,
          key: `${key}/${key2}`,
          object: object2,
          tokens,
          aliases,
        });
      }
    });
  }
}

function exportToJSON(collectionId) {
  // Retrieve all the collections
  const collections = figma.variables.getLocalVariableCollections();
  // Find the specific collection using the provided ID
  const collection = collections.find((col) => col.id === collectionId);
  if (collection) {
    // Process the specific collection and post the result
    const files = processCollection(collection);
    figma.ui.postMessage({ type: "EXPORT_RESULT", files });
  } else {
    console.error(`No collection found with ID ${collectionId}`);
  }
}

function processCollection(collection) {
  const { name, modes, variableIds } = collection;
  const files = [];

  // Create a base object for the file body
  const baseBody = {};

  variableIds.forEach((variableId) => {
    const { name, resolvedType, valuesByMode } =
      figma.variables.getVariableById(variableId);

    let obj = baseBody;
    name.split("/").forEach((groupName) => {
      obj[groupName] = obj[groupName] || {};
      obj = obj[groupName];
    });
    obj.$type = resolvedType === "COLOR" ? "color" : "number";

    modes.forEach((mode, index) => {
      const value = valuesByMode[mode.modeId];
      if (value !== undefined && ["COLOR", "FLOAT"].includes(resolvedType)) {
        const key = index === 0 ? "$value" : `$mode${index + 1}`;
        if (value.type === "VARIABLE_ALIAS") {
          obj[key] = `{${figma.variables
            .getVariableById(value.id)
            .name.replace(/\//g, ".")}}`;
        } else {
          obj[key] = resolvedType === "COLOR" ? rgbToHex(value) : value;
        }
      }
    });
  });

  files.push({ fileName: `${name}.tokens.json`, body: baseBody });
  return files;
}

function rgbToHex({ r, g, b, a }) {
  if (a !== 1) {
    return `rgba(${[r, g, b]
      .map((n) => Math.round(n * 255))
      .join(", ")}, ${a.toFixed(4)})`;
  }
  const toHex = (value) => {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  const hex = [toHex(r), toHex(g), toHex(b)].join("");
  return `#${hex}`;
}

function parseColor(color) {
  if (!color) {
    throw new Error("Invalid color: undefined");
  }
  color = color.trim();
  const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
  const rgbaRegex =
    /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+)\s*\)$/;
  const hslRegex = /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/;
  const hslaRegex =
    /^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*([\d.]+)\s*\)$/;
  const hexRegex = /^#([A-Fa-f0-9]{3}){1,2}$/;
  const floatRgbRegex =
    /^\{\s*r:\s*[\d\.]+,\s*g:\s*[\d\.]+,\s*b:\s*[\d\.]+(,\s*opacity:\s*[\d\.]+)?\s*\}$/;

  if (rgbRegex.test(color)) {
    const [, r, g, b] = color.match(rgbRegex);
    return { r: parseInt(r) / 255, g: parseInt(g) / 255, b: parseInt(b) / 255 };
  } else if (rgbaRegex.test(color)) {
    const [, r, g, b, a] = color.match(rgbaRegex);
    return {
      r: parseInt(r) / 255,
      g: parseInt(g) / 255,
      b: parseInt(b) / 255,
      a: parseFloat(a),
    };
  } else if (hslRegex.test(color)) {
    const [, h, s, l] = color.match(hslRegex);
    return hslToRgbFloat(parseInt(h), parseInt(s) / 100, parseInt(l) / 100);
  } else if (hslaRegex.test(color)) {
    const [, h, s, l, a] = color.match(hslaRegex);
    return Object.assign(
      hslToRgbFloat(parseInt(h), parseInt(s) / 100, parseInt(l) / 100),
      { a: parseFloat(a) }
    );
  } else if (hexRegex.test(color)) {
    const hexValue = color.substring(1);
    const expandedHex =
      hexValue.length === 3
        ? hexValue
            .split("")
            .map((char) => char + char)
            .join("")
        : hexValue;
    return {
      r: parseInt(expandedHex.slice(0, 2), 16) / 255,
      g: parseInt(expandedHex.slice(2, 4), 16) / 255,
      b: parseInt(expandedHex.slice(4, 6), 16) / 255,
    };
  } else if (floatRgbRegex.test(color)) {
    return JSON.parse(color);
  } else {
    throw new Error("Invalid color format");
  }
}

function hslToRgbFloat(h, s, l) {
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  if (s === 0) {
    return { r: l, g: l, b: l };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, (h + 1 / 3) % 1);
  const g = hue2rgb(p, q, h % 1);
  const b = hue2rgb(p, q, (h - 1 / 3) % 1);

  return { r, g, b };
}
