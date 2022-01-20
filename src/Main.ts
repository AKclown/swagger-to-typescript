import { Range, TextEditor, window } from "vscode";
import { BaseClass } from "./BaseClass";
import { IMain } from "./interface/Main.interface";

export class Main extends BaseClass implements IMain {
  private nameRegular = /([a-zA-Z]*)(«(?:[\w|«|»])+»)?(?:\s)*(\{)/m;
  private contentRegular = /(\w+).*\(([^,]+).*\)((?:\:)([^,|}|\r|\n]+))?/g;
  private blockRegular = /([^\{]*\{)([^\{\}]+)(\})/gm;
  private flagRegular = /([^\"|\'])\(/gm;
  private objBlockRegular = /(\{)([^\=]*)(\})/gm;

  /** 执行转换 */
  executeConverts() {
    try {
      const selectData = this.getSelectedInfo();
      const editor = window.activeTextEditor;
      if (!editor) {
        return;
      }

      selectData.forEach((item) => {
        const text = item.text;
        const range = item.range;
        // 判断属于那种类型 - swagger | 普通对象
        if (this.flagRegular.test(text)) {
          this.convertSwagger(editor, text, range);
        } else {
          this.convertNormalObj(editor, text, range);
        }
      });
    } catch (error) {
      console.log("error: ", error);
    }
  }

  // *********************
  // Swagger Function
  // *********************

  /** swagger类型转换 */
  convertSwagger(editor: TextEditor, text: string, range: Range): void {
    // 将数据分为区域 ~{(第一块) {}(里面的内容第二块) }(第三块)
    let blocks = null;
    // 数据string
    let formatText = "";

    while ((blocks = this.blockRegular.exec(text))) {
      const interfaceText = this.getInterface(blocks[1]);
      const content = this.getContent(blocks[2]);
      formatText = `${formatText}
 ${interfaceText.trim()}${content}
 }
   `;
    }
    editor.edit((editorContext) => editorContext.replace(range, formatText));
  }

  /** 获取interface模板 */
  getInterface(text: string): string {
    const names = text.match(this.nameRegular);
    return names ? `export interface ${names[1]} ${names[3]}\n\t` : "";
  }

  /** 获取内容类型模板 */
  getContent(text: string): string {
    let contents = null;
    let contentText = "";
    while ((contents = this.contentRegular.exec(text))) {
      let note = contents[4] ? `/** ${contents[4].trim()} */` : "";
      const type = this.formatType(contents[2]);
      contentText = `${contentText}
  ${note}
  ${contents[1].trim()}?:${type};`;
    }
    return contentText;
  }

  /** 类型格式化 */
  formatType(type: string): string {
    if (type === "integer") {
      return "number";
    } else if (type.search(/Array/g) !== -1) {
      const mat = type.match(/(?:\[)(.*)(?:\])/);
      return mat ? mat[1] : "unknown";
    }
    return type;
  }

  // *********************
  // Object Function
  // *********************

  /** 普通对象类型转换 */
  convertNormalObj(editor: TextEditor, text: string, range: Range) {
    const str = this.objToType(text);
    console.log("str: ", str);
  }

  objToType(content: string) {
    console.log("content: ", content);
    const obj = JSON.parse(content);
    console.log("obj: ", obj);
    // 保存格式化类型数据
    let formatStr = "";
    for (let key in obj) {
      const value = obj[key];
      // 判断类型
      formatStr = formatStr && formatStr + ",\n\t";
      if (this.isString(value)) {
        formatStr = `${formatStr}${key}?:string`;
      } else if (this.isBoolean(value)) {
        formatStr = `${formatStr}${key}?:boolean`;
      } else if (this.isNumber(value)) {
        formatStr = `${formatStr}${key}?:number`;
      } else if (this.isObject(value)) {
        console.log("value: ", value);
        // 去掉 {}，递归执行该函数
        formatStr = this.objToType(value + "");
      } else if (this.isArray(value)) {
        // TODO 1. 非对象数组类型
        // TODO 2. 对象数组类型 -- 多个对象 - 单个对象
      }
    }

    return formatStr;
  }
}
