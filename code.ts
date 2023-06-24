figma.showUI(__html__, { themeColors: true });

type ColorValue = RGBA | { type: "VARIABLE_ALIAS"; id: string; name: string };
type ModeValue = Record<string, ColorValue>;

interface VariableData {
  id: string;
  name: string;
  description: string;
  type: string;
  Mode: ModeValue;
}

async function getVariableNameById(id: string): Promise<string> {
  const variable = await figma.variables.getVariableById(id);
  return variable ? variable.name : id;
}

async function getAllColorVariables() {
  let colorVariableData: VariableData[] = [];
  const allVariables = await figma.variables.getLocalVariables("COLOR");
  const collections = await figma.variables.getLocalVariableCollections();

  const getVariableNameById = async (variableId: string): Promise<string> => {
    if (typeof variableId === "string") {
      const variable = await figma.variables.getVariableById(variableId);
      return variable ? variable.name : "";
    }
    return "";
  };

  const getModeNameById = (modeId: string): string => {
    for (const collection of collections) {
      const mode = collection.modes.find((m) => m.modeId === modeId);
      if (mode) {
        return mode.name;
      }
    }
    return "";
  };

  const getValueName = async (valueId: string): Promise<string> => {
    const variableId = valueId.split(":").slice(0, -1).join(":");
    const variable = allVariables.find((v) => v.id === variableId);
    return variable ? variable.name : valueId;
  };

  for (let variable of allVariables) {
    if (variable) {
      let Mode: ModeValue = {};
      for (const modeKey in variable.valuesByMode) {
        const value = variable.valuesByMode[modeKey];
        if (
          typeof value === "object" &&
          (value as any).type === "VARIABLE_ALIAS"
        ) {
          const aliasValue = value as {
            type: "VARIABLE_ALIAS";
            id: string;
            name: string;
          };
          const valueId = aliasValue.id;
          const valueName = await getVariableNameById(valueId);
          const valueWithNames: ColorValue = {
            type: "VARIABLE_ALIAS",
            id: valueId,
            name: valueName,
          };
          Mode[getModeNameById(modeKey)] = valueWithNames;
        } else {
          Mode[getModeNameById(modeKey)] = value as RGBA;
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
}

function transformData(data: VariableData[]): object {
  const transformedData: any = {};
  for (let variable of data) {
    const { id, ...rest } = variable;
    const Mode: any = {};
    for (const modeKey in variable.Mode) {
      const value = variable.Mode[modeKey];
      if (
        typeof value === "object" &&
        (value as any).type === "VARIABLE_ALIAS"
      ) {
        const aliasValue = value as {
          type: "VARIABLE_ALIAS";
          id: string;
          name: string;
        };
        const { id, ...aliasRest } = aliasValue;
        Mode[modeKey] = aliasRest;
      } else {
        Mode[modeKey] = value;
      }
    }
    transformedData[variable.name] = {
      ...rest,
      Mode,
    };
  }
  return transformedData;
}

getAllColorVariables().then((colorVariableData) => {
  const transformedData = transformData(colorVariableData);
  figma.ui.postMessage({
    type: "colorData",
    data: transformedData,
  });
});
