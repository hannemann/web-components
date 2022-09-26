(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // js/Components/Abstract.js
  var MUTATION_OBSERVER_OPTIONS = {
    subtree: true,
    attributes: true,
    childList: true,
    characterData: false,
    characterDataOldValue: false
  };
  var AbstractComponent = class extends HTMLElement {
    constructor() {
      super();
      this.shadow = this.attachShadow({ mode: "closed" });
      this.shadow.appendChild(this.template.content.cloneNode(true));
      this.initElements();
    }
    connectedCallback() {
      this.disconnectController = new AbortController();
      this.disconnectedSignal = this.disconnectController.signal;
      this.addListeners();
    }
    disconnectedCallback() {
      this.disconnectController.abort();
      this.removeMutations();
    }
    initElements() {
      for (const selector of Object.keys(this.elements)) {
        const nodes = Array.from(
          this.shadow.querySelectorAll(this.elements[selector])
        );
        this[selector] = nodes?.length === 1 ? nodes[0] : nodes;
      }
      return this;
    }
    addListeners() {
      return this.addEvents().addMutations();
    }
    addEvents() {
      for (const selector of Object.keys(this.listeners)) {
        const config = this.listeners[selector];
        let cb;
        for (const event of Object.keys(config)) {
          const nodes = "root" === selector ? [this.getRootNode()] : Array.from(this.shadow.querySelectorAll(selector));
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
              signal: this.disconnectedSignal
            });
          });
        }
      }
      return this;
    }
    addMutations() {
      if (!this.hasMutations)
        return;
      this.initMutationObserver();
      for (const element of Object.keys(this.mutations)) {
        const node = "root" === element ? this : this[element];
        this.mutationCallbacks = [
          ...this.mutationCallbacks || [],
          { ...{ node }, ...{ callbacks: this.mutations[element] } }
        ];
      }
      return this;
    }
    removeMutations() {
      if (this._mutationObserver) {
        this._mutationObserver.disconnect();
      }
    }
    initMutationObserver() {
      if (!this._mutationObserver) {
        const options = this.mutationObserverOptions || MUTATION_OBSERVER_OPTIONS;
        this._mutationObserver = new MutationObserver(
          this.mutationHandler.bind(this)
        );
        this._mutationObserver.observe(this, options);
        this._mutationObserver.observe(this.shadow, options);
      }
    }
    mutationHandler(mutationList, observer) {
      for (const mutation of mutationList) {
        const callbacks = this.mutationCallbacks.find((c) => {
          if (Array.isArray(c.node)) {
            return c.node.filter((i) => i === mutation.target).length > 0;
          }
          return c.node === mutation.target;
        })?.callbacks;
        if (callbacks) {
          Object.values(callbacks).forEach((configs) => {
            [configs].flat().filter((c) => c[mutation.type]).forEach((config) => {
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
    static initComponent(name, component, template6) {
      component.prototype.template = document.createElement("template");
      component.prototype.template.innerHTML = template6;
      customElements.define(name, component);
    }
    get elements() {
      return {};
    }
    get listeners() {
      return {};
    }
    get mutations() {
      return {};
    }
    get hasMutations() {
      return Object.keys(this.mutations).length > 0;
    }
  };

  // js/Components/Category/List.js
  var ITEMS_COUNT = 24;
  var ITEMS_URL = "https://dummyjson.com/products";
  var List = class extends AbstractComponent {
    get elements() {
      return {
        items: ".items"
      };
    }
    async connectedCallback() {
      console.time("Category");
      super.connectedCallback();
      if (this.dataset.pwa === "true") {
        try {
          const items = await this.load();
          const nodes = this.initProducts(items);
          this.render(nodes);
        } catch (error) {
          console.error(error);
        }
      }
      console.timeEnd("Category");
    }
    async load() {
      console.groupCollapsed("Start load timer.");
      console.time("load");
      const response = await fetch(ITEMS_URL);
      const result = await response.json();
      const items = result?.products?.slice(0, ITEMS_COUNT);
      console.timeEnd("load");
      console.groupEnd();
      return items;
    }
    initProducts(items) {
      console.groupCollapsed("Creating product tiles...");
      console.time("initProducts");
      const nodes = [];
      items.forEach((p) => {
        const node = document.createElement("category-item");
        node.productData = p;
        nodes.push(node);
      });
      console.log(`...${ITEMS_COUNT} product tiles created`);
      console.timeEnd("initProducts");
      console.groupEnd();
      return nodes;
    }
    render(nodes) {
      console.groupCollapsed("Render tiles");
      console.time("render");
      nodes.forEach((p, k) => {
        if (k === 4) {
          p.classList.add("wide");
        }
        if (k === 12) {
          p.classList.add("big");
        }
        this.appendChild(p);
      });
      console.log(`${ITEMS_COUNT} product tiles rendered`);
      console.timeEnd("render");
      console.groupEnd();
    }
    get products() {
      return this.items.querySelector("slot").assignedElements();
    }
  };
  var template = `
<style>
.items {
  display: grid;
  gap: var(--gap-l);
  grid-template-columns: repeat(auto-fit, minmax(var(--product-tile-width), 1fr));
  grid-auto-flow: dense;
}
</style>
<h2>Category</h2>
<div class="items">
  <slot></slot>
</div>
`;
  AbstractComponent.initComponent("category-list", List, template);

  // js/Components/Category/Item.js
  var Item = class extends AbstractComponent {
    #_data = null;
    static get observedAttributes() {
      return [
        "data-img",
        "data-brand",
        "data-title",
        "data-price",
        "data-description"
      ];
    }
    get elements() {
      return {
        imgNode: "figure img",
        brandNode: ".product-data h4",
        titleNode: ".product-data h3",
        priceNode: ".product-data span",
        hover: "category-item-hover"
      };
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue)
        return;
      const prop = name.split("-").pop();
      switch (name) {
        case "data-img":
          this[`${prop}Node`].src = this.img;
          break;
        case "data-title":
        case "data-brand":
        case "data-price":
          this[`${prop}Node`].innerText = this[prop];
          break;
      }
      if (this.hover?.renderData) {
        this.hover.renderData();
      }
    }
    set productData(data) {
      this.#_data = data;
      this.title = data.title;
      this.brand = data.brand;
      this.price = data.price;
      this.img = data.images[0];
      this.description = data.description;
    }
    get productData() {
      return this.#_data;
    }
    get img() {
      return this.dataset.img;
    }
    set img(v) {
      this.dataset.img = v.toString();
    }
    get title() {
      return this.dataset.title;
    }
    set title(v) {
      this.dataset.title = v.toString();
    }
    get brand() {
      return this.dataset.brand;
    }
    set brand(v) {
      this.dataset.brand = v.toString();
    }
    get price() {
      return parseFloat(this.dataset.price).toFixed(2);
    }
    set price(v) {
      this.dataset.price = v.toString();
    }
    get description() {
      return this.dataset.description;
    }
    set description(v) {
      this.dataset.description = v.toString();
    }
  };
  var template2 = `
<style>
:host {
  box-shadow: var(--list-item-shadow);
  background-color: hsl(0 0% 95%);
  display: grid;
  grid-template-rows: min-content;
  row-gap: var(--gap);
  grid-template-areas:
    "img"
    "data";
  padding-block-end: var(--gap);
  border-radius: var(--border-radius);
  overflow: hidden;
  position: relative;
}

figure {
  margin: 0;
  padding: 0;
  grid-area: img;
  width: 100%;
  aspect-ratio: 3 / 4;
}
img {
  background-color: hsl(0 0% 85%);
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-data {
  padding-inline: var(--gap);
  display: grid;
  row-gap: var(--gap);
  grid-area: data;
  grid-template-rows: max-content 1fr max-content;
  grid-template-areas:
    "brand"
    "title"
    "price";
}

.product-data > * {
  padding: 0;
  margin: 0;
}

h4 {
  grid-area: brand;
}

h3 {
  grid-area: title;
}

span {
  grid-area: price;
  text-align: right;
  font-weight: bold;
  font-size: larger;
}
category-item-hover {
    transform: translateY(120%);
    transition: transform 250ms ease-out;
}
:host(:hover) category-item-hover {
    transform: translateY(0);
}
</style>
<figure part="product-tile-media">
    <img loading="lazy" part="product-tile-media-image">
</figure>
<div class="product-data">
    <h4 part="product-tile-heading"></h4>
    <h3 part="product-tile-heading"></h3>
    <span part="product-tile-price"></span>
</div>
<category-item-hover exportparts="product-tile-price"></category-item-hover>
`;
  AbstractComponent.initComponent("category-item", Item, template2);

  // js/Components/Category/Item/Hover.js
  var Hover = class extends AbstractComponent {
    get elements() {
      return {
        brandNode: "h4",
        titleNode: "h3",
        descriptionNode: "p",
        priceNode: "span"
      };
    }
    connectedCallback() {
      super.connectedCallback();
      this.renderData();
    }
    renderData() {
      this.brandNode.innerText = this.parentNode.host.brand;
      this.titleNode.innerText = this.parentNode.host.title;
      this.descriptionNode.innerText = this.parentNode.host.description;
      this.priceNode.innerText = this.parentNode.host.price;
    }
  };
  var template3 = `
<style>
:host {
  position: absolute;
  inset: auto 0 0;
  background: var(--white);
  border-top-left-radius: var(--border-radius);
  border-top-right-radius: var(--border-radius);
  box-shadow: var(--category-item-hover-shadow);
  background-color: hsl(0 0% 95%);
  display: grid;
  grid-template-rows: min-content;
  row-gap: var(--gap);
  grid-template-rows: min-content min-content 1fr min-content min-content;
  grid-template-areas:
    "brand"
    "title"
    "description"
    "price"
    "buttons";
  padding: var(--gap);
}
:host > * {
  padding: 0;
  margin: 0;
}
h4 {
  grid-area: brand;
}
h3 {
  grid-area: title;
}
p {
  grid-area: description;
}
span {
  grid-area: price;
  text-align: right;
  font-weight: bold;
  font-size: larger;
}
.buttons {
  grid-area: buttons;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--gap-s);
}
.buttons button {
  width: 100%;
  border: none;
  background: var(--black);
  color: var(--white);
  padding: var(--gap) var(--gap-l);
  font-weight: bold;
  font-size: larger;
}
.buttons button.cta {
  background: var(--clr-cta);
}
</style>
<h4></h4>
<h3></h3>
<p></p>
<span part="product-tile-price"></span>
<div class="buttons">
    <button>Details</button>
    <button class="cta">Cart</button>
</div>
`;
  AbstractComponent.initComponent("category-item-hover", Hover, template3);

  // js/Components/Elements/Accordion/Item.js
  var AccordionItem = class extends AbstractComponent {
    get elements() {
      return {
        contentSlot: "div.content slot",
        contentNode: "div.content"
      };
    }
    get listeners() {
      return {
        "div.label": {
          click: this.toggle.bind(this)
        }
      };
    }
    connectedCallback() {
      if (!this.classList.contains("clone")) {
        super.connectedCallback();
        this.dataset.open = this.dataset.open ?? false.toString();
        this.initClone();
      }
    }
    initClone() {
      this.clone = new this.constructor();
      this.clone.innerHTML = this.innerHTML;
      this.clone.classList.add("clone");
      this.parentNode.appendChild(this.clone);
      requestAnimationFrame(() => {
        this.style.setProperty("--height", this.clone.contentNode.offsetHeight);
      });
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.isConnected || oldValue === newValue)
        return;
      if ("data-open" === name) {
        this.open = newValue === "true";
        this.dispatchEvent(new CustomEvent("change", { detail: this }));
      }
    }
    update() {
      if (this.open) {
        this.style.setProperty("--height", this.clone.contentNode.offsetHeight);
      }
    }
    toggle() {
      this.open = !this.open;
      this.update();
    }
    get open() {
      return this.dataset.open === "true";
    }
    set open(v) {
      if (this.open !== !!v) {
        this.dataset.open = (!!v).toString();
      }
    }
  };
  __publicField(AccordionItem, "observedAttributes", ["data-open"]);
  var template4 = `
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
  AbstractComponent.initComponent("accordion-item", AccordionItem, template4);

  // js/Components/Elements/Accordion/index.js
  var Accordion = class extends AbstractComponent {
    get elements() {
      return {
        itemSlot: "slot"
      };
    }
    connectedCallback() {
      super.connectedCallback();
      const evtOptions = {
        signal: this.disconnectedSignal
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
      this.items.forEach(
        (i) => i.addEventListener("change", this.itemChangeHandler, evtOptions)
      );
    }
    handleItemChange(e) {
      this.items.forEach(
        (i) => i.removeEventListener("change", this.itemChangeHandler)
      );
      if (e.detail.open && !this.multi) {
        this.items?.filter((i) => i !== e.detail).forEach((i) => i.open = false);
      }
      this.items.forEach(
        (i) => i.addEventListener("change", this.itemChangeHandler, {
          signal: this.disconnectedSignal
        })
      );
    }
    updateItemList(debounce = null) {
      const timeout = debounce ?? 50;
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }
      this.debounceTimeout = setTimeout(() => {
        this.items.forEach((i) => i.update());
      }, timeout);
    }
    closeAll() {
      this.items.forEach((i) => i.open = false);
    }
    get items() {
      return Array.from(this.querySelectorAll("accordion-item:not(.clone)"));
    }
    get multi() {
      return "undefined" !== typeof this.dataset.multi;
    }
  };
  var template5 = `
<style>
:host {
    position: relative;
    display: block;
}
</style>
<slot></slot>
`;
  AbstractComponent.initComponent("accordion-box", Accordion, template5);

  // js/Components/Todo/List.js
  var Todo = class extends AbstractComponent {
    get elements() {
      return {
        button: "button",
        input: "input"
      };
    }
    get listeners() {
      return {
        button: { click: this.addHandler.bind(this) },
        input: { keydown: this.addHandler.bind(this) }
      };
    }
    get mutations() {
      return {
        root: [{ childList: (m, o) => this.updateCounter(m, o) }]
      };
    }
    get mutationObserverOptions() {
      return {
        childList: true
      };
    }
    updateCounter() {
      this.shadow.querySelector("h3 span:first-of-type").innerHTML = this.todos.filter((t) => t.done).length.toString();
      this.shadow.querySelector("h3 span:last-of-type").innerHTML = this.todos.length.toString();
    }
    addHandler(e) {
      if (e.type === "keydown" && e.code !== "Enter")
        return;
      if (this.input.validity.valid) {
        this.addTodo(this.input.value);
        this.input.value = "";
      }
    }
    addTodo(label) {
      const item = document.createElement("todo-item");
      item.dataset.label = label;
      this.appendChild(item);
    }
    get todos() {
      return Array.from(this.querySelectorAll("todo-item")).map((i) => {
        return {
          label: i.label,
          done: i.checked
        };
      });
    }
    set todos(v) {
      this.querySelectorAll("todo-item").forEach((i) => i.delete());
      v.forEach((i) => this.addTodo(v));
    }
  };
  Todo.prototype.template = document.createElement("template");
  Todo.prototype.template.innerHTML = `
<style>
.add {
  padding: var(--list-item-padding);
  display: flex;
  gap: var(--item-padding-inline);
}
</style>
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

  // js/Components/Todo/Item.js
  var Item2 = class extends AbstractComponent {
    static get observedAttributes() {
      return ["data-done"];
    }
    get elements() {
      return {
        button: "button",
        input: "input"
      };
    }
    get listeners() {
      return {
        button: { click: this.deleteHandler.bind(this) },
        input: { change: this.updateHandler.bind(this) }
      };
    }
    connectedCallback() {
      super.connectedCallback();
      this.label = this.dataset.label;
      this.checked = this.dataset.done === "true";
      this.parentNode.updateCounter();
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if (!this.input || oldValue === newValue)
        return;
      if ("data-done" === name) {
        this.checked = newValue === "true";
      }
    }
    updateHandler() {
      this.dataset.done = this.checked.toString();
      this.toggleLineThrough();
      this.parentNode.updateCounter();
    }
    deleteHandler() {
      this.parentNode.removeChild(this);
    }
    toggleLineThrough() {
      this.input.parentNode.classList.toggle("done", this.checked);
    }
    get checked() {
      return this.input.checked;
    }
    set checked(v) {
      if (this.checked !== !!v) {
        this.input.checked = !!v;
        this.toggleLineThrough();
        this.input.dispatchEvent(new Event("change"));
      }
    }
    get label() {
      return this.shadow.querySelector("label span").innerHTML;
    }
    set label(v) {
      this.shadow.querySelector("label span").innerHTML = v;
    }
  };
  Item2.prototype.template = document.createElement("template");
  Item2.prototype.template.innerHTML = `
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
  customElements.define("todo-item", Item2);

  // js/Components/My.js
  var MyComponent = class extends AbstractComponent {
    get elements() {
      return {
        my: ".myElement",
        button: ".button"
      };
    }
    get listeners() {
      return {
        ".button": {
          click: (e) => this.my.appendChild(document.createTextNode(" are awesome!!"))
        }
      };
    }
    get mutations() {
      return {
        my: [
          { childList: (m, o) => console.log(m) },
          { childList: (m, o) => console.log(o) },
          { childList: "This raises an error" }
        ],
        button: [{ childList: (m, o) => console.log(m, o) }]
      };
    }
    connectedCallback() {
      super.connectedCallback();
      console.log(this.my);
    }
  };
  MyComponent.prototype.template = document.createElement("template");
  MyComponent.prototype.template.innerHTML = `
<button class="button">Click!</button>
<div class="myElement">
    Web Components
</div>
`;
  customElements.define("my-component", MyComponent);

  // js/Router.js
  var Router = class {
    #_routes = [];
    #_initial = "/";
    #_current = "/";
    constructor() {
      this.current = location.pathname;
      this.initial = this.current;
      this.abortController = new AbortController();
      this.abortSignal = this.abortController.signal;
      addEventListener("popstate", (e) => this.handleHistoryPop(e));
    }
    route(route = "/", cb = () => {
    }) {
      this.routes.push({ route, cb });
      this.addListener(route, cb);
    }
    addListener(route, cb) {
      document.querySelectorAll(`[href="/${route}"]`).forEach((node) => {
        node.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            this.push(route);
            cb();
          },
          {
            signal: this.abortSignal
          }
        );
      });
    }
    addListeners() {
      this.routes.forEach((i) => this.addListener(i.route, i.cb));
    }
    push(route) {
      history.pushState(route, "", route);
    }
    handleHistoryPop(e) {
      this.abortController.abort();
      if (location.pathname === this.initial) {
        location.reload();
      } else {
        this.routes.find((r) => e.state === r.route)?.cb?.();
      }
    }
    get initial() {
      return this.#_initial;
    }
    set initial(v) {
      this.#_initial = v;
    }
    get routes() {
      return this.#_routes;
    }
    set routes(v) {
      this.#_routes = v;
    }
    get current() {
      return this.#_current;
    }
    set current(v) {
      this.#_current = v;
    }
  };

  // js/routes.js
  var clearBody = () => {
    document.body.querySelectorAll(":scope > *").forEach((n) => document.body.removeChild(n));
  };
  var init = (router2) => {
    router2.route("router-test", () => {
      console.log("Routed to router-test");
      clearBody();
      const node = document.createElement("category-list");
      node.dataset.pwa = "true";
      document.body.appendChild(node);
    });
  };

  // js/core.js
  var router = new Router();
  init(router);
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL2pzL0NvbXBvbmVudHMvQWJzdHJhY3QuanMiLCAiLi4vLi4vLi4vc3JjL2pzL0NvbXBvbmVudHMvQ2F0ZWdvcnkvTGlzdC5qcyIsICIuLi8uLi8uLi9zcmMvanMvQ29tcG9uZW50cy9DYXRlZ29yeS9JdGVtLmpzIiwgIi4uLy4uLy4uL3NyYy9qcy9Db21wb25lbnRzL0NhdGVnb3J5L0l0ZW0vSG92ZXIuanMiLCAiLi4vLi4vLi4vc3JjL2pzL0NvbXBvbmVudHMvRWxlbWVudHMvQWNjb3JkaW9uL0l0ZW0uanMiLCAiLi4vLi4vLi4vc3JjL2pzL0NvbXBvbmVudHMvRWxlbWVudHMvQWNjb3JkaW9uL2luZGV4LmpzIiwgIi4uLy4uLy4uL3NyYy9qcy9Db21wb25lbnRzL1RvZG8vTGlzdC5qcyIsICIuLi8uLi8uLi9zcmMvanMvQ29tcG9uZW50cy9Ub2RvL0l0ZW0uanMiLCAiLi4vLi4vLi4vc3JjL2pzL0NvbXBvbmVudHMvTXkuanMiLCAiLi4vLi4vLi4vc3JjL2pzL1JvdXRlci5qcyIsICIuLi8uLi8uLi9zcmMvanMvcm91dGVzLmpzIiwgIi4uLy4uLy4uL3NyYy9qcy9jb3JlLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBNVVRBVElPTl9PQlNFUlZFUl9PUFRJT05TID0ge1xuICAgIHN1YnRyZWU6IHRydWUsXG4gICAgYXR0cmlidXRlczogdHJ1ZSxcbiAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgY2hhcmFjdGVyRGF0YTogZmFsc2UsXG4gICAgY2hhcmFjdGVyRGF0YU9sZFZhbHVlOiBmYWxzZSxcbn07XG5cbmV4cG9ydCBjbGFzcyBBYnN0cmFjdENvbXBvbmVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5zaGFkb3cgPSB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6IFwiY2xvc2VkXCIgfSk7XG4gICAgICAgIHRoaXMuc2hhZG93LmFwcGVuZENoaWxkKHRoaXMudGVtcGxhdGUuY29udGVudC5jbG9uZU5vZGUodHJ1ZSkpO1xuICAgICAgICB0aGlzLmluaXRFbGVtZW50cygpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplXG4gICAgICogRmlyZWQgd2hlbiBhZGRlZCB0byBkb21cbiAgICAgKi9cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0Q29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0ZWRTaWduYWwgPSB0aGlzLmRpc2Nvbm5lY3RDb250cm9sbGVyLnNpZ25hbDtcbiAgICAgICAgdGhpcy5hZGRMaXN0ZW5lcnMoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGUgZGlzY29ubmVjdFxuICAgICAqIEZpcmVkIHdoZW4gcmVtb3ZlZCBmcm9tIGRvbVxuICAgICAqL1xuICAgIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmRpc2Nvbm5lY3RDb250cm9sbGVyLmFib3J0KCk7XG4gICAgICAgIHRoaXMucmVtb3ZlTXV0YXRpb25zKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBlbGVtZW50c1xuICAgICAqIEByZXR1cm5zIHt0aGlzfVxuICAgICAqL1xuICAgIGluaXRFbGVtZW50cygpIHtcbiAgICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBPYmplY3Qua2V5cyh0aGlzLmVsZW1lbnRzKSkge1xuICAgICAgICAgICAgY29uc3Qgbm9kZXMgPSBBcnJheS5mcm9tKFxuICAgICAgICAgICAgICAgIHRoaXMuc2hhZG93LnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5lbGVtZW50c1tzZWxlY3Rvcl0pXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdGhpc1tzZWxlY3Rvcl0gPSBub2Rlcz8ubGVuZ3RoID09PSAxID8gbm9kZXNbMF0gOiBub2RlcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgbGlzdGVuZXJzXG4gICAgICogQHJldHVybnMge3RoaXN9XG4gICAgICovXG4gICAgYWRkTGlzdGVuZXJzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGRFdmVudHMoKS5hZGRNdXRhdGlvbnMoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgZXZlbnQgbGlzdGVuZXJzXG4gICAgICogQHJldHVybnMge3RoaXN9XG4gICAgICovXG4gICAgYWRkRXZlbnRzKCkge1xuICAgICAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIE9iamVjdC5rZXlzKHRoaXMubGlzdGVuZXJzKSkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5saXN0ZW5lcnNbc2VsZWN0b3JdO1xuICAgICAgICAgICAgbGV0IGNiO1xuICAgICAgICAgICAgZm9yIChjb25zdCBldmVudCBvZiBPYmplY3Qua2V5cyhjb25maWcpKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZXMgPVxuICAgICAgICAgICAgICAgICAgICBcInJvb3RcIiA9PT0gc2VsZWN0b3JcbiAgICAgICAgICAgICAgICAgICAgICAgID8gW3RoaXMuZ2V0Um9vdE5vZGUoKV1cbiAgICAgICAgICAgICAgICAgICAgICAgIDogQXJyYXkuZnJvbSh0aGlzLnNoYWRvdy5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG4gICAgICAgICAgICAgICAgaWYgKFwiZnVuY3Rpb25cIiA9PT0gdHlwZW9mIGNvbmZpZ1tldmVudF0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2IgPSBjb25maWdbZXZlbnRdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZ3JvdXAoXCJUeXBlRXJyb3I6IEV2ZW50SGFuZGxlclwiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkV2ZW50SGFuZGxlciBpcyBub3QgYSBmdW5jdGlvblwiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkhhbmRsZXIgQ29uZmlndXJhdGlvbjogJW9cIiwgY29uZmlnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5ncm91cEVuZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBub2Rlcy5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgY2IsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZ25hbDogdGhpcy5kaXNjb25uZWN0ZWRTaWduYWwsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBtdXRhdGlvbiBvYnNlcnZlcnNcbiAgICAgKiBAcmV0dXJucyB7dGhpc31cbiAgICAgKi9cbiAgICBhZGRNdXRhdGlvbnMoKSB7XG4gICAgICAgIGlmICghdGhpcy5oYXNNdXRhdGlvbnMpIHJldHVybjtcbiAgICAgICAgdGhpcy5pbml0TXV0YXRpb25PYnNlcnZlcigpO1xuICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgT2JqZWN0LmtleXModGhpcy5tdXRhdGlvbnMpKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gXCJyb290XCIgPT09IGVsZW1lbnQgPyB0aGlzIDogdGhpc1tlbGVtZW50XTtcbiAgICAgICAgICAgIHRoaXMubXV0YXRpb25DYWxsYmFja3MgPSBbXG4gICAgICAgICAgICAgICAgLi4uKHRoaXMubXV0YXRpb25DYWxsYmFja3MgfHwgW10pLFxuICAgICAgICAgICAgICAgIHsgLi4ueyBub2RlIH0sIC4uLnsgY2FsbGJhY2tzOiB0aGlzLm11dGF0aW9uc1tlbGVtZW50XSB9IH0sXG4gICAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERpc2Nvbm5lY3QgTXV0YXRpb25PYnNlcnZlclxuICAgICAqL1xuICAgIHJlbW92ZU11dGF0aW9ucygpIHtcbiAgICAgICAgaWYgKHRoaXMuX211dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX211dGF0aW9uT2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBNdXRhdGlvbk9ic2VydmVyXG4gICAgICogQHJldHVybnMge011dGF0aW9uT2JzZXJ2ZXJ9XG4gICAgICovXG4gICAgaW5pdE11dGF0aW9uT2JzZXJ2ZXIoKSB7XG4gICAgICAgIGlmICghdGhpcy5fbXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9XG4gICAgICAgICAgICAgICAgdGhpcy5tdXRhdGlvbk9ic2VydmVyT3B0aW9ucyB8fCBNVVRBVElPTl9PQlNFUlZFUl9PUFRJT05TO1xuICAgICAgICAgICAgdGhpcy5fbXV0YXRpb25PYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKFxuICAgICAgICAgICAgICAgIHRoaXMubXV0YXRpb25IYW5kbGVyLmJpbmQodGhpcylcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB0aGlzLl9tdXRhdGlvbk9ic2VydmVyLm9ic2VydmUodGhpcywgb3B0aW9ucyk7XG4gICAgICAgICAgICB0aGlzLl9tdXRhdGlvbk9ic2VydmVyLm9ic2VydmUodGhpcy5zaGFkb3csIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTGlzdGVuIHRvIG11dGF0aW9uc1xuICAgICAqIEBwYXJhbSB7TXV0YXRpb25SZWNvcmR9IG11dGF0aW9uTGlzdFxuICAgICAqIEBwYXJhbSB7TXV0YXRpb25PYnNlcnZlcn0gb2JzZXJ2ZXJcbiAgICAgKi9cbiAgICBtdXRhdGlvbkhhbmRsZXIobXV0YXRpb25MaXN0LCBvYnNlcnZlcikge1xuICAgICAgICBmb3IgKGNvbnN0IG11dGF0aW9uIG9mIG11dGF0aW9uTGlzdCkge1xuICAgICAgICAgICAgY29uc3QgY2FsbGJhY2tzID0gdGhpcy5tdXRhdGlvbkNhbGxiYWNrcy5maW5kKChjKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYy5ub2RlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgYy5ub2RlLmZpbHRlcigoaSkgPT4gaSA9PT0gbXV0YXRpb24udGFyZ2V0KS5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjLm5vZGUgPT09IG11dGF0aW9uLnRhcmdldDtcbiAgICAgICAgICAgIH0pPy5jYWxsYmFja3M7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LnZhbHVlcyhjYWxsYmFja3MpLmZvckVhY2goKGNvbmZpZ3MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgW2NvbmZpZ3NdXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmxhdCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKChjKSA9PiBjW211dGF0aW9uLnR5cGVdKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmZvckVhY2goKGNvbmZpZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZ1ttdXRhdGlvbi50eXBlXShtdXRhdGlvbiwgb2JzZXJ2ZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZ3JvdXAoXCJUeXBlRXJyb3I6IE11dGF0aW9uSGFuZGxlclwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiTXV0YXRpb25IYW5kbGVyIGlzIG5vdCBhIGZ1bmN0aW9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIk11dGF0aW9uOiAlb1wiLCBtdXRhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkhhbmRsZXIgQ29uZmlndXJhdGlvbjogJW9cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmdyb3VwRW5kKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgaW5pdENvbXBvbmVudChuYW1lLCBjb21wb25lbnQsIHRlbXBsYXRlKSB7XG4gICAgICAgIGNvbXBvbmVudC5wcm90b3R5cGUudGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGVtcGxhdGVcIik7XG4gICAgICAgIGNvbXBvbmVudC5wcm90b3R5cGUudGVtcGxhdGUuaW5uZXJIVE1MID0gdGVtcGxhdGU7XG4gICAgICAgIGN1c3RvbUVsZW1lbnRzLmRlZmluZShuYW1lLCBjb21wb25lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9idGFpbiBlbGVtZW50c1xuICAgICAqIHVzZWQgdG8gbWFwIGVsZW1lbnRzIHRvIGluc3RhbmNlIGZvciBsYXRlciB1c2VcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0LjxTdHJpbmc6IFN0cmluZz59XG4gICAgICovXG4gICAgZ2V0IGVsZW1lbnRzKCkge1xuICAgICAgICByZXR1cm4ge307XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT2J0YWluIGxpc3RlbmVyc1xuICAgICAqIHVzZWQgdG8gYWRkIGV2ZW50IGxpc3RlbmVyc1xuICAgICAqIEByZXR1cm5zIHtPYmplY3QuPFN0cmluZzogT2JqZWN0LjxTdHJpbmc6IFN0cmluZz59XG4gICAgICovXG4gICAgZ2V0IGxpc3RlbmVycygpIHtcbiAgICAgICAgcmV0dXJuIHt9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9idGFpbiBtdXRhdGlvbnNcbiAgICAgKiB1c2VkIHRvIGFkZCBjYWxsYmFja3MgdG8gbXV0YXRpb24gb2JzZXJ2ZXJcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0LjxTdHJpbmc6IE9iamVjdC48U3RyaW5nOiBTdHJpbmc+fVxuICAgICAqL1xuICAgIGdldCBtdXRhdGlvbnMoKSB7XG4gICAgICAgIHJldHVybiB7fTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgaWYgd2UgdXNlIG11dGF0aW9uc1xuICAgICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgICAqL1xuICAgIGdldCBoYXNNdXRhdGlvbnMoKSB7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLm11dGF0aW9ucykubGVuZ3RoID4gMDtcbiAgICB9XG59XG4iLCAiaW1wb3J0IHsgQWJzdHJhY3RDb21wb25lbnQgfSBmcm9tIFwiLi4vQWJzdHJhY3QuanNcIjtcblxuY29uc3QgSVRFTVNfQ09VTlQgPSAyNDtcbmNvbnN0IElURU1TX1VSTCA9IFwiaHR0cHM6Ly9kdW1teWpzb24uY29tL3Byb2R1Y3RzXCI7XG5cbmNsYXNzIExpc3QgZXh0ZW5kcyBBYnN0cmFjdENvbXBvbmVudCB7XG4gIGdldCBlbGVtZW50cygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaXRlbXM6IFwiLml0ZW1zXCIsXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIGNvbnNvbGUudGltZShcIkNhdGVnb3J5XCIpO1xuICAgIHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7XG4gICAgaWYgKHRoaXMuZGF0YXNldC5wd2EgPT09IFwidHJ1ZVwiKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBpdGVtcyA9IGF3YWl0IHRoaXMubG9hZCgpO1xuICAgICAgICBjb25zdCBub2RlcyA9IHRoaXMuaW5pdFByb2R1Y3RzKGl0ZW1zKTtcbiAgICAgICAgdGhpcy5yZW5kZXIobm9kZXMpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnNvbGUudGltZUVuZChcIkNhdGVnb3J5XCIpO1xuICB9XG5cbiAgYXN5bmMgbG9hZCgpIHtcbiAgICBjb25zb2xlLmdyb3VwQ29sbGFwc2VkKFwiU3RhcnQgbG9hZCB0aW1lci5cIik7XG4gICAgY29uc29sZS50aW1lKFwibG9hZFwiKTtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKElURU1TX1VSTCk7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgIGNvbnN0IGl0ZW1zID0gcmVzdWx0Py5wcm9kdWN0cz8uc2xpY2UoMCwgSVRFTVNfQ09VTlQpO1xuICAgIGNvbnNvbGUudGltZUVuZChcImxvYWRcIik7XG4gICAgY29uc29sZS5ncm91cEVuZCgpO1xuICAgIHJldHVybiBpdGVtcztcbiAgfVxuXG4gIGluaXRQcm9kdWN0cyhpdGVtcykge1xuICAgIGNvbnNvbGUuZ3JvdXBDb2xsYXBzZWQoXCJDcmVhdGluZyBwcm9kdWN0IHRpbGVzLi4uXCIpO1xuICAgIGNvbnNvbGUudGltZShcImluaXRQcm9kdWN0c1wiKTtcbiAgICBjb25zdCBub2RlcyA9IFtdO1xuICAgIGl0ZW1zLmZvckVhY2goKHApID0+IHtcbiAgICAgIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2F0ZWdvcnktaXRlbVwiKTtcbiAgICAgIG5vZGUucHJvZHVjdERhdGEgPSBwO1xuICAgICAgbm9kZXMucHVzaChub2RlKTtcbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZyhgLi4uJHtJVEVNU19DT1VOVH0gcHJvZHVjdCB0aWxlcyBjcmVhdGVkYCk7XG4gICAgY29uc29sZS50aW1lRW5kKFwiaW5pdFByb2R1Y3RzXCIpO1xuICAgIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbiAgICByZXR1cm4gbm9kZXM7XG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kIGl0ZW1zIGFuZCBhc3NpZ24gdG8gc2xvdFxuICAgKiBAcGFyYW0ge0FycmF5LjxIVE1MRWxlbWVudD59IG5vZGVzXG4gICAqL1xuICByZW5kZXIobm9kZXMpIHtcbiAgICBjb25zb2xlLmdyb3VwQ29sbGFwc2VkKFwiUmVuZGVyIHRpbGVzXCIpO1xuICAgIGNvbnNvbGUudGltZShcInJlbmRlclwiKTtcbiAgICBub2Rlcy5mb3JFYWNoKChwLCBrKSA9PiB7XG4gICAgICBpZiAoayA9PT0gNCkge1xuICAgICAgICBwLmNsYXNzTGlzdC5hZGQoXCJ3aWRlXCIpO1xuICAgICAgfVxuICAgICAgaWYgKGsgPT09IDEyKSB7XG4gICAgICAgIHAuY2xhc3NMaXN0LmFkZChcImJpZ1wiKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuYXBwZW5kQ2hpbGQocCk7XG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coYCR7SVRFTVNfQ09VTlR9IHByb2R1Y3QgdGlsZXMgcmVuZGVyZWRgKTtcbiAgICBjb25zb2xlLnRpbWVFbmQoXCJyZW5kZXJcIik7XG4gICAgY29uc29sZS5ncm91cEVuZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiBjYXRlZ29yeS1pdGVtJ3MgZnJvbSBzbG90XG4gICAqL1xuICBnZXQgcHJvZHVjdHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXRlbXMucXVlcnlTZWxlY3RvcihcInNsb3RcIikuYXNzaWduZWRFbGVtZW50cygpO1xuICB9XG59XG5cbmNvbnN0IHRlbXBsYXRlID0gLyogaHRtbCAqLyBgXG48c3R5bGU+XG4uaXRlbXMge1xuICBkaXNwbGF5OiBncmlkO1xuICBnYXA6IHZhcigtLWdhcC1sKTtcbiAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiByZXBlYXQoYXV0by1maXQsIG1pbm1heCh2YXIoLS1wcm9kdWN0LXRpbGUtd2lkdGgpLCAxZnIpKTtcbiAgZ3JpZC1hdXRvLWZsb3c6IGRlbnNlO1xufVxuPC9zdHlsZT5cbjxoMj5DYXRlZ29yeTwvaDI+XG48ZGl2IGNsYXNzPVwiaXRlbXNcIj5cbiAgPHNsb3Q+PC9zbG90PlxuPC9kaXY+XG5gO1xuXG5BYnN0cmFjdENvbXBvbmVudC5pbml0Q29tcG9uZW50KFwiY2F0ZWdvcnktbGlzdFwiLCBMaXN0LCB0ZW1wbGF0ZSk7XG4iLCAiaW1wb3J0IHsgQWJzdHJhY3RDb21wb25lbnQgfSBmcm9tIFwiLi4vQWJzdHJhY3QuanNcIjtcblxuY2xhc3MgSXRlbSBleHRlbmRzIEFic3RyYWN0Q29tcG9uZW50IHtcbiAgI19kYXRhID0gbnVsbDtcbiAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiZGF0YS1pbWdcIixcbiAgICAgIFwiZGF0YS1icmFuZFwiLFxuICAgICAgXCJkYXRhLXRpdGxlXCIsXG4gICAgICBcImRhdGEtcHJpY2VcIixcbiAgICAgIFwiZGF0YS1kZXNjcmlwdGlvblwiLFxuICAgIF07XG4gIH1cbiAgZ2V0IGVsZW1lbnRzKCkge1xuICAgIHJldHVybiB7XG4gICAgICBpbWdOb2RlOiBcImZpZ3VyZSBpbWdcIixcbiAgICAgIGJyYW5kTm9kZTogXCIucHJvZHVjdC1kYXRhIGg0XCIsXG4gICAgICB0aXRsZU5vZGU6IFwiLnByb2R1Y3QtZGF0YSBoM1wiLFxuICAgICAgcHJpY2VOb2RlOiBcIi5wcm9kdWN0LWRhdGEgc3BhblwiLFxuICAgICAgaG92ZXI6IFwiY2F0ZWdvcnktaXRlbS1ob3ZlclwiLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIGF0dHJpYnV0ZSBjaGFuZ2VcbiAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9sZFZhbHVlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuZXdWYWx1ZVxuICAgKi9cbiAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgIGlmIChvbGRWYWx1ZSA9PT0gbmV3VmFsdWUpIHJldHVybjtcbiAgICBjb25zdCBwcm9wID0gbmFtZS5zcGxpdChcIi1cIikucG9wKCk7XG4gICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICBjYXNlIFwiZGF0YS1pbWdcIjpcbiAgICAgICAgdGhpc1tgJHtwcm9wfU5vZGVgXS5zcmMgPSB0aGlzLmltZztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiZGF0YS10aXRsZVwiOlxuICAgICAgY2FzZSBcImRhdGEtYnJhbmRcIjpcbiAgICAgIGNhc2UgXCJkYXRhLXByaWNlXCI6XG4gICAgICAgIHRoaXNbYCR7cHJvcH1Ob2RlYF0uaW5uZXJUZXh0ID0gdGhpc1twcm9wXTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmICh0aGlzLmhvdmVyPy5yZW5kZXJEYXRhKSB7XG4gICAgICB0aGlzLmhvdmVyLnJlbmRlckRhdGEoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtTdHJpbmd9IHZcbiAgICovXG4gIHNldCBwcm9kdWN0RGF0YShkYXRhKSB7XG4gICAgdGhpcy4jX2RhdGEgPSBkYXRhO1xuICAgIHRoaXMudGl0bGUgPSBkYXRhLnRpdGxlO1xuICAgIHRoaXMuYnJhbmQgPSBkYXRhLmJyYW5kO1xuICAgIHRoaXMucHJpY2UgPSBkYXRhLnByaWNlO1xuICAgIHRoaXMuaW1nID0gZGF0YS5pbWFnZXNbMF07XG4gICAgdGhpcy5kZXNjcmlwdGlvbiA9IGRhdGEuZGVzY3JpcHRpb247XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtTdHJpbmd9IHZcbiAgICovXG4gIGdldCBwcm9kdWN0RGF0YSgpIHtcbiAgICByZXR1cm4gdGhpcy4jX2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7U3RyaW5nfVxuICAgKi9cbiAgZ2V0IGltZygpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhc2V0LmltZztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gdlxuICAgKi9cbiAgc2V0IGltZyh2KSB7XG4gICAgdGhpcy5kYXRhc2V0LmltZyA9IHYudG9TdHJpbmcoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAqL1xuICBnZXQgdGl0bGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YXNldC50aXRsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gdlxuICAgKi9cbiAgc2V0IHRpdGxlKHYpIHtcbiAgICB0aGlzLmRhdGFzZXQudGl0bGUgPSB2LnRvU3RyaW5nKCk7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7U3RyaW5nfVxuICAgKi9cbiAgZ2V0IGJyYW5kKCkge1xuICAgIHJldHVybiB0aGlzLmRhdGFzZXQuYnJhbmQ7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtTdHJpbmd9IHZcbiAgICovXG4gIHNldCBicmFuZCh2KSB7XG4gICAgdGhpcy5kYXRhc2V0LmJyYW5kID0gdi50b1N0cmluZygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICovXG4gIGdldCBwcmljZSgpIHtcbiAgICByZXR1cm4gcGFyc2VGbG9hdCh0aGlzLmRhdGFzZXQucHJpY2UpLnRvRml4ZWQoMik7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHZcbiAgICovXG4gIHNldCBwcmljZSh2KSB7XG4gICAgdGhpcy5kYXRhc2V0LnByaWNlID0gdi50b1N0cmluZygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICovXG4gIGdldCBkZXNjcmlwdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhc2V0LmRlc2NyaXB0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB2XG4gICAqL1xuICBzZXQgZGVzY3JpcHRpb24odikge1xuICAgIHRoaXMuZGF0YXNldC5kZXNjcmlwdGlvbiA9IHYudG9TdHJpbmcoKTtcbiAgfVxufVxuXG5jb25zdCB0ZW1wbGF0ZSA9IC8qIGh0bWwgKi8gYFxuPHN0eWxlPlxuOmhvc3Qge1xuICBib3gtc2hhZG93OiB2YXIoLS1saXN0LWl0ZW0tc2hhZG93KTtcbiAgYmFja2dyb3VuZC1jb2xvcjogaHNsKDAgMCUgOTUlKTtcbiAgZGlzcGxheTogZ3JpZDtcbiAgZ3JpZC10ZW1wbGF0ZS1yb3dzOiBtaW4tY29udGVudDtcbiAgcm93LWdhcDogdmFyKC0tZ2FwKTtcbiAgZ3JpZC10ZW1wbGF0ZS1hcmVhczpcbiAgICBcImltZ1wiXG4gICAgXCJkYXRhXCI7XG4gIHBhZGRpbmctYmxvY2stZW5kOiB2YXIoLS1nYXApO1xuICBib3JkZXItcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzKTtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xufVxuXG5maWd1cmUge1xuICBtYXJnaW46IDA7XG4gIHBhZGRpbmc6IDA7XG4gIGdyaWQtYXJlYTogaW1nO1xuICB3aWR0aDogMTAwJTtcbiAgYXNwZWN0LXJhdGlvOiAzIC8gNDtcbn1cbmltZyB7XG4gIGJhY2tncm91bmQtY29sb3I6IGhzbCgwIDAlIDg1JSk7XG4gIHdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IDEwMCU7XG4gIG9iamVjdC1maXQ6IGNvdmVyO1xufVxuXG4ucHJvZHVjdC1kYXRhIHtcbiAgcGFkZGluZy1pbmxpbmU6IHZhcigtLWdhcCk7XG4gIGRpc3BsYXk6IGdyaWQ7XG4gIHJvdy1nYXA6IHZhcigtLWdhcCk7XG4gIGdyaWQtYXJlYTogZGF0YTtcbiAgZ3JpZC10ZW1wbGF0ZS1yb3dzOiBtYXgtY29udGVudCAxZnIgbWF4LWNvbnRlbnQ7XG4gIGdyaWQtdGVtcGxhdGUtYXJlYXM6XG4gICAgXCJicmFuZFwiXG4gICAgXCJ0aXRsZVwiXG4gICAgXCJwcmljZVwiO1xufVxuXG4ucHJvZHVjdC1kYXRhID4gKiB7XG4gIHBhZGRpbmc6IDA7XG4gIG1hcmdpbjogMDtcbn1cblxuaDQge1xuICBncmlkLWFyZWE6IGJyYW5kO1xufVxuXG5oMyB7XG4gIGdyaWQtYXJlYTogdGl0bGU7XG59XG5cbnNwYW4ge1xuICBncmlkLWFyZWE6IHByaWNlO1xuICB0ZXh0LWFsaWduOiByaWdodDtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIGZvbnQtc2l6ZTogbGFyZ2VyO1xufVxuY2F0ZWdvcnktaXRlbS1ob3ZlciB7XG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDEyMCUpO1xuICAgIHRyYW5zaXRpb246IHRyYW5zZm9ybSAyNTBtcyBlYXNlLW91dDtcbn1cbjpob3N0KDpob3ZlcikgY2F0ZWdvcnktaXRlbS1ob3ZlciB7XG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDApO1xufVxuPC9zdHlsZT5cbjxmaWd1cmUgcGFydD1cInByb2R1Y3QtdGlsZS1tZWRpYVwiPlxuICAgIDxpbWcgbG9hZGluZz1cImxhenlcIiBwYXJ0PVwicHJvZHVjdC10aWxlLW1lZGlhLWltYWdlXCI+XG48L2ZpZ3VyZT5cbjxkaXYgY2xhc3M9XCJwcm9kdWN0LWRhdGFcIj5cbiAgICA8aDQgcGFydD1cInByb2R1Y3QtdGlsZS1oZWFkaW5nXCI+PC9oND5cbiAgICA8aDMgcGFydD1cInByb2R1Y3QtdGlsZS1oZWFkaW5nXCI+PC9oMz5cbiAgICA8c3BhbiBwYXJ0PVwicHJvZHVjdC10aWxlLXByaWNlXCI+PC9zcGFuPlxuPC9kaXY+XG48Y2F0ZWdvcnktaXRlbS1ob3ZlciBleHBvcnRwYXJ0cz1cInByb2R1Y3QtdGlsZS1wcmljZVwiPjwvY2F0ZWdvcnktaXRlbS1ob3Zlcj5cbmA7XG5cbkFic3RyYWN0Q29tcG9uZW50LmluaXRDb21wb25lbnQoXCJjYXRlZ29yeS1pdGVtXCIsIEl0ZW0sIHRlbXBsYXRlKTtcbiIsICJpbXBvcnQgeyBBYnN0cmFjdENvbXBvbmVudCB9IGZyb20gXCIuLi8uLi9BYnN0cmFjdC5qc1wiO1xuXG5jbGFzcyBIb3ZlciBleHRlbmRzIEFic3RyYWN0Q29tcG9uZW50IHtcbiAgZ2V0IGVsZW1lbnRzKCkge1xuICAgIHJldHVybiB7XG4gICAgICBicmFuZE5vZGU6IFwiaDRcIixcbiAgICAgIHRpdGxlTm9kZTogXCJoM1wiLFxuICAgICAgZGVzY3JpcHRpb25Ob2RlOiBcInBcIixcbiAgICAgIHByaWNlTm9kZTogXCJzcGFuXCIsXG4gICAgfTtcbiAgfVxuICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICBzdXBlci5jb25uZWN0ZWRDYWxsYmFjaygpO1xuICAgIHRoaXMucmVuZGVyRGF0YSgpO1xuICB9XG5cbiAgcmVuZGVyRGF0YSgpIHtcbiAgICB0aGlzLmJyYW5kTm9kZS5pbm5lclRleHQgPSB0aGlzLnBhcmVudE5vZGUuaG9zdC5icmFuZDtcbiAgICB0aGlzLnRpdGxlTm9kZS5pbm5lclRleHQgPSB0aGlzLnBhcmVudE5vZGUuaG9zdC50aXRsZTtcbiAgICB0aGlzLmRlc2NyaXB0aW9uTm9kZS5pbm5lclRleHQgPSB0aGlzLnBhcmVudE5vZGUuaG9zdC5kZXNjcmlwdGlvbjtcbiAgICB0aGlzLnByaWNlTm9kZS5pbm5lclRleHQgPSB0aGlzLnBhcmVudE5vZGUuaG9zdC5wcmljZTtcbiAgfVxufVxuXG5jb25zdCB0ZW1wbGF0ZSA9IC8qIGh0bWwgKi8gYFxuPHN0eWxlPlxuOmhvc3Qge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIGluc2V0OiBhdXRvIDAgMDtcbiAgYmFja2dyb3VuZDogdmFyKC0td2hpdGUpO1xuICBib3JkZXItdG9wLWxlZnQtcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzKTtcbiAgYm9yZGVyLXRvcC1yaWdodC1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMpO1xuICBib3gtc2hhZG93OiB2YXIoLS1jYXRlZ29yeS1pdGVtLWhvdmVyLXNoYWRvdyk7XG4gIGJhY2tncm91bmQtY29sb3I6IGhzbCgwIDAlIDk1JSk7XG4gIGRpc3BsYXk6IGdyaWQ7XG4gIGdyaWQtdGVtcGxhdGUtcm93czogbWluLWNvbnRlbnQ7XG4gIHJvdy1nYXA6IHZhcigtLWdhcCk7XG4gIGdyaWQtdGVtcGxhdGUtcm93czogbWluLWNvbnRlbnQgbWluLWNvbnRlbnQgMWZyIG1pbi1jb250ZW50IG1pbi1jb250ZW50O1xuICBncmlkLXRlbXBsYXRlLWFyZWFzOlxuICAgIFwiYnJhbmRcIlxuICAgIFwidGl0bGVcIlxuICAgIFwiZGVzY3JpcHRpb25cIlxuICAgIFwicHJpY2VcIlxuICAgIFwiYnV0dG9uc1wiO1xuICBwYWRkaW5nOiB2YXIoLS1nYXApO1xufVxuOmhvc3QgPiAqIHtcbiAgcGFkZGluZzogMDtcbiAgbWFyZ2luOiAwO1xufVxuaDQge1xuICBncmlkLWFyZWE6IGJyYW5kO1xufVxuaDMge1xuICBncmlkLWFyZWE6IHRpdGxlO1xufVxucCB7XG4gIGdyaWQtYXJlYTogZGVzY3JpcHRpb247XG59XG5zcGFuIHtcbiAgZ3JpZC1hcmVhOiBwcmljZTtcbiAgdGV4dC1hbGlnbjogcmlnaHQ7XG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xuICBmb250LXNpemU6IGxhcmdlcjtcbn1cbi5idXR0b25zIHtcbiAgZ3JpZC1hcmVhOiBidXR0b25zO1xuICBkaXNwbGF5OiBncmlkO1xuICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdCgyLCAxZnIpO1xuICBnYXA6IHZhcigtLWdhcC1zKTtcbn1cbi5idXR0b25zIGJ1dHRvbiB7XG4gIHdpZHRoOiAxMDAlO1xuICBib3JkZXI6IG5vbmU7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJsYWNrKTtcbiAgY29sb3I6IHZhcigtLXdoaXRlKTtcbiAgcGFkZGluZzogdmFyKC0tZ2FwKSB2YXIoLS1nYXAtbCk7XG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xuICBmb250LXNpemU6IGxhcmdlcjtcbn1cbi5idXR0b25zIGJ1dHRvbi5jdGEge1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1jbHItY3RhKTtcbn1cbjwvc3R5bGU+XG48aDQ+PC9oND5cbjxoMz48L2gzPlxuPHA+PC9wPlxuPHNwYW4gcGFydD1cInByb2R1Y3QtdGlsZS1wcmljZVwiPjwvc3Bhbj5cbjxkaXYgY2xhc3M9XCJidXR0b25zXCI+XG4gICAgPGJ1dHRvbj5EZXRhaWxzPC9idXR0b24+XG4gICAgPGJ1dHRvbiBjbGFzcz1cImN0YVwiPkNhcnQ8L2J1dHRvbj5cbjwvZGl2PlxuYDtcblxuQWJzdHJhY3RDb21wb25lbnQuaW5pdENvbXBvbmVudChcImNhdGVnb3J5LWl0ZW0taG92ZXJcIiwgSG92ZXIsIHRlbXBsYXRlKTtcbiIsICJpbXBvcnQgeyBBYnN0cmFjdENvbXBvbmVudCB9IGZyb20gXCIuLi8uLi9BYnN0cmFjdC5qc1wiO1xuXG5jbGFzcyBBY2NvcmRpb25JdGVtIGV4dGVuZHMgQWJzdHJhY3RDb21wb25lbnQge1xuICBzdGF0aWMgb2JzZXJ2ZWRBdHRyaWJ1dGVzID0gW1wiZGF0YS1vcGVuXCJdO1xuXG4gIC8qKiBAaW5oZXJpdGRvYyAqL1xuICBnZXQgZWxlbWVudHMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRlbnRTbG90OiBcImRpdi5jb250ZW50IHNsb3RcIixcbiAgICAgIGNvbnRlbnROb2RlOiBcImRpdi5jb250ZW50XCIsXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBAaW5oZXJpdGRvYyAqL1xuICBnZXQgbGlzdGVuZXJzKCkge1xuICAgIHJldHVybiB7XG4gICAgICBcImRpdi5sYWJlbFwiOiB7XG4gICAgICAgIGNsaWNrOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSByZW5kZXJcbiAgICovXG4gIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIGlmICghdGhpcy5jbGFzc0xpc3QuY29udGFpbnMoXCJjbG9uZVwiKSkge1xuICAgICAgc3VwZXIuY29ubmVjdGVkQ2FsbGJhY2soKTtcbiAgICAgIHRoaXMuZGF0YXNldC5vcGVuID0gdGhpcy5kYXRhc2V0Lm9wZW4gPz8gZmFsc2UudG9TdHJpbmcoKTtcbiAgICAgIHRoaXMuaW5pdENsb25lKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIGNsb25lIHNlbGYgYW5kIGhpZGUgaW4gb3BlbiBzdGF0ZVxuICAgKiBmb3IgbWVhc3VyaW5nIGhlaWdodFxuICAgKi9cbiAgaW5pdENsb25lKCkge1xuICAgIHRoaXMuY2xvbmUgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcigpO1xuICAgIHRoaXMuY2xvbmUuaW5uZXJIVE1MID0gdGhpcy5pbm5lckhUTUw7XG4gICAgdGhpcy5jbG9uZS5jbGFzc0xpc3QuYWRkKFwiY2xvbmVcIik7XG4gICAgdGhpcy5wYXJlbnROb2RlLmFwcGVuZENoaWxkKHRoaXMuY2xvbmUpO1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICB0aGlzLnN0eWxlLnNldFByb3BlcnR5KFwiLS1oZWlnaHRcIiwgdGhpcy5jbG9uZS5jb250ZW50Tm9kZS5vZmZzZXRIZWlnaHQpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBhdHRyaWJ1dGUgY2hhbmdlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvbGRWYWx1ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmV3VmFsdWVcbiAgICovXG4gIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICBpZiAoIXRoaXMuaXNDb25uZWN0ZWQgfHwgb2xkVmFsdWUgPT09IG5ld1ZhbHVlKSByZXR1cm47XG4gICAgaWYgKFwiZGF0YS1vcGVuXCIgPT09IG5hbWUpIHtcbiAgICAgIHRoaXMub3BlbiA9IG5ld1ZhbHVlID09PSBcInRydWVcIjtcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJjaGFuZ2VcIiwgeyBkZXRhaWw6IHRoaXMgfSkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiB0cmlnZ2VyIGhlaWdodCBjYWxjdWxhdGlvblxuICAgKi9cbiAgdXBkYXRlKCkge1xuICAgIGlmICh0aGlzLm9wZW4pIHtcbiAgICAgIHRoaXMuc3R5bGUuc2V0UHJvcGVydHkoXCItLWhlaWdodFwiLCB0aGlzLmNsb25lLmNvbnRlbnROb2RlLm9mZnNldEhlaWdodCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZSBvcGVuIHN0YXRlXG4gICAqL1xuICB0b2dnbGUoKSB7XG4gICAgdGhpcy5vcGVuID0gIXRoaXMub3BlbjtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiBvcGVuIHN0YXRlXG4gICAqL1xuICBnZXQgb3BlbigpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhc2V0Lm9wZW4gPT09IFwidHJ1ZVwiO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBvcGVuIHN0YXRlXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gdlxuICAgKi9cbiAgc2V0IG9wZW4odikge1xuICAgIGlmICh0aGlzLm9wZW4gIT09ICEhdikge1xuICAgICAgdGhpcy5kYXRhc2V0Lm9wZW4gPSAoISF2KS50b1N0cmluZygpO1xuICAgIH1cbiAgfVxufVxuXG5jb25zdCB0ZW1wbGF0ZSA9IC8qIGh0bWwgKi8gYFxuPHN0eWxlPlxuOmhvc3Qge1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xufVxuZGl2LmxhYmVsIHtcbiAgICBjdXJzb3I6IHBvaW50ZXI7XG59XG46aG9zdCg6bm90KC5jbG9uZSkpIGRpdi5jb250ZW50IHtcbiAgICBtYXgtaGVpZ2h0OiAwO1xufVxuZGl2LmNvbnRlbnQsXG5kaXYuY29udGVudCBzbG90OjpzbG90dGVkKCopIHtcbiAgICB0cmFuc2l0aW9uOiBhbGwgdmFyKC0tdHJhbnNpdGlvbi1kdXJhdGlvbiwgMjUwbXMpIHZhcigtLXRyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uLCBlYXNlLWluLW91dCk7XG59XG46aG9zdCg6bm90KC5jbG9uZSlbZGF0YS1vcGVuPVwidHJ1ZVwiXSkgZGl2LmNvbnRlbnQge1xuICAgIG1heC1oZWlnaHQ6IGNhbGModmFyKC0taGVpZ2h0KSAqIDFweCk7XG59XG46aG9zdCg6bm90KC5jbG9uZSk6bm90KFtkYXRhLW9wZW49XCJ0cnVlXCJdKSkgZGl2LmNvbnRlbnQgc2xvdDo6c2xvdHRlZCgqKSB7XG4gICAgbWFyZ2luLWJsb2NrOiAwO1xufVxuOmhvc3QoLmNsb25lKSB7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIGxlZnQ6IC0yMDB2dztcbiAgICB3aWR0aDogMTAwJTtcbn1cbjwvc3R5bGU+XG48ZGl2IGNsYXNzPVwibGFiZWxcIj48c2xvdCBuYW1lPVwibGFiZWxcIj48L3Nsb3Q+PC9kaXY+XG48ZGl2IGNsYXNzPVwiY29udGVudFwiPjxzbG90Pjwvc2xvdD48L2Rpdj5cbmA7XG5cbkFic3RyYWN0Q29tcG9uZW50LmluaXRDb21wb25lbnQoXCJhY2NvcmRpb24taXRlbVwiLCBBY2NvcmRpb25JdGVtLCB0ZW1wbGF0ZSk7XG4iLCAiaW1wb3J0IHsgQWJzdHJhY3RDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQWJzdHJhY3QuanNcIjtcbmltcG9ydCBcIi4vSXRlbS5qc1wiO1xuXG4vKipcbiAqIEBwcm9wZXJ0eSB7QXJyYXkuPEFjY29yZGlvbkl0ZW0+fSBpdGVtc1xuICovXG5jbGFzcyBBY2NvcmRpb24gZXh0ZW5kcyBBYnN0cmFjdENvbXBvbmVudCB7XG4gIC8qKiBAaW5oZXJpdGRvYyAqL1xuICBnZXQgZWxlbWVudHMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGl0ZW1TbG90OiBcInNsb3RcIixcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVcbiAgICovXG4gIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7XG4gICAgY29uc3QgZXZ0T3B0aW9ucyA9IHtcbiAgICAgIHNpZ25hbDogdGhpcy5kaXNjb25uZWN0ZWRTaWduYWwsXG4gICAgfTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCAoKSA9PiB0aGlzLnVwZGF0ZUl0ZW1MaXN0KCksIGV2dE9wdGlvbnMpO1xuICAgIHRoaXMuaXRlbVNsb3QuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgIFwic2xvdGNoYW5nZVwiLFxuICAgICAgKCkgPT4gdGhpcy51cGRhdGVJdGVtTGlzdCgwKSxcbiAgICAgIGV2dE9wdGlvbnNcbiAgICApO1xuICAgIGlmICghc2NyZWVuLm9yaWVudGF0aW9uKSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgXCJvcmllbnRhdGlvbmNoYW5nZVwiLFxuICAgICAgICAoKSA9PiB0aGlzLnVwZGF0ZUl0ZW1MaXN0KCksXG4gICAgICAgIGV2dE9wdGlvbnNcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjcmVlbi5vcmllbnRhdGlvbi5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICBcImNoYW5nZVwiLFxuICAgICAgICAoKSA9PiB0aGlzLnVwZGF0ZUl0ZW1MaXN0KCksXG4gICAgICAgIGV2dE9wdGlvbnNcbiAgICAgICk7XG4gICAgfVxuICAgIHRoaXMuaXRlbUNoYW5nZUhhbmRsZXIgPSB0aGlzLmhhbmRsZUl0ZW1DaGFuZ2UuYmluZCh0aGlzKTtcbiAgICB0aGlzLml0ZW1zLmZvckVhY2goKGkpID0+XG4gICAgICBpLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5pdGVtQ2hhbmdlSGFuZGxlciwgZXZ0T3B0aW9ucylcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBpdGVtIG9wZW4gc3RhdGUgY2hhbmdlXG4gICAqXG4gICAqIEBwYXJhbSB7Q3VzdG9tRXZlbnR9IGVcbiAgICovXG4gIGhhbmRsZUl0ZW1DaGFuZ2UoZSkge1xuICAgIHRoaXMuaXRlbXMuZm9yRWFjaCgoaSkgPT5cbiAgICAgIGkucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLml0ZW1DaGFuZ2VIYW5kbGVyKVxuICAgICk7XG4gICAgaWYgKGUuZGV0YWlsLm9wZW4gJiYgIXRoaXMubXVsdGkpIHtcbiAgICAgIHRoaXMuaXRlbXNcbiAgICAgICAgPy5maWx0ZXIoKGkpID0+IGkgIT09IGUuZGV0YWlsKVxuICAgICAgICAuZm9yRWFjaCgoaSkgPT4gKGkub3BlbiA9IGZhbHNlKSk7XG4gICAgfVxuICAgIHRoaXMuaXRlbXMuZm9yRWFjaCgoaSkgPT5cbiAgICAgIGkuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLml0ZW1DaGFuZ2VIYW5kbGVyLCB7XG4gICAgICAgIHNpZ25hbDogdGhpcy5kaXNjb25uZWN0ZWRTaWduYWwsXG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGxpc3Qgb2YgaXRlbXNcbiAgICpcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGRlYm91bmNlXG4gICAqL1xuICB1cGRhdGVJdGVtTGlzdChkZWJvdW5jZSA9IG51bGwpIHtcbiAgICBjb25zdCB0aW1lb3V0ID0gZGVib3VuY2UgPz8gNTA7XG4gICAgaWYgKHRoaXMuZGVib3VuY2VUaW1lb3V0KSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5kZWJvdW5jZVRpbWVvdXQpO1xuICAgIH1cbiAgICB0aGlzLmRlYm91bmNlVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5pdGVtcy5mb3JFYWNoKChpKSA9PiBpLnVwZGF0ZSgpKTtcbiAgICB9LCB0aW1lb3V0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZSBhbGwgaXRlbXNcbiAgICovXG4gIGNsb3NlQWxsKCkge1xuICAgIHRoaXMuaXRlbXMuZm9yRWFjaCgoaSkgPT4gKGkub3BlbiA9IGZhbHNlKSk7XG4gIH1cblxuICAvKipcbiAgICogb2J0YWluIGl0ZW1zXG4gICAqL1xuICBnZXQgaXRlbXMoKSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5xdWVyeVNlbGVjdG9yQWxsKFwiYWNjb3JkaW9uLWl0ZW06bm90KC5jbG9uZSlcIikpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZSBpZiBhY2NvcmRpb24gY2FuIG9wZW4gbXVsdGlwbGUgdGFic1xuICAgKi9cbiAgZ2V0IG11bHRpKCkge1xuICAgIHJldHVybiBcInVuZGVmaW5lZFwiICE9PSB0eXBlb2YgdGhpcy5kYXRhc2V0Lm11bHRpO1xuICB9XG59XG5cbmNvbnN0IHRlbXBsYXRlID0gLyogaHRtbCAqLyBgXG48c3R5bGU+XG46aG9zdCB7XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgIGRpc3BsYXk6IGJsb2NrO1xufVxuPC9zdHlsZT5cbjxzbG90Pjwvc2xvdD5cbmA7XG5cbkFic3RyYWN0Q29tcG9uZW50LmluaXRDb21wb25lbnQoXCJhY2NvcmRpb24tYm94XCIsIEFjY29yZGlvbiwgdGVtcGxhdGUpO1xuIiwgImltcG9ydCB7IEFic3RyYWN0Q29tcG9uZW50IH0gZnJvbSBcIi4uL0Fic3RyYWN0LmpzXCI7XG5cbmNsYXNzIFRvZG8gZXh0ZW5kcyBBYnN0cmFjdENvbXBvbmVudCB7XG4gIC8qKiBAaW5oZXJpdGRvYyAqL1xuICBnZXQgZWxlbWVudHMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJ1dHRvbjogXCJidXR0b25cIixcbiAgICAgIGlucHV0OiBcImlucHV0XCIsXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBAaW5oZXJpdGRvYyAqL1xuICBnZXQgbGlzdGVuZXJzKCkge1xuICAgIHJldHVybiB7XG4gICAgICBidXR0b246IHsgY2xpY2s6IHRoaXMuYWRkSGFuZGxlci5iaW5kKHRoaXMpIH0sXG4gICAgICBpbnB1dDogeyBrZXlkb3duOiB0aGlzLmFkZEhhbmRsZXIuYmluZCh0aGlzKSB9LFxuICAgIH07XG4gIH1cblxuICAvKiogQGluaGVyaXRkb2MgKi9cbiAgZ2V0IG11dGF0aW9ucygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcm9vdDogW3sgY2hpbGRMaXN0OiAobSwgbykgPT4gdGhpcy51cGRhdGVDb3VudGVyKG0sIG8pIH1dLFxuICAgIH07XG4gIH1cblxuICBnZXQgbXV0YXRpb25PYnNlcnZlck9wdGlvbnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBjb3VudGVyXG4gICAqL1xuICB1cGRhdGVDb3VudGVyKCkge1xuICAgIHRoaXMuc2hhZG93LnF1ZXJ5U2VsZWN0b3IoXCJoMyBzcGFuOmZpcnN0LW9mLXR5cGVcIikuaW5uZXJIVE1MID0gdGhpcy50b2Rvc1xuICAgICAgLmZpbHRlcigodCkgPT4gdC5kb25lKVxuICAgICAgLmxlbmd0aC50b1N0cmluZygpO1xuICAgIHRoaXMuc2hhZG93LnF1ZXJ5U2VsZWN0b3IoXCJoMyBzcGFuOmxhc3Qtb2YtdHlwZVwiKS5pbm5lckhUTUwgPVxuICAgICAgdGhpcy50b2Rvcy5sZW5ndGgudG9TdHJpbmcoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgYWRkIHRvZG9cbiAgICogQHBhcmFtIHtNb3VzZUV2ZW50fEtleWJvYXJkRXZlbnR9IGVcbiAgICovXG4gIGFkZEhhbmRsZXIoZSkge1xuICAgIGlmIChlLnR5cGUgPT09IFwia2V5ZG93blwiICYmIGUuY29kZSAhPT0gXCJFbnRlclwiKSByZXR1cm47XG4gICAgaWYgKHRoaXMuaW5wdXQudmFsaWRpdHkudmFsaWQpIHtcbiAgICAgIHRoaXMuYWRkVG9kbyh0aGlzLmlucHV0LnZhbHVlKTtcbiAgICAgIHRoaXMuaW5wdXQudmFsdWUgPSBcIlwiO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgdG9kb1xuICAgKiBAcGFyYW0ge1N0cmluZ30gbGFiZWxcbiAgICovXG4gIGFkZFRvZG8obGFiZWwpIHtcbiAgICBjb25zdCBpdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRvZG8taXRlbVwiKTtcbiAgICBpdGVtLmRhdGFzZXQubGFiZWwgPSBsYWJlbDtcbiAgICB0aGlzLmFwcGVuZENoaWxkKGl0ZW0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiB0b2Rvc1xuICAgKiBAcmV0dXJucyB7QXJyYXkuPE9iamVjdC48U3RyaW5nOiBsYWJlbCwgQm9vbGVhbjogZG9uZT4+fVxuICAgKi9cbiAgZ2V0IHRvZG9zKCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMucXVlcnlTZWxlY3RvckFsbChcInRvZG8taXRlbVwiKSkubWFwKChpKSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYWJlbDogaS5sYWJlbCxcbiAgICAgICAgZG9uZTogaS5jaGVja2VkLFxuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdG9kb3NcbiAgICogQHBhcmFtIHtBcnJheS48U3RyaW5nPn0gdlxuICAgKi9cbiAgc2V0IHRvZG9zKHYpIHtcbiAgICB0aGlzLnF1ZXJ5U2VsZWN0b3JBbGwoXCJ0b2RvLWl0ZW1cIikuZm9yRWFjaCgoaSkgPT4gaS5kZWxldGUoKSk7XG4gICAgdi5mb3JFYWNoKChpKSA9PiB0aGlzLmFkZFRvZG8odikpO1xuICB9XG59XG5cblRvZG8ucHJvdG90eXBlLnRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRlbXBsYXRlXCIpO1xuVG9kby5wcm90b3R5cGUudGVtcGxhdGUuaW5uZXJIVE1MID0gLypodG1sKi8gYFxuPHN0eWxlPlxuLmFkZCB7XG4gIHBhZGRpbmc6IHZhcigtLWxpc3QtaXRlbS1wYWRkaW5nKTtcbiAgZGlzcGxheTogZmxleDtcbiAgZ2FwOiB2YXIoLS1pdGVtLXBhZGRpbmctaW5saW5lKTtcbn1cbjwvc3R5bGU+XG48aDI+PHNsb3QgbmFtZT1cImhlYWRlclwiPllvdSBzaG91bGQgc2V0IGEgaGVhZGVyPC9zbG90PjwvaDI+XG48aDM+RG9uZTogPHNwYW4+PC9zcGFuPiAvIDxzcGFuPjwvc3Bhbj48L2gzPlxuPHNlY3Rpb24gY2xhc3M9XCJhZGRcIj5cbiAgPGlucHV0IHBsYWNlaG9sZGVyPVwiVG9kb1wiIHJlcXVpcmVkIG1pbj1cIjNcIj48YnV0dG9uPkFkZDwvYnV0dG9uPlxuPC9zZWN0aW9uPlxuPHNlY3Rpb24gY2xhc3M9XCJpdGVtc1wiPlxuICAgIDxzbG90Pjwvc2xvdD5cbjwvc2VjdGlvbj5cbmA7XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcInRvZG8tbGlzdFwiLCBUb2RvKTtcbiIsICJpbXBvcnQgeyBBYnN0cmFjdENvbXBvbmVudCB9IGZyb20gXCIuLi9BYnN0cmFjdC5qc1wiO1xuXG5jbGFzcyBJdGVtIGV4dGVuZHMgQWJzdHJhY3RDb21wb25lbnQge1xuICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICByZXR1cm4gW1wiZGF0YS1kb25lXCJdO1xuICB9XG5cbiAgLyoqIEBpbmhlcml0ZG9jICovXG4gIGdldCBlbGVtZW50cygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnV0dG9uOiBcImJ1dHRvblwiLFxuICAgICAgaW5wdXQ6IFwiaW5wdXRcIixcbiAgICB9O1xuICB9XG5cbiAgLyoqIEBpbmhlcml0ZG9jICovXG4gIGdldCBsaXN0ZW5lcnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJ1dHRvbjogeyBjbGljazogdGhpcy5kZWxldGVIYW5kbGVyLmJpbmQodGhpcykgfSxcbiAgICAgIGlucHV0OiB7IGNoYW5nZTogdGhpcy51cGRhdGVIYW5kbGVyLmJpbmQodGhpcykgfSxcbiAgICB9O1xuICB9XG5cbiAgLyoqIEBpbmhlcml0ZG9jICovXG4gIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7XG4gICAgdGhpcy5sYWJlbCA9IHRoaXMuZGF0YXNldC5sYWJlbDtcbiAgICB0aGlzLmNoZWNrZWQgPSB0aGlzLmRhdGFzZXQuZG9uZSA9PT0gXCJ0cnVlXCI7XG4gICAgdGhpcy5wYXJlbnROb2RlLnVwZGF0ZUNvdW50ZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgYXR0cmlidXRlIGNoYW5nZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb2xkVmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG5ld1ZhbHVlXG4gICAqL1xuICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgaWYgKCF0aGlzLmlucHV0IHx8IG9sZFZhbHVlID09PSBuZXdWYWx1ZSkgcmV0dXJuO1xuICAgIGlmIChcImRhdGEtZG9uZVwiID09PSBuYW1lKSB7XG4gICAgICB0aGlzLmNoZWNrZWQgPSBuZXdWYWx1ZSA9PT0gXCJ0cnVlXCI7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZVxuICAgKi9cbiAgdXBkYXRlSGFuZGxlcigpIHtcbiAgICB0aGlzLmRhdGFzZXQuZG9uZSA9IHRoaXMuY2hlY2tlZC50b1N0cmluZygpO1xuICAgIHRoaXMudG9nZ2xlTGluZVRocm91Z2goKTtcbiAgICB0aGlzLnBhcmVudE5vZGUudXBkYXRlQ291bnRlcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZVxuICAgKi9cbiAgZGVsZXRlSGFuZGxlcigpIHtcbiAgICB0aGlzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcyk7XG4gIH1cblxuICB0b2dnbGVMaW5lVGhyb3VnaCgpIHtcbiAgICB0aGlzLmlucHV0LnBhcmVudE5vZGUuY2xhc3NMaXN0LnRvZ2dsZShcImRvbmVcIiwgdGhpcy5jaGVja2VkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gY2hla2VkIHN0YXRlXG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgZ2V0IGNoZWNrZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5wdXQuY2hlY2tlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgY2hlY2tlZCBzdGF0ZVxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IHZcbiAgICovXG4gIHNldCBjaGVja2VkKHYpIHtcbiAgICBpZiAodGhpcy5jaGVja2VkICE9PSAhIXYpIHtcbiAgICAgIHRoaXMuaW5wdXQuY2hlY2tlZCA9ICEhdjtcbiAgICAgIHRoaXMudG9nZ2xlTGluZVRocm91Z2goKTtcbiAgICAgIHRoaXMuaW5wdXQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJjaGFuZ2VcIikpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gbGFiZWxcbiAgICogQHJldHVybnMge1N0cmluZ31cbiAgICovXG4gIGdldCBsYWJlbCgpIHtcbiAgICByZXR1cm4gdGhpcy5zaGFkb3cucXVlcnlTZWxlY3RvcihcImxhYmVsIHNwYW5cIikuaW5uZXJIVE1MO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBsYWJlbFxuICAgKiBAcGFyYW0ge1N0cmluZ30gdlxuICAgKi9cbiAgc2V0IGxhYmVsKHYpIHtcbiAgICB0aGlzLnNoYWRvdy5xdWVyeVNlbGVjdG9yKFwibGFiZWwgc3BhblwiKS5pbm5lckhUTUwgPSB2O1xuICB9XG59XG5cbkl0ZW0ucHJvdG90eXBlLnRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRlbXBsYXRlXCIpO1xuSXRlbS5wcm90b3R5cGUudGVtcGxhdGUuaW5uZXJIVE1MID0gLyogaHRtbCAqLyBgXG48c3R5bGU+XG46aG9zdCB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgYmFja2dyb3VuZDogdmFyKC0tY2xyLWJnLWxpc3QtaXRlbSk7XG4gIHBhZGRpbmc6IHZhcigtLWxpc3QtaXRlbS1wYWRkaW5nKTtcbn1cbjpob3N0KDpob3Zlcikge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jbHItYmctbGlzdC1pdGVtLWhvdmVyKTtcbn1cbmxhYmVsLmRvbmUgc3BhbiB7XG4gIHRleHQtZGVjb3JhdGlvbjogbGluZS10aHJvdWdoO1xufVxuPC9zdHlsZT5cbjxsYWJlbD5cbiAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCI+XG4gICAgPHNwYW4+PC9zcGFuPlxuPC9sYWJlbD5cbjxidXR0b24+RGVsZXRlPC9idXR0b24+XG5gO1xuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJ0b2RvLWl0ZW1cIiwgSXRlbSk7XG4iLCAiaW1wb3J0IHsgQWJzdHJhY3RDb21wb25lbnQgfSBmcm9tIFwiLi9BYnN0cmFjdC5qc1wiO1xuY2xhc3MgTXlDb21wb25lbnQgZXh0ZW5kcyBBYnN0cmFjdENvbXBvbmVudCB7XG4gIGdldCBlbGVtZW50cygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbXk6IFwiLm15RWxlbWVudFwiLFxuICAgICAgYnV0dG9uOiBcIi5idXR0b25cIixcbiAgICB9O1xuICB9XG4gIGdldCBsaXN0ZW5lcnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIFwiLmJ1dHRvblwiOiB7XG4gICAgICAgIGNsaWNrOiAoZSkgPT5cbiAgICAgICAgICB0aGlzLm15LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiIGFyZSBhd2Vzb21lISFcIikpLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG4gIGdldCBtdXRhdGlvbnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG15OiBbXG4gICAgICAgIHsgY2hpbGRMaXN0OiAobSwgbykgPT4gY29uc29sZS5sb2cobSkgfSxcbiAgICAgICAgeyBjaGlsZExpc3Q6IChtLCBvKSA9PiBjb25zb2xlLmxvZyhvKSB9LFxuICAgICAgICB7IGNoaWxkTGlzdDogXCJUaGlzIHJhaXNlcyBhbiBlcnJvclwiIH0sXG4gICAgICBdLFxuICAgICAgYnV0dG9uOiBbeyBjaGlsZExpc3Q6IChtLCBvKSA9PiBjb25zb2xlLmxvZyhtLCBvKSB9XSxcbiAgICB9O1xuICB9XG4gIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7XG4gICAgY29uc29sZS5sb2codGhpcy5teSk7XG4gIH1cbn1cbk15Q29tcG9uZW50LnByb3RvdHlwZS50ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZW1wbGF0ZVwiKTtcbk15Q29tcG9uZW50LnByb3RvdHlwZS50ZW1wbGF0ZS5pbm5lckhUTUwgPSAvKiBodG1sICovIGBcbjxidXR0b24gY2xhc3M9XCJidXR0b25cIj5DbGljayE8L2J1dHRvbj5cbjxkaXYgY2xhc3M9XCJteUVsZW1lbnRcIj5cbiAgICBXZWIgQ29tcG9uZW50c1xuPC9kaXY+XG5gO1xuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwibXktY29tcG9uZW50XCIsIE15Q29tcG9uZW50KTtcbiIsICJleHBvcnQgY2xhc3MgUm91dGVyIHtcbiAgI19yb3V0ZXMgPSBbXTtcbiAgI19pbml0aWFsID0gXCIvXCI7XG4gICNfY3VycmVudCA9IFwiL1wiO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuY3VycmVudCA9IGxvY2F0aW9uLnBhdGhuYW1lO1xuICAgIHRoaXMuaW5pdGlhbCA9IHRoaXMuY3VycmVudDtcbiAgICB0aGlzLmFib3J0Q29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICB0aGlzLmFib3J0U2lnbmFsID0gdGhpcy5hYm9ydENvbnRyb2xsZXIuc2lnbmFsO1xuICAgIGFkZEV2ZW50TGlzdGVuZXIoXCJwb3BzdGF0ZVwiLCAoZSkgPT4gdGhpcy5oYW5kbGVIaXN0b3J5UG9wKGUpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWZpbmUgcm91dGVzXG4gICAqIEBwYXJhbSB7U3RyaW5nfSByb3V0ZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICAgKi9cbiAgcm91dGUocm91dGUgPSBcIi9cIiwgY2IgPSAoKSA9PiB7fSkge1xuICAgIHRoaXMucm91dGVzLnB1c2goeyByb3V0ZSwgY2IgfSk7XG4gICAgdGhpcy5hZGRMaXN0ZW5lcihyb3V0ZSwgY2IpO1xuICB9XG5cbiAgYWRkTGlzdGVuZXIocm91dGUsIGNiKSB7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgW2hyZWY9XCIvJHtyb3V0ZX1cIl1gKS5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIFwiY2xpY2tcIixcbiAgICAgICAgKGUpID0+IHtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdGhpcy5wdXNoKHJvdXRlKTtcbiAgICAgICAgICBjYigpO1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgc2lnbmFsOiB0aGlzLmFib3J0U2lnbmFsLFxuICAgICAgICB9XG4gICAgICApO1xuICAgIH0pO1xuICB9XG5cbiAgYWRkTGlzdGVuZXJzKCkge1xuICAgIHRoaXMucm91dGVzLmZvckVhY2goKGkpID0+IHRoaXMuYWRkTGlzdGVuZXIoaS5yb3V0ZSwgaS5jYikpO1xuICB9XG5cbiAgcHVzaChyb3V0ZSkge1xuICAgIGhpc3RvcnkucHVzaFN0YXRlKHJvdXRlLCBcIlwiLCByb3V0ZSk7XG4gIH1cblxuICBoYW5kbGVIaXN0b3J5UG9wKGUpIHtcbiAgICB0aGlzLmFib3J0Q29udHJvbGxlci5hYm9ydCgpO1xuICAgIGlmIChsb2NhdGlvbi5wYXRobmFtZSA9PT0gdGhpcy5pbml0aWFsKSB7XG4gICAgICAvLyBXZSByZWxvYWQgdGhlIHBhZ2Ugc2luY2Ugd2UgY2Fubm90IGtub3cgaG93IHRvIHJlY3JlYXRlIHRoaXMgdmlld1xuICAgICAgbG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHJ1biB0aGUgYXNzaW9jaWF0ZWQgY2FsbGJhY2sgb3RoZXJ3aXNlXG4gICAgICB0aGlzLnJvdXRlcy5maW5kKChyKSA9PiBlLnN0YXRlID09PSByLnJvdXRlKT8uY2I/LigpO1xuICAgIH1cbiAgfVxuXG4gIGdldCBpbml0aWFsKCkge1xuICAgIHJldHVybiB0aGlzLiNfaW5pdGlhbDtcbiAgfVxuICBzZXQgaW5pdGlhbCh2KSB7XG4gICAgdGhpcy4jX2luaXRpYWwgPSB2O1xuICB9XG5cbiAgZ2V0IHJvdXRlcygpIHtcbiAgICByZXR1cm4gdGhpcy4jX3JvdXRlcztcbiAgfVxuICBzZXQgcm91dGVzKHYpIHtcbiAgICB0aGlzLiNfcm91dGVzID0gdjtcbiAgfVxuXG4gIGdldCBjdXJyZW50KCkge1xuICAgIHJldHVybiB0aGlzLiNfY3VycmVudDtcbiAgfVxuICBzZXQgY3VycmVudCh2KSB7XG4gICAgdGhpcy4jX2N1cnJlbnQgPSB2O1xuICB9XG59XG4iLCAiaW1wb3J0IFwiLi9Db21wb25lbnRzL0NhdGVnb3J5L2luZGV4LmpzXCI7XG5cbmNvbnN0IGNsZWFyQm9keSA9ICgpID0+IHtcbiAgZG9jdW1lbnQuYm9keVxuICAgIC5xdWVyeVNlbGVjdG9yQWxsKFwiOnNjb3BlID4gKlwiKVxuICAgIC5mb3JFYWNoKChuKSA9PiBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKG4pKTtcbn07XG5cbmV4cG9ydCBjb25zdCBpbml0ID0gKHJvdXRlcikgPT4ge1xuICByb3V0ZXIucm91dGUoXCJyb3V0ZXItdGVzdFwiLCAoKSA9PiB7XG4gICAgY29uc29sZS5sb2coXCJSb3V0ZWQgdG8gcm91dGVyLXRlc3RcIik7XG4gICAgY2xlYXJCb2R5KCk7XG4gICAgY29uc3Qgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYXRlZ29yeS1saXN0XCIpO1xuICAgIG5vZGUuZGF0YXNldC5wd2EgPSBcInRydWVcIjtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG5vZGUpO1xuICB9KTtcbn07XG4iLCAiaW1wb3J0IFwiLi9Db21wb25lbnRzL2J1aWxkLmpzXCI7XG5pbXBvcnQgeyBSb3V0ZXIgfSBmcm9tIFwiLi9Sb3V0ZXIuanNcIjtcbmltcG9ydCB7IGluaXQgYXMgaW5pdFJvdXRlcyB9IGZyb20gXCIuL3JvdXRlcy5qc1wiO1xuXG5jb25zdCByb3V0ZXIgPSBuZXcgUm91dGVyKCk7XG5pbml0Um91dGVzKHJvdXRlcik7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7QUFBQSxNQUFNLDRCQUE0QjtBQUFBLElBQzlCLFNBQVM7QUFBQSxJQUNULFlBQVk7QUFBQSxJQUNaLFdBQVc7QUFBQSxJQUNYLGVBQWU7QUFBQSxJQUNmLHVCQUF1QjtBQUFBLEVBQzNCO0FBRU8sTUFBTSxvQkFBTixjQUFnQyxZQUFZO0FBQUEsSUFDL0MsY0FBYztBQUNWLFlBQU07QUFDTixXQUFLLFNBQVMsS0FBSyxhQUFhLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDbEQsV0FBSyxPQUFPLFlBQVksS0FBSyxTQUFTLFFBQVEsVUFBVSxJQUFJLENBQUM7QUFDN0QsV0FBSyxhQUFhO0FBQUEsSUFDdEI7QUFBQSxJQUtBLG9CQUFvQjtBQUNoQixXQUFLLHVCQUF1QixJQUFJLGdCQUFnQjtBQUNoRCxXQUFLLHFCQUFxQixLQUFLLHFCQUFxQjtBQUNwRCxXQUFLLGFBQWE7QUFBQSxJQUN0QjtBQUFBLElBTUEsdUJBQXVCO0FBQ25CLFdBQUsscUJBQXFCLE1BQU07QUFDaEMsV0FBSyxnQkFBZ0I7QUFBQSxJQUN6QjtBQUFBLElBTUEsZUFBZTtBQUNYLGlCQUFXLFlBQVksT0FBTyxLQUFLLEtBQUssUUFBUSxHQUFHO0FBQy9DLGNBQU0sUUFBUSxNQUFNO0FBQUEsVUFDaEIsS0FBSyxPQUFPLGlCQUFpQixLQUFLLFNBQVMsU0FBUztBQUFBLFFBQ3hEO0FBQ0EsYUFBSyxZQUFZLE9BQU8sV0FBVyxJQUFJLE1BQU0sS0FB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
