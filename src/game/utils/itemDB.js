import { loadAllItems } from "./itemLoader";

let itemDB = {};

export function initItems() {
  itemDB = loadAllItems();
}

export function getItem(key) {
  return itemDB[key];
}

export function getAllItems() {
  console.log(itemDB)
  return itemDB;
}
