import { AbstractComponent } from "../Abstract.js";

class Todo extends AbstractComponent {
  /** @inheritdoc */
  get elements() {
    return {
      button: "button",
      input: "input",
    };
  }

  /** @inheritdoc */
  get listeners() {
    return {
      button: { click: "addHandler" },
      input: { keydown: "addHandler" },
    };
  }

  /** @inheritdoc */
  get mutations() {
    return {
      root: [{ childList: "updateCounter" }],
    };
  }

  get mutationObserverOptions() {
    return {
      childList: true,
    };
  }

  /**
   * Update counter
   */
  updateCounter() {
    this.shadow.querySelector("h3 span:first-of-type").innerHTML = this.todos
      .filter((t) => t.done)
      .length.toString();
    this.shadow.querySelector("h3 span:last-of-type").innerHTML =
      this.todos.length.toString();
  }

  /**
   * Handle add todo
   * @param {MouseEvent|KeyboardEvent} e
   */
  addHandler(e) {
    if (e.type === "keydown" && e.code !== "Enter") return;
    if (this.input.validity.valid) {
      this.addTodo(this.input.value);
      this.input.value = "";
    }
  }

  /**
   * Add todo
   * @param {String} label
   */
  addTodo(label) {
    const item = document.createElement("todo-item");
    item.dataset.label = label;
    this.appendChild(item);
  }

  /**
   * Obtain todos
   * @returns {Array.<Object.<String: label, Boolean: done>>}
   */
  get todos() {
    return Array.from(this.querySelectorAll("todo-item")).map((i) => {
      return {
        label: i.label,
        done: i.checked,
      };
    });
  }

  /**
   * Set todos
   * @param {Array.<String>} v
   */
  set todos(v) {
    this.querySelectorAll("todo-item").forEach((i) => i.delete());
    v.forEach((i) => this.addTodo(v));
  }
}

Todo.prototype.template = document.createElement("template");
Todo.prototype.template.innerHTML = /*html*/ `
<link rel="stylesheet" href="/css/components/todo-list.css"></link>
<h2><slot name="header">You should set a header</slot></h2>
<h3>Done: <span></span> / <span></span></h3>
<section class="add">
  <input placeholder="Todo" required min="3"><button>Add</button>
</section>
<section class="items">
    <slot></slot>
</section>
`;

customElements.define("todo-list", Todo);
