//@ts-nocheck
import { AbstractComponent } from "../../AbstractComponent.js";

/**
 * @property {HTMLDivElement} contentNode
 * @property {HTMLSlotElement} contentSlot
 * @property {AccordionItem} clone
 */
class AccordionItem extends AbstractComponent {
  static observedAttributes = ["data-open"];

  /** @inheritdoc */
  get elements() {
    return {
      contentSlot: "div.content-slot slot",
      contentNode: "div.content-slot",
    };
  }

  /** @inheritdoc */
  get listeners() {
    return {
      "div.label-slot": {
        click: this.toggle.bind(this),
      },
    };
  }

  /**
   * Handle render
   */
  connectedCallback() {
    if (!this.classList.contains("clone")) {
      super.connectedCallback();
      this.dataset.open = this.dataset.open ?? false.toString();
      this.initClone();
    }
  }

  /**
   * clone self and hide in open state
   * for measuring height
   */
  initClone() {
    this.clone = new AccordionItem();
    this.clone.innerHTML = this.innerHTML;
    this.clone.classList.add("clone");
    this.parentNode.appendChild(this.clone);
    requestAnimationFrame(() => {
      this.style.setProperty(
        "--height",
        this.clone.contentNode.offsetHeight.toString()
      );
    });
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Handle attribute change
   *
   * @param {String} name
   * @param {String} oldValue
   * @param {String} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.isConnected || oldValue === newValue) return;
    if ("data-open" === name) {
      this.open = newValue === "true";
      this.dispatchEvent(new CustomEvent("change", { detail: this }));
    }
  }

  /**
   * trigger height calculation
   */
  update() {
    if (this.open) {
      this.style.setProperty(
        "--height",
        this.clone.contentNode.offsetHeight.toString()
      );
    }
  }

  /**
   * Toggle open state
   */
  toggle() {
    this.open = !this.open;
    this.update();
  }

  /**
   * Obtain open state
   * @returns {Boolean}
   */
  get open() {
    return this.dataset.open === "true";
  }

  /**
   * Set open state
   * @param {Boolean} v
   */
  set open(v) {
    if (this.open !== !!v) {
      this.dataset.open = (!!v).toString();
    }
  }
}

/* suppress custom properties defined outside of element, slot is not valid, default values for custom properties */
// noinspection CssUnresolvedCustomProperty,CssInvalidHtmlTagReference,CssInvalidFunction
const template = /* html */ `
<style>
:host {
    display: block;
    overflow: hidden;
    position: relative;
}
div.label-slot {
    cursor: var(--cursor, pointer);
}
:host(:not(.clone)) div.content-slot {
    max-height: 0;
}
div.content-slot,
div.content-slot slot::slotted(*) {
    transition: all var(--transition-duration, 250ms) var(--transition-timing-function, ease-in-out);
}
:host(:not(.clone)[data-open="true"]) div.content-slot {
    max-height: calc(var(--height) * 1px);
}
:host(:not(.clone):not([data-open="true"])) div.content-slot slot::slotted(*) {
    margin-block: 0;
}
:host(.clone) {
    position: absolute;
    left: -200vw;
    width: 100%;
}
</style>
<div class="label-slot"><slot name="label"></slot></div>
<div class="content-slot"><slot></slot></div>
`;

AbstractComponent.initComponent("accordion-item", AccordionItem, template);
