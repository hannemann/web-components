import { AbstractComponent } from "../Abstract.js";

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
      const checked = newValue === "true";
      if (this.checked !== checked) {
        this.checked = checked;
      }
    }
  }

  /**
   * Update
   */
  updateHandler() {
    this.dataset.done = this.checked.toString();
    this.input.parentNode.classList.toggle("done", this.checked);
    this.parentNode.updateCounter();
  }

  /**
   * Delete
   */
  deleteHandler() {
    this.parentNode.removeChild(this);
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
<link rel="stylesheet" href="/css/components/todo-item.css"></link>
<label>
    <input type="checkbox">
    <span></span>
</label>
<button>Delete</button>
`;

customElements.define("todo-item", Item);
