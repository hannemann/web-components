//@ts-nocheck
import { AbstractComponent } from "../../AbstractComponent.js";
import "./Item.js";

/**
 @property {HTMLSlotElement} itemSlot
 */
class Accordion extends AbstractComponent {
  /** @inheritdoc */
  get elements() {
    return {
      itemSlot: "slot",
    };
  }

  /**
   * Initialize
   */
  connectedCallback() {
    super.connectedCallback();
    const evtOptions = {
      signal: this.disconnectedSignal,
    };
    window.addEventListener("resize", () => this.updateItemList(), evtOptions);
    this.itemSlot.addEventListener(
      "slotchange",
      () => this.updateItemList(0),
      evtOptions
    );
    if (!screen.orientation) {
      window.addEventListener(
        "orientationchange",
        () => this.updateItemList(),
        evtOptions
      );
    } else {
      screen.orientation.addEventListener(
        "change",
        () => this.updateItemList(),
        evtOptions
      );
    }
    this.itemChangeHandler = this.handleItemChange.bind(this);
    this.items.forEach((i) =>
      i.addEventListener("change", this.itemChangeHandler, evtOptions)
    );
  }

  /**
   * Handle item open state change
   *
   * @param {CustomEvent} e
   * @param {AccordionItem} e.detail
   */
  handleItemChange(e) {
    this.items.forEach((i) =>
      i.removeEventListener("change", this.itemChangeHandler)
    );
    if (e.detail.open && !this.multi) {
      this.items
        ?.filter((i) => i !== e.detail)
        .forEach((i) => (i.open = false));
    }
    this.items.forEach((i) =>
      i.addEventListener("change", this.itemChangeHandler, {
        signal: this.disconnectedSignal,
      })
    );
  }

  /**
   * Update list of items
   *
   * @param {Number} debounce
   */
  updateItemList(debounce = null) {
    const timeout = debounce ?? 50;
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.debounceTimeout = setTimeout(() => {
      this.items.forEach((i) => i.update());
    }, timeout);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Close all items, maybe used for a button to close all (multi open)
   */
  closeAll() {
    this.items.forEach((i) => (i.open = false));
  }

  /**
   * obtain items
   * @returns {AccordionItem[]}
   */
  get items() {
    /* suppress unknown element accordion-item */
    // noinspection JSValidateTypes
    return Array.from(this.querySelectorAll("accordion-item:not(.clone)"));
  }

  /**
   * Determine if accordion can open multiple tabs
   * @returns {Boolean}
   */
  get multi() {
    return "undefined" !== typeof this.dataset.multi;
  }
}

const template = /* html */ `
<style>
:host {
    position: relative;
    display: block;
    overflow: hidden;
}
</style>
<slot></slot>
`;

AbstractComponent.initComponent("accordion-box", Accordion, template);
