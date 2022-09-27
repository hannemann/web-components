import { AbstractComponent } from "../AbstractComponent.js";

class Item extends AbstractComponent {
  static get observedAttributes() {
    return ["data-done"];
  }

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
      button: { click: this.deleteHandler.bind(this) },
      input: { change: this.updateHandler.bind(this) },
    };
  }

  /** @inheritdoc */
  connectedCallback() {
    super.connectedCallback();
    this.label = this.dataset.label;
    this.checked = this.dataset.done === "true";
    this.parentNode.updateCounter();
  }

  /**
   * Handle attribute change
   * @param {String} name
   * @param {String} oldValue
   * @param {String} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.input || oldValue === newValue) return;
    if ("data-done" === name) {
      this.checked = newValue === "true";
    }
  }

  /**
   * Update
   */
  updateHandler() {
    this.dataset.done = this.checked.toString();
    this.toggleLineThrough();
    this.parentNode.updateCounter();
  }

  /**
   * Delete
   */
  deleteHandler() {
    this.parentNode.removeChild(this);
  }

  toggleLineThrough() {
    this.input.parentNode.classList.toggle("done", this.checked);
  }

  /**
   * Obtain cheked state
   * @returns {Boolean}
   */
  get checked() {
    return this.input.checked;
  }

  /**
   * Set checked state
   * @param {Boolean} v
   */
  set checked(v) {
    if (this.checked !== !!v) {
      this.input.checked = !!v;
      this.toggleLineThrough();
      this.input.dispatchEvent(new Event("change"));
    }
  }

  /**
   * Obtain label
   * @returns {String}
   */
  get label() {
    return this.shadow.querySelector("label span").innerHTML;
  }

  /**
   * Set label
   * @param {String} v
   */
  set label(v) {
    this.shadow.querySelector("label span").innerHTML = v;
  }
}

Item.prototype.template = document.createElement("template");
Item.prototype.template.innerHTML = /* html */ `
<style>
:host {
  display: flex;
  justify-content: space-between;
  background: var(--clr-bg-list-item);
  padding: var(--list-item-padding);
}
:host(:hover) {
  background-color: var(--clr-bg-list-item-hover);
}
label.done span {
  text-decoration: line-through;
}
</style>
<label>
    <input type="checkbox">
    <span></span>
</label>
<button>Delete</button>
`;

customElements.define("todo-item", Item);
