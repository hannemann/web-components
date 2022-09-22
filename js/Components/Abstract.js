const MUTATION_OBSERVER_OPTIONS = {
    subtree: true,
    attributes: true,
    childList: true,
    characterData: false,
    characterDataOldValue: false,
};

export class AbstractComponent extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "closed" });
        this.shadow.appendChild(this.template.content.cloneNode(true));
        this.initElements();
    }
    /**
     * Initialize
     * Fired when added to dom
     */
    connectedCallback() {
        this.disconnectController = new AbortController();
        this.disconnectedSignal = this.disconnectController.signal;
        this.addListeners();
    }

    /**
     * Handle disconnect
     * Fired when removed from dom
     */
    disconnectedCallback() {
        this.disconnectController.abort();
        this.removeMutations();
    }

    /**
     * Initialize elements
     * @returns {this}
     */
    initElements() {
        for (const selector of Object.keys(this.elements)) {
            const nodes = Array.from(
                this.shadow.querySelectorAll(this.elements[selector])
            );
            this[selector] = nodes?.length === 1 ? nodes[0] : nodes;
        }
        return this;
    }

    /**
     * Add listeners
     * @returns {this}
     */
    addListeners() {
        return this.addEvents().addMutations();
    }

    /**
     * Add event listeners
     * @returns {this}
     */
    addEvents() {
        for (const selector of Object.keys(this.listeners)) {
            const config = this.listeners[selector];
            let cb;
            for (const event of Object.keys(config)) {
                const nodes =
                    "root" === selector
                        ? [this.getRootNode()]
                        : Array.from(this.shadow.querySelectorAll(selector));
                if ("function" === typeof config[event]) {
                    cb = config[event];
                } else {
                    console.group("TypeError: EventHandler");
                    console.error("EventHandler is not a function");
                    console.error("Handler Configuration: %o", config);
                    console.groupEnd();
                }
                nodes.forEach((node) => {
                    node.addEventListener(event, cb, {
                        signal: this.disconnectedSignal,
                    });
                });
            }
        }
        return this;
    }

    /**
     * Add mutation observers
     * @returns {this}
     */
    addMutations() {
        if (!this.hasMutations) return;
        this.initMutationObserver();
        for (const element of Object.keys(this.mutations)) {
            const node = "root" === element ? this : this[element];
            this.mutationCallbacks = [
                ...(this.mutationCallbacks || []),
                { ...{ node }, ...{ callbacks: this.mutations[element] } },
            ];
        }
        return this;
    }

    /**
     * Disconnect MutationObserver
     */
    removeMutations() {
        if (this._mutationObserver) {
            this._mutationObserver.disconnect();
        }
    }

    /**
     * Initialize MutationObserver
     * @returns {MutationObserver}
     */
    initMutationObserver() {
        if (!this._mutationObserver) {
            const options =
                this.mutationObserverOptions || MUTATION_OBSERVER_OPTIONS;
            this._mutationObserver = new MutationObserver(
                this.mutationHandler.bind(this)
            );
            this._mutationObserver.observe(this, options);
            this._mutationObserver.observe(this.shadow, options);
        }
    }

    /**
     * Listen to mutations
     * @param {MutationRecord} mutationList
     * @param {MutationObserver} observer
     */
    mutationHandler(mutationList, observer) {
        for (const mutation of mutationList) {
            const callbacks = this.mutationCallbacks.find((c) => {
                if (Array.isArray(c.node)) {
                    return (
                        c.node.filter((i) => i === mutation.target).length > 0
                    );
                }
                return c.node === mutation.target;
            })?.callbacks;
            if (callbacks) {
                Object.values(callbacks).forEach((configs) => {
                    [configs]
                        .flat()
                        .filter((c) => c[mutation.type])
                        .forEach((config) => {
                            try {
                                config[mutation.type](mutation, observer);
                            } catch (error) {
                                console.group("TypeError: MutationHandler");
                                console.error(
                                    "MutationHandler is not a function"
                                );
                                console.error("Mutation: %o", mutation);
                                console.error(
                                    "Handler Configuration: %o",
                                    config
                                );
                                console.groupEnd();
                            }
                        });
                });
            }
        }
    }

    static initComponent(name, component, template) {
        component.prototype.template = document.createElement("template");
        component.prototype.template.innerHTML = template;
        customElements.define(name, component);
    }

    /**
     * Obtain elements
     * used to map elements to instance for later use
     * @returns {Object.<String: String>}
     */
    get elements() {
        return {};
    }

    /**
     * Obtain listeners
     * used to add event listeners
     * @returns {Object.<String: Object.<String: String>}
     */
    get listeners() {
        return {};
    }

    /**
     * Obtain mutations
     * used to add callbacks to mutation observer
     * @returns {Object.<String: Object.<String: String>}
     */
    get mutations() {
        return {};
    }

    /**
     * Determine if we use mutations
     * @returns {Boolean}
     */
    get hasMutations() {
        return Object.keys(this.mutations).length > 0;
    }
}
