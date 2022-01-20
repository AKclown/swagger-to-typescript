import { Range, window } from "vscode";
import {
  IBaseClass,
  ReturnSelectedInfo,
} from "./interface/BaseClass.interface";

export class BaseClass implements IBaseClass {
  /** 获取到选择的区域信息 */
  getSelectedInfo(): ReturnSelectedInfo[] {
    const data: Array<ReturnSelectedInfo> = [];
    const editor = window.activeTextEditor;
    if (editor) {
      const selections = editor.selections;

      let noEmptySelect = selections.filter(
        (item) =>
          item.start.line !== item.end.line ||
          item.start.character !== item.end.character
      );
      noEmptySelect.sort((pre, next) => pre.start.line - next.start.line);
      noEmptySelect.forEach((item) => {
        const range = new Range(item.start, item.end);
        data.push({
          range,
          text: editor.document.getText(range),
        });
      });
    }
    return data;
  }

  // *********************
  // Utils Function
  // *********************

  isObject(obj: string) {
    return Object.prototype.toString.call(obj) === "[object Object]";
  }

  isArray(arr: string) {
    return Array.isArray(arr);
  }

  isString(str: string) {
    return typeof str === "string";
  }

  isNumber(num: string) {
    return typeof num === "number";
  }

  isBoolean(flag: string) {
    return typeof flag === "boolean";
  }
}
