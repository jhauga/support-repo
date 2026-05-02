function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function deepMerge(schema, candidate) {
  if (Array.isArray(schema)) {
    if (!Array.isArray(candidate)) {
      return clone(schema);
    }

    const itemSchema = schema[0];
    return candidate.map((item) => {
      if (isObject(itemSchema) || Array.isArray(itemSchema)) {
        return deepMerge(itemSchema, item);
      }

      return item ?? itemSchema;
    });
  }

  if (isObject(schema)) {
    const source = isObject(candidate) ? candidate : {};
    const result = {};

    for (const key of Object.keys(schema)) {
      result[key] = deepMerge(schema[key], source[key]);
    }

    return result;
  }

  return candidate ?? schema;
}

export function mergeContent(defaults, incoming) {
  return deepMerge(defaults, incoming);
}

export function createContentStore(storageKey) {
  return {
    load(defaults) {
      try {
        const rawValue = window.localStorage.getItem(storageKey);
        if (!rawValue) {
          return clone(defaults);
        }

        return mergeContent(defaults, JSON.parse(rawValue));
      } catch {
        return clone(defaults);
      }
    },
    save(value) {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    },
    reset() {
      window.localStorage.removeItem(storageKey);
    },
  };
}
