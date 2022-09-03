export class AbstractComponent extends HTMLElement {
  /**
   * Initialize
   * Fired when added to dom
   */
  connectedCallback() {
    this.shadow = this.attachShadow({ mode: "closed" });
    this.shadow.appendChild(this.template.content.cloneNode(true));
    this.disconnectController = new AbortController();
    this.disconnectedSignal = this.disconnectController.signal;
    this.initElements().addListeners();
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
      const nodes = this.shadow.querySelector(this.elements[selector]);
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
        if ("function" === typeof this[config[event]]) {
          cb = this[config[event]].bind(this);
        } else if ("function" === typeof config[event]) {
          cb = config[event].bind(this);
        } else {
          throw new TypeError("EventHandler is not a function");
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
        { ...{ node }, ...{ callback: this.mutations } },
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
      this._mutationObserver = new MutationObserver(
        this.mutationHandler.bind(this)
      );
      this._mutationObserver.observe(this, {
        attributes: false,
        subtree: true,
        childList: true,
        characterData: true,
        characterDataOldValue: true,
      });
    }
  }

  /**
   * Listen to mutations
   * @param {MutationRecord} mutationList
   * @param {MutationObserver} observer
   */
  mutationHandler(mutationList, observer) {
    for (const mutation of mutationList) {
      const callback = this.mutationCallbacks.find(
        (c) => c.node === mutation.target
      )?.callback;
      if (callback) {
        for (const config of Object.values(callback)) {
          if (config[mutation.type]) {
            if ("function" === typeof mutation.target[config[mutation.type]]) {
              mutation.target[config[mutation.type]](mutation, observer);
            } else if ("function" === typeof config[mutation.type]) {
              config[mutation.type](mutation, observer);
            } else {
              throw new TypeError("MutationHandler is not a function");
            }
          }
        }
      }
    }
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
