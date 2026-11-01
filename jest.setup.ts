/// <reference types="jest" />
// Reanimated 4 / worklets não inicializam no Node: usa os mocks oficiais.
jest.mock("react-native-worklets", () => require("react-native-worklets/src/mock"));
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
