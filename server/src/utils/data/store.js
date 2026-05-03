import fs from "fs/promises";
import path from "path";
import ENV from "../../config/env.js";
import { createSeedState, ensureDemoState } from "./seed.js";

let state = null;

const clone = (value) => JSON.parse(JSON.stringify(value));

const persistState = async () => {
  await fs.mkdir(path.dirname(ENV.DATA_FILE), { recursive: true });
  await fs.writeFile(
    ENV.DATA_FILE,
    JSON.stringify(state, null, 2),
    "utf8"
  );
};

const readExistingState = async () => {
  try {
    const content = await fs.readFile(ENV.DATA_FILE, "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
};

export const initStore = async () => {
  if (state) return state;

  const existingState = await readExistingState();

  if (existingState) {
    state = await ensureDemoState(existingState);
  } else {
    state = await createSeedState();
  }

  await persistState();
  return state;
};

export const getState = () => {
  if (!state) {
    throw new Error("Store not initialized. Call initStore() first.");
  }
  return state;
};

export const updateState = async (mutator) => {
  const draft = clone(getState());

  await mutator(draft);

  state = draft;
  await persistState();

  return state;
};

export { clone };