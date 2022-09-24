import { AbstractComponent } from "../../Abstract.js";

class AccordionItem extends AbstractComponent {
    static observedAttributes = ["data-open"];

    /** @inheritdoc */
    get elements() {
        return {
            contentSlot: "div.content slot",
            contentNode: "div.content",
        };
    }

    /** @inheritdoc */
    get listeners() {
        return {
            "div.label": {
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
        this.clone = new this.constructor();
        this.clone.innerHTML = this.innerHTML;
        this.clone.classList.add("clone");
        this.parentNode.appendChild(this.clone);
        requestAnimationFrame(() => {
            this.style.setProperty(
                "--height",
                this.clone.contentNode.offsetHeight
            );
        });
    }

    /**
     * Handle attribute change
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
                this.clone.contentNode.offsetHeight
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

const template = /* html */ `
<style>
:host {
    display: block;
    overflow: hidden;
    position: relative;
}
div.label {
    cursor: pointer;
}
:host(:not(.clone)) div.content {
    max-height: 0;
}
div.content,
div.content slot::slotted(*) {
    transition: all var(--transition-duration, 250ms) var(--transition-timing-function, ease-in-out);
}
:host(:not(.clone)[data-open="true"]) div.content {
    max-height: calc(var(--height) * 1px);
}
:host(:not(.clone):not([data-open="true"])) div.content slot::slotted(*) {
    margin-block: 0;
}
:host(.clone) {
    position: absolute;
    left: -200vw;
    width: 100%;
}
</style>
<div class="label"><slot name="label"></slot></div>
<div class="content"><slot></slot></div>
`;

AbstractComponent.initComponent("x-accordion-item", AccordionItem, template);
