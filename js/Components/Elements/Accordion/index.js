import { AbstractComponent } from "../../Abstract.js";
import "./Item.js";

/**
 * @property {Array.<AccordionItem>} items
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
        window.addEventListener(
            "resize",
            () => this.updateItemList(),
            evtOptions
        );
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

    /**
     * Close all items
     */
    closeAll() {
        this.items.forEach((i) => (i.open = false));
    }

    /**
     * obtain items
     */
    get items() {
        return Array.from(this.querySelectorAll("accordion-item:not(.clone)"));
    }

    /**
     * Determine if accordion can open multiple tabs
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
}
</style>
<slot></slot>
`;

AbstractComponent.initComponent("accordion-box", Accordion, template);
