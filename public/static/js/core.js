(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // js/Components/AbstractComponent.js
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
                console.error("MutationHandler is not a function");
                console.error("Mutation: %o", mutation);
                console.error("Handler Configuration: %o", config);
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
  var _AccordionItem = class extends AbstractComponent {
    get elements() {
      return {
        contentSlot: "div.content-slot slot",
        contentNode: "div.content-slot"
      };
    }
    get listeners() {
      return {
        "div.label-slot": {
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
      this.clone = new _AccordionItem();
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
        this.style.setProperty(
          "--height",
          this.clone.contentNode.offsetHeight.toString()
        );
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
  var AccordionItem = _AccordionItem;
  __publicField(AccordionItem, "observedAttributes", ["data-open"]);
  var template4 = `
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
    overflow: hidden;
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

  // js/Components/Lala.js
  var Lala = class extends HTMLElement {
    static get observedAttributes() {
      return ["data-test"];
    }
    constructor() {
      super();
      this.shadow = this.attachShadow({ mode: "closed" });
      this.shadow.appendChild(this.template.content.cloneNode(true));
      this._bla = null;
    }
    connectedCallback() {
      console.log("alive");
    }
    disconnectedCallback() {
      console.log("died");
    }
    attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case "data-test":
          console.log(arguments);
      }
    }
    get bla() {
      return this._bla;
    }
    set bla(v) {
      this._bla = v;
      this.shadow.querySelector("span").innerText = this._bla;
    }
  };
  Lala.prototype.template = document.createElement("template");
  Lala.prototype.template.innerHTML = `
<style>
:host {
  display: block;
  background: red;
  --lala-color: cyan;
}
:host div {
  color: white;
}
:host(.zipp) div {
  color: var(--lala-color);
}
</style>
<div>
<span></span>
<slot></slot>
</div>
`;
  customElements.define("lala-test", Lala);

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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3JjL2pzL0NvbXBvbmVudHMvQWJzdHJhY3RDb21wb25lbnQuanMiLCAiLi4vLi4vLi4vc3JjL2pzL0NvbXBvbmVudHMvQ2F0ZWdvcnkvTGlzdC5qcyIsICIuLi8uLi8uLi9zcmMvanMvQ29tcG9uZW50cy9DYXRlZ29yeS9JdGVtLmpzIiwgIi4uLy4uLy4uL3NyYy9qcy9Db21wb25lbnRzL0NhdGVnb3J5L0l0ZW0vSG92ZXIuanMiLCAiLi4vLi4vLi4vc3JjL2pzL0NvbXBvbmVudHMvRWxlbWVudHMvQWNjb3JkaW9uL0l0ZW0uanMiLCAiLi4vLi4vLi4vc3JjL2pzL0NvbXBvbmVudHMvRWxlbWVudHMvQWNjb3JkaW9uL2luZGV4LmpzIiwgIi4uLy4uLy4uL3NyYy9qcy9Db21wb25lbnRzL1RvZG8vTGlzdC5qcyIsICIuLi8uLi8uLi9zcmMvanMvQ29tcG9uZW50cy9Ub2RvL0l0ZW0uanMiLCAiLi4vLi4vLi4vc3JjL2pzL0NvbXBvbmVudHMvTXkuanMiLCAiLi4vLi4vLi4vc3JjL2pzL0NvbXBvbmVudHMvTGFsYS5qcyIsICIuLi8uLi8uLi9zcmMvanMvUm91dGVyLmpzIiwgIi4uLy4uLy4uL3NyYy9qcy9yb3V0ZXMuanMiLCAiLi4vLi4vLi4vc3JjL2pzL2NvcmUuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IE1VVEFUSU9OX09CU0VSVkVSX09QVElPTlMgPSB7XG4gIHN1YnRyZWU6IHRydWUsXG4gIGF0dHJpYnV0ZXM6IHRydWUsXG4gIGNoaWxkTGlzdDogdHJ1ZSxcbiAgY2hhcmFjdGVyRGF0YTogZmFsc2UsXG4gIGNoYXJhY3RlckRhdGFPbGRWYWx1ZTogZmFsc2UsXG59O1xuXG5leHBvcnQgY2xhc3MgQWJzdHJhY3RDb21wb25lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5zaGFkb3cgPSB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6IFwiY2xvc2VkXCIgfSk7XG4gICAgdGhpcy5zaGFkb3cuYXBwZW5kQ2hpbGQodGhpcy50ZW1wbGF0ZS5jb250ZW50LmNsb25lTm9kZSh0cnVlKSk7XG4gICAgdGhpcy5pbml0RWxlbWVudHMoKTtcbiAgfVxuICAvKipcbiAgICogSW5pdGlhbGl6ZVxuICAgKiBGaXJlZCB3aGVuIGFkZGVkIHRvIGRvbVxuICAgKi9cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgdGhpcy5kaXNjb25uZWN0Q29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICB0aGlzLmRpc2Nvbm5lY3RlZFNpZ25hbCA9IHRoaXMuZGlzY29ubmVjdENvbnRyb2xsZXIuc2lnbmFsO1xuICAgIHRoaXMuYWRkTGlzdGVuZXJzKCk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIGRpc2Nvbm5lY3RcbiAgICogRmlyZWQgd2hlbiByZW1vdmVkIGZyb20gZG9tXG4gICAqL1xuICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICB0aGlzLmRpc2Nvbm5lY3RDb250cm9sbGVyLmFib3J0KCk7XG4gICAgdGhpcy5yZW1vdmVNdXRhdGlvbnMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGVsZW1lbnRzXG4gICAqIEByZXR1cm5zIHt0aGlzfVxuICAgKi9cbiAgaW5pdEVsZW1lbnRzKCkge1xuICAgIGZvciAoY29uc3Qgc2VsZWN0b3Igb2YgT2JqZWN0LmtleXModGhpcy5lbGVtZW50cykpIHtcbiAgICAgIGNvbnN0IG5vZGVzID0gQXJyYXkuZnJvbShcbiAgICAgICAgdGhpcy5zaGFkb3cucXVlcnlTZWxlY3RvckFsbCh0aGlzLmVsZW1lbnRzW3NlbGVjdG9yXSlcbiAgICAgICk7XG4gICAgICB0aGlzW3NlbGVjdG9yXSA9IG5vZGVzPy5sZW5ndGggPT09IDEgPyBub2Rlc1swXSA6IG5vZGVzO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgbGlzdGVuZXJzXG4gICAqIEByZXR1cm5zIHt0aGlzfVxuICAgKi9cbiAgYWRkTGlzdGVuZXJzKCkge1xuICAgIHJldHVybiB0aGlzLmFkZEV2ZW50cygpLmFkZE11dGF0aW9ucygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBldmVudCBsaXN0ZW5lcnNcbiAgICogQHJldHVybnMge3RoaXN9XG4gICAqL1xuICBhZGRFdmVudHMoKSB7XG4gICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBPYmplY3Qua2V5cyh0aGlzLmxpc3RlbmVycykpIHtcbiAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMubGlzdGVuZXJzW3NlbGVjdG9yXTtcbiAgICAgIGxldCBjYjtcbiAgICAgIGZvciAoY29uc3QgZXZlbnQgb2YgT2JqZWN0LmtleXMoY29uZmlnKSkge1xuICAgICAgICBjb25zdCBub2RlcyA9XG4gICAgICAgICAgXCJyb290XCIgPT09IHNlbGVjdG9yXG4gICAgICAgICAgICA/IFt0aGlzLmdldFJvb3ROb2RlKCldXG4gICAgICAgICAgICA6IEFycmF5LmZyb20odGhpcy5zaGFkb3cucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpO1xuICAgICAgICBpZiAoXCJmdW5jdGlvblwiID09PSB0eXBlb2YgY29uZmlnW2V2ZW50XSkge1xuICAgICAgICAgIGNiID0gY29uZmlnW2V2ZW50XTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLmdyb3VwKFwiVHlwZUVycm9yOiBFdmVudEhhbmRsZXJcIik7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkV2ZW50SGFuZGxlciBpcyBub3QgYSBmdW5jdGlvblwiKTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiSGFuZGxlciBDb25maWd1cmF0aW9uOiAlb1wiLCBjb25maWcpO1xuICAgICAgICAgIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbiAgICAgICAgfVxuICAgICAgICBub2Rlcy5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgICAgICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBjYiwge1xuICAgICAgICAgICAgc2lnbmFsOiB0aGlzLmRpc2Nvbm5lY3RlZFNpZ25hbCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBtdXRhdGlvbiBvYnNlcnZlcnNcbiAgICogQHJldHVybnMge3RoaXN9XG4gICAqL1xuICBhZGRNdXRhdGlvbnMoKSB7XG4gICAgaWYgKCF0aGlzLmhhc011dGF0aW9ucykgcmV0dXJuO1xuICAgIHRoaXMuaW5pdE11dGF0aW9uT2JzZXJ2ZXIoKTtcbiAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgT2JqZWN0LmtleXModGhpcy5tdXRhdGlvbnMpKSB7XG4gICAgICBjb25zdCBub2RlID0gXCJyb290XCIgPT09IGVsZW1lbnQgPyB0aGlzIDogdGhpc1tlbGVtZW50XTtcbiAgICAgIHRoaXMubXV0YXRpb25DYWxsYmFja3MgPSBbXG4gICAgICAgIC4uLih0aGlzLm11dGF0aW9uQ2FsbGJhY2tzIHx8IFtdKSxcbiAgICAgICAgeyAuLi57IG5vZGUgfSwgLi4ueyBjYWxsYmFja3M6IHRoaXMubXV0YXRpb25zW2VsZW1lbnRdIH0gfSxcbiAgICAgIF07XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc2Nvbm5lY3QgTXV0YXRpb25PYnNlcnZlclxuICAgKi9cbiAgcmVtb3ZlTXV0YXRpb25zKCkge1xuICAgIGlmICh0aGlzLl9tdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICB0aGlzLl9tdXRhdGlvbk9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBNdXRhdGlvbk9ic2VydmVyXG4gICAqIEByZXR1cm5zIHtNdXRhdGlvbk9ic2VydmVyfVxuICAgKi9cbiAgaW5pdE11dGF0aW9uT2JzZXJ2ZXIoKSB7XG4gICAgaWYgKCF0aGlzLl9tdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICBjb25zdCBvcHRpb25zID0gdGhpcy5tdXRhdGlvbk9ic2VydmVyT3B0aW9ucyB8fCBNVVRBVElPTl9PQlNFUlZFUl9PUFRJT05TO1xuICAgICAgdGhpcy5fbXV0YXRpb25PYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKFxuICAgICAgICB0aGlzLm11dGF0aW9uSGFuZGxlci5iaW5kKHRoaXMpXG4gICAgICApO1xuICAgICAgdGhpcy5fbXV0YXRpb25PYnNlcnZlci5vYnNlcnZlKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgdGhpcy5fbXV0YXRpb25PYnNlcnZlci5vYnNlcnZlKHRoaXMuc2hhZG93LCBvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTGlzdGVuIHRvIG11dGF0aW9uc1xuICAgKiBAcGFyYW0ge011dGF0aW9uUmVjb3JkfSBtdXRhdGlvbkxpc3RcbiAgICogQHBhcmFtIHtNdXRhdGlvbk9ic2VydmVyfSBvYnNlcnZlclxuICAgKi9cbiAgbXV0YXRpb25IYW5kbGVyKG11dGF0aW9uTGlzdCwgb2JzZXJ2ZXIpIHtcbiAgICBmb3IgKGNvbnN0IG11dGF0aW9uIG9mIG11dGF0aW9uTGlzdCkge1xuICAgICAgY29uc3QgY2FsbGJhY2tzID0gdGhpcy5tdXRhdGlvbkNhbGxiYWNrcy5maW5kKChjKSA9PiB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGMubm9kZSkpIHtcbiAgICAgICAgICByZXR1cm4gYy5ub2RlLmZpbHRlcigoaSkgPT4gaSA9PT0gbXV0YXRpb24udGFyZ2V0KS5sZW5ndGggPiAwO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjLm5vZGUgPT09IG11dGF0aW9uLnRhcmdldDtcbiAgICAgIH0pPy5jYWxsYmFja3M7XG4gICAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICAgIE9iamVjdC52YWx1ZXMoY2FsbGJhY2tzKS5mb3JFYWNoKChjb25maWdzKSA9PiB7XG4gICAgICAgICAgW2NvbmZpZ3NdXG4gICAgICAgICAgICAuZmxhdCgpXG4gICAgICAgICAgICAuZmlsdGVyKChjKSA9PiBjW211dGF0aW9uLnR5cGVdKVxuICAgICAgICAgICAgLmZvckVhY2goKGNvbmZpZykgPT4ge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbmZpZ1ttdXRhdGlvbi50eXBlXShtdXRhdGlvbiwgb2JzZXJ2ZXIpO1xuICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZ3JvdXAoXCJUeXBlRXJyb3I6IE11dGF0aW9uSGFuZGxlclwiKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTXV0YXRpb25IYW5kbGVyIGlzIG5vdCBhIGZ1bmN0aW9uXCIpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJNdXRhdGlvbjogJW9cIiwgbXV0YXRpb24pO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJIYW5kbGVyIENvbmZpZ3VyYXRpb246ICVvXCIsIGNvbmZpZyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5ncm91cEVuZCgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIGluaXRDb21wb25lbnQobmFtZSwgY29tcG9uZW50LCB0ZW1wbGF0ZSkge1xuICAgIGNvbXBvbmVudC5wcm90b3R5cGUudGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGVtcGxhdGVcIik7XG4gICAgY29tcG9uZW50LnByb3RvdHlwZS50ZW1wbGF0ZS5pbm5lckhUTUwgPSB0ZW1wbGF0ZTtcbiAgICBjdXN0b21FbGVtZW50cy5kZWZpbmUobmFtZSwgY29tcG9uZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gZWxlbWVudHNcbiAgICogdXNlZCB0byBtYXAgZWxlbWVudHMgdG8gaW5zdGFuY2UgZm9yIGxhdGVyIHVzZVxuICAgKiBAcmV0dXJucyB7T2JqZWN0LjxTdHJpbmc6IFN0cmluZz59XG4gICAqL1xuICBnZXQgZWxlbWVudHMoKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiBsaXN0ZW5lcnNcbiAgICogdXNlZCB0byBhZGQgZXZlbnQgbGlzdGVuZXJzXG4gICAqIEByZXR1cm5zIHtPYmplY3QuPFN0cmluZzogT2JqZWN0LjxTdHJpbmc6IFN0cmluZz59XG4gICAqL1xuICBnZXQgbGlzdGVuZXJzKCkge1xuICAgIHJldHVybiB7fTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gbXV0YXRpb25zXG4gICAqIHVzZWQgdG8gYWRkIGNhbGxiYWNrcyB0byBtdXRhdGlvbiBvYnNlcnZlclxuICAgKiBAcmV0dXJucyB7T2JqZWN0LjxTdHJpbmc6IE9iamVjdC48U3RyaW5nOiBTdHJpbmc+fVxuICAgKi9cbiAgZ2V0IG11dGF0aW9ucygpIHtcbiAgICByZXR1cm4ge307XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lIGlmIHdlIHVzZSBtdXRhdGlvbnNcbiAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAqL1xuICBnZXQgaGFzTXV0YXRpb25zKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLm11dGF0aW9ucykubGVuZ3RoID4gMDtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFic3RyYWN0Q29tcG9uZW50IH0gZnJvbSBcIi4uL0Fic3RyYWN0Q29tcG9uZW50LmpzXCI7XG5cbmNvbnN0IElURU1TX0NPVU5UID0gMjQ7XG5jb25zdCBJVEVNU19VUkwgPSBcImh0dHBzOi8vZHVtbXlqc29uLmNvbS9wcm9kdWN0c1wiO1xuXG5jbGFzcyBMaXN0IGV4dGVuZHMgQWJzdHJhY3RDb21wb25lbnQge1xuICBnZXQgZWxlbWVudHMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGl0ZW1zOiBcIi5pdGVtc1wiLFxuICAgIH07XG4gIH1cblxuICBhc3luYyBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICBjb25zb2xlLnRpbWUoXCJDYXRlZ29yeVwiKTtcbiAgICBzdXBlci5jb25uZWN0ZWRDYWxsYmFjaygpO1xuICAgIGlmICh0aGlzLmRhdGFzZXQucHdhID09PSBcInRydWVcIikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgaXRlbXMgPSBhd2FpdCB0aGlzLmxvYWQoKTtcbiAgICAgICAgY29uc3Qgbm9kZXMgPSB0aGlzLmluaXRQcm9kdWN0cyhpdGVtcyk7XG4gICAgICAgIHRoaXMucmVuZGVyKG5vZGVzKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zb2xlLnRpbWVFbmQoXCJDYXRlZ29yeVwiKTtcbiAgfVxuXG4gIGFzeW5jIGxvYWQoKSB7XG4gICAgY29uc29sZS5ncm91cENvbGxhcHNlZChcIlN0YXJ0IGxvYWQgdGltZXIuXCIpO1xuICAgIGNvbnNvbGUudGltZShcImxvYWRcIik7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChJVEVNU19VUkwpO1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICBjb25zdCBpdGVtcyA9IHJlc3VsdD8ucHJvZHVjdHM/LnNsaWNlKDAsIElURU1TX0NPVU5UKTtcbiAgICBjb25zb2xlLnRpbWVFbmQoXCJsb2FkXCIpO1xuICAgIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbiAgICByZXR1cm4gaXRlbXM7XG4gIH1cblxuICBpbml0UHJvZHVjdHMoaXRlbXMpIHtcbiAgICBjb25zb2xlLmdyb3VwQ29sbGFwc2VkKFwiQ3JlYXRpbmcgcHJvZHVjdCB0aWxlcy4uLlwiKTtcbiAgICBjb25zb2xlLnRpbWUoXCJpbml0UHJvZHVjdHNcIik7XG4gICAgY29uc3Qgbm9kZXMgPSBbXTtcbiAgICBpdGVtcy5mb3JFYWNoKChwKSA9PiB7XG4gICAgICBjb25zdCBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhdGVnb3J5LWl0ZW1cIik7XG4gICAgICBub2RlLnByb2R1Y3REYXRhID0gcDtcbiAgICAgIG5vZGVzLnB1c2gobm9kZSk7XG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coYC4uLiR7SVRFTVNfQ09VTlR9IHByb2R1Y3QgdGlsZXMgY3JlYXRlZGApO1xuICAgIGNvbnNvbGUudGltZUVuZChcImluaXRQcm9kdWN0c1wiKTtcbiAgICBjb25zb2xlLmdyb3VwRW5kKCk7XG4gICAgcmV0dXJuIG5vZGVzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGVuZCBpdGVtcyBhbmQgYXNzaWduIHRvIHNsb3RcbiAgICogQHBhcmFtIHtBcnJheS48SFRNTEVsZW1lbnQ+fSBub2Rlc1xuICAgKi9cbiAgcmVuZGVyKG5vZGVzKSB7XG4gICAgY29uc29sZS5ncm91cENvbGxhcHNlZChcIlJlbmRlciB0aWxlc1wiKTtcbiAgICBjb25zb2xlLnRpbWUoXCJyZW5kZXJcIik7XG4gICAgbm9kZXMuZm9yRWFjaCgocCwgaykgPT4ge1xuICAgICAgaWYgKGsgPT09IDQpIHtcbiAgICAgICAgcC5jbGFzc0xpc3QuYWRkKFwid2lkZVwiKTtcbiAgICAgIH1cbiAgICAgIGlmIChrID09PSAxMikge1xuICAgICAgICBwLmNsYXNzTGlzdC5hZGQoXCJiaWdcIik7XG4gICAgICB9XG4gICAgICB0aGlzLmFwcGVuZENoaWxkKHApO1xuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKGAke0lURU1TX0NPVU5UfSBwcm9kdWN0IHRpbGVzIHJlbmRlcmVkYCk7XG4gICAgY29uc29sZS50aW1lRW5kKFwicmVuZGVyXCIpO1xuICAgIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gY2F0ZWdvcnktaXRlbSdzIGZyb20gc2xvdFxuICAgKi9cbiAgZ2V0IHByb2R1Y3RzKCkge1xuICAgIHJldHVybiB0aGlzLml0ZW1zLnF1ZXJ5U2VsZWN0b3IoXCJzbG90XCIpLmFzc2lnbmVkRWxlbWVudHMoKTtcbiAgfVxufVxuXG5jb25zdCB0ZW1wbGF0ZSA9IC8qIGh0bWwgKi8gYFxuPHN0eWxlPlxuLml0ZW1zIHtcbiAgZGlzcGxheTogZ3JpZDtcbiAgZ2FwOiB2YXIoLS1nYXAtbCk7XG4gIGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KGF1dG8tZml0LCBtaW5tYXgodmFyKC0tcHJvZHVjdC10aWxlLXdpZHRoKSwgMWZyKSk7XG4gIGdyaWQtYXV0by1mbG93OiBkZW5zZTtcbn1cbjwvc3R5bGU+XG48aDI+Q2F0ZWdvcnk8L2gyPlxuPGRpdiBjbGFzcz1cIml0ZW1zXCI+XG4gIDxzbG90Pjwvc2xvdD5cbjwvZGl2PlxuYDtcblxuQWJzdHJhY3RDb21wb25lbnQuaW5pdENvbXBvbmVudChcImNhdGVnb3J5LWxpc3RcIiwgTGlzdCwgdGVtcGxhdGUpO1xuIiwgImltcG9ydCB7IEFic3RyYWN0Q29tcG9uZW50IH0gZnJvbSBcIi4uL0Fic3RyYWN0Q29tcG9uZW50LmpzXCI7XG5cbmNsYXNzIEl0ZW0gZXh0ZW5kcyBBYnN0cmFjdENvbXBvbmVudCB7XG4gICNfZGF0YSA9IG51bGw7XG4gIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkge1xuICAgIHJldHVybiBbXG4gICAgICBcImRhdGEtaW1nXCIsXG4gICAgICBcImRhdGEtYnJhbmRcIixcbiAgICAgIFwiZGF0YS10aXRsZVwiLFxuICAgICAgXCJkYXRhLXByaWNlXCIsXG4gICAgICBcImRhdGEtZGVzY3JpcHRpb25cIixcbiAgICBdO1xuICB9XG4gIGdldCBlbGVtZW50cygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaW1nTm9kZTogXCJmaWd1cmUgaW1nXCIsXG4gICAgICBicmFuZE5vZGU6IFwiLnByb2R1Y3QtZGF0YSBoNFwiLFxuICAgICAgdGl0bGVOb2RlOiBcIi5wcm9kdWN0LWRhdGEgaDNcIixcbiAgICAgIHByaWNlTm9kZTogXCIucHJvZHVjdC1kYXRhIHNwYW5cIixcbiAgICAgIGhvdmVyOiBcImNhdGVnb3J5LWl0ZW0taG92ZXJcIixcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBhdHRyaWJ1dGUgY2hhbmdlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvbGRWYWx1ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmV3VmFsdWVcbiAgICovXG4gIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICBpZiAob2xkVmFsdWUgPT09IG5ld1ZhbHVlKSByZXR1cm47XG4gICAgY29uc3QgcHJvcCA9IG5hbWUuc3BsaXQoXCItXCIpLnBvcCgpO1xuICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgY2FzZSBcImRhdGEtaW1nXCI6XG4gICAgICAgIHRoaXNbYCR7cHJvcH1Ob2RlYF0uc3JjID0gdGhpcy5pbWc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImRhdGEtdGl0bGVcIjpcbiAgICAgIGNhc2UgXCJkYXRhLWJyYW5kXCI6XG4gICAgICBjYXNlIFwiZGF0YS1wcmljZVwiOlxuICAgICAgICB0aGlzW2Ake3Byb3B9Tm9kZWBdLmlubmVyVGV4dCA9IHRoaXNbcHJvcF07XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAodGhpcy5ob3Zlcj8ucmVuZGVyRGF0YSkge1xuICAgICAgdGhpcy5ob3Zlci5yZW5kZXJEYXRhKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB2XG4gICAqL1xuICBzZXQgcHJvZHVjdERhdGEoZGF0YSkge1xuICAgIHRoaXMuI19kYXRhID0gZGF0YTtcbiAgICB0aGlzLnRpdGxlID0gZGF0YS50aXRsZTtcbiAgICB0aGlzLmJyYW5kID0gZGF0YS5icmFuZDtcbiAgICB0aGlzLnByaWNlID0gZGF0YS5wcmljZTtcbiAgICB0aGlzLmltZyA9IGRhdGEuaW1hZ2VzWzBdO1xuICAgIHRoaXMuZGVzY3JpcHRpb24gPSBkYXRhLmRlc2NyaXB0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB2XG4gICAqL1xuICBnZXQgcHJvZHVjdERhdGEoKSB7XG4gICAgcmV0dXJuIHRoaXMuI19kYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICovXG4gIGdldCBpbWcoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YXNldC5pbWc7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtTdHJpbmd9IHZcbiAgICovXG4gIHNldCBpbWcodikge1xuICAgIHRoaXMuZGF0YXNldC5pbWcgPSB2LnRvU3RyaW5nKCk7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybiB7U3RyaW5nfVxuICAgKi9cbiAgZ2V0IHRpdGxlKCkge1xuICAgIHJldHVybiB0aGlzLmRhdGFzZXQudGl0bGU7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtTdHJpbmd9IHZcbiAgICovXG4gIHNldCB0aXRsZSh2KSB7XG4gICAgdGhpcy5kYXRhc2V0LnRpdGxlID0gdi50b1N0cmluZygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICovXG4gIGdldCBicmFuZCgpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhc2V0LmJyYW5kO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB2XG4gICAqL1xuICBzZXQgYnJhbmQodikge1xuICAgIHRoaXMuZGF0YXNldC5icmFuZCA9IHYudG9TdHJpbmcoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAqL1xuICBnZXQgcHJpY2UoKSB7XG4gICAgcmV0dXJuIHBhcnNlRmxvYXQodGhpcy5kYXRhc2V0LnByaWNlKS50b0ZpeGVkKDIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB2XG4gICAqL1xuICBzZXQgcHJpY2Uodikge1xuICAgIHRoaXMuZGF0YXNldC5wcmljZSA9IHYudG9TdHJpbmcoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAqL1xuICBnZXQgZGVzY3JpcHRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YXNldC5kZXNjcmlwdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge051bWJlcn0gdlxuICAgKi9cbiAgc2V0IGRlc2NyaXB0aW9uKHYpIHtcbiAgICB0aGlzLmRhdGFzZXQuZGVzY3JpcHRpb24gPSB2LnRvU3RyaW5nKCk7XG4gIH1cbn1cblxuY29uc3QgdGVtcGxhdGUgPSAvKiBodG1sICovIGBcbjxzdHlsZT5cbjpob3N0IHtcbiAgYm94LXNoYWRvdzogdmFyKC0tbGlzdC1pdGVtLXNoYWRvdyk7XG4gIGJhY2tncm91bmQtY29sb3I6IGhzbCgwIDAlIDk1JSk7XG4gIGRpc3BsYXk6IGdyaWQ7XG4gIGdyaWQtdGVtcGxhdGUtcm93czogbWluLWNvbnRlbnQ7XG4gIHJvdy1nYXA6IHZhcigtLWdhcCk7XG4gIGdyaWQtdGVtcGxhdGUtYXJlYXM6XG4gICAgXCJpbWdcIlxuICAgIFwiZGF0YVwiO1xuICBwYWRkaW5nLWJsb2NrLWVuZDogdmFyKC0tZ2FwKTtcbiAgYm9yZGVyLXJhZGl1czogdmFyKC0tYm9yZGVyLXJhZGl1cyk7XG4gIG92ZXJmbG93OiBoaWRkZW47XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cblxuZmlndXJlIHtcbiAgbWFyZ2luOiAwO1xuICBwYWRkaW5nOiAwO1xuICBncmlkLWFyZWE6IGltZztcbiAgd2lkdGg6IDEwMCU7XG4gIGFzcGVjdC1yYXRpbzogMyAvIDQ7XG59XG5pbWcge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiBoc2woMCAwJSA4NSUpO1xuICB3aWR0aDogMTAwJTtcbiAgaGVpZ2h0OiAxMDAlO1xuICBvYmplY3QtZml0OiBjb3Zlcjtcbn1cblxuLnByb2R1Y3QtZGF0YSB7XG4gIHBhZGRpbmctaW5saW5lOiB2YXIoLS1nYXApO1xuICBkaXNwbGF5OiBncmlkO1xuICByb3ctZ2FwOiB2YXIoLS1nYXApO1xuICBncmlkLWFyZWE6IGRhdGE7XG4gIGdyaWQtdGVtcGxhdGUtcm93czogbWF4LWNvbnRlbnQgMWZyIG1heC1jb250ZW50O1xuICBncmlkLXRlbXBsYXRlLWFyZWFzOlxuICAgIFwiYnJhbmRcIlxuICAgIFwidGl0bGVcIlxuICAgIFwicHJpY2VcIjtcbn1cblxuLnByb2R1Y3QtZGF0YSA+ICoge1xuICBwYWRkaW5nOiAwO1xuICBtYXJnaW46IDA7XG59XG5cbmg0IHtcbiAgZ3JpZC1hcmVhOiBicmFuZDtcbn1cblxuaDMge1xuICBncmlkLWFyZWE6IHRpdGxlO1xufVxuXG5zcGFuIHtcbiAgZ3JpZC1hcmVhOiBwcmljZTtcbiAgdGV4dC1hbGlnbjogcmlnaHQ7XG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xuICBmb250LXNpemU6IGxhcmdlcjtcbn1cbmNhdGVnb3J5LWl0ZW0taG92ZXIge1xuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgxMjAlKTtcbiAgICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gMjUwbXMgZWFzZS1vdXQ7XG59XG46aG9zdCg6aG92ZXIpIGNhdGVnb3J5LWl0ZW0taG92ZXIge1xuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgwKTtcbn1cbjwvc3R5bGU+XG48ZmlndXJlIHBhcnQ9XCJwcm9kdWN0LXRpbGUtbWVkaWFcIj5cbiAgICA8aW1nIGxvYWRpbmc9XCJsYXp5XCIgcGFydD1cInByb2R1Y3QtdGlsZS1tZWRpYS1pbWFnZVwiPlxuPC9maWd1cmU+XG48ZGl2IGNsYXNzPVwicHJvZHVjdC1kYXRhXCI+XG4gICAgPGg0IHBhcnQ9XCJwcm9kdWN0LXRpbGUtaGVhZGluZ1wiPjwvaDQ+XG4gICAgPGgzIHBhcnQ9XCJwcm9kdWN0LXRpbGUtaGVhZGluZ1wiPjwvaDM+XG4gICAgPHNwYW4gcGFydD1cInByb2R1Y3QtdGlsZS1wcmljZVwiPjwvc3Bhbj5cbjwvZGl2PlxuPGNhdGVnb3J5LWl0ZW0taG92ZXIgZXhwb3J0cGFydHM9XCJwcm9kdWN0LXRpbGUtcHJpY2VcIj48L2NhdGVnb3J5LWl0ZW0taG92ZXI+XG5gO1xuXG5BYnN0cmFjdENvbXBvbmVudC5pbml0Q29tcG9uZW50KFwiY2F0ZWdvcnktaXRlbVwiLCBJdGVtLCB0ZW1wbGF0ZSk7XG4iLCAiaW1wb3J0IHsgQWJzdHJhY3RDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQWJzdHJhY3RDb21wb25lbnQuanNcIjtcblxuY2xhc3MgSG92ZXIgZXh0ZW5kcyBBYnN0cmFjdENvbXBvbmVudCB7XG4gIGdldCBlbGVtZW50cygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnJhbmROb2RlOiBcImg0XCIsXG4gICAgICB0aXRsZU5vZGU6IFwiaDNcIixcbiAgICAgIGRlc2NyaXB0aW9uTm9kZTogXCJwXCIsXG4gICAgICBwcmljZU5vZGU6IFwic3BhblwiLFxuICAgIH07XG4gIH1cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgc3VwZXIuY29ubmVjdGVkQ2FsbGJhY2soKTtcbiAgICB0aGlzLnJlbmRlckRhdGEoKTtcbiAgfVxuXG4gIHJlbmRlckRhdGEoKSB7XG4gICAgdGhpcy5icmFuZE5vZGUuaW5uZXJUZXh0ID0gdGhpcy5wYXJlbnROb2RlLmhvc3QuYnJhbmQ7XG4gICAgdGhpcy50aXRsZU5vZGUuaW5uZXJUZXh0ID0gdGhpcy5wYXJlbnROb2RlLmhvc3QudGl0bGU7XG4gICAgdGhpcy5kZXNjcmlwdGlvbk5vZGUuaW5uZXJUZXh0ID0gdGhpcy5wYXJlbnROb2RlLmhvc3QuZGVzY3JpcHRpb247XG4gICAgdGhpcy5wcmljZU5vZGUuaW5uZXJUZXh0ID0gdGhpcy5wYXJlbnROb2RlLmhvc3QucHJpY2U7XG4gIH1cbn1cblxuY29uc3QgdGVtcGxhdGUgPSAvKiBodG1sICovIGBcbjxzdHlsZT5cbjpob3N0IHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBpbnNldDogYXV0byAwIDA7XG4gIGJhY2tncm91bmQ6IHZhcigtLXdoaXRlKTtcbiAgYm9yZGVyLXRvcC1sZWZ0LXJhZGl1czogdmFyKC0tYm9yZGVyLXJhZGl1cyk7XG4gIGJvcmRlci10b3AtcmlnaHQtcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzKTtcbiAgYm94LXNoYWRvdzogdmFyKC0tY2F0ZWdvcnktaXRlbS1ob3Zlci1zaGFkb3cpO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiBoc2woMCAwJSA5NSUpO1xuICBkaXNwbGF5OiBncmlkO1xuICBncmlkLXRlbXBsYXRlLXJvd3M6IG1pbi1jb250ZW50O1xuICByb3ctZ2FwOiB2YXIoLS1nYXApO1xuICBncmlkLXRlbXBsYXRlLXJvd3M6IG1pbi1jb250ZW50IG1pbi1jb250ZW50IDFmciBtaW4tY29udGVudCBtaW4tY29udGVudDtcbiAgZ3JpZC10ZW1wbGF0ZS1hcmVhczpcbiAgICBcImJyYW5kXCJcbiAgICBcInRpdGxlXCJcbiAgICBcImRlc2NyaXB0aW9uXCJcbiAgICBcInByaWNlXCJcbiAgICBcImJ1dHRvbnNcIjtcbiAgcGFkZGluZzogdmFyKC0tZ2FwKTtcbn1cbjpob3N0ID4gKiB7XG4gIHBhZGRpbmc6IDA7XG4gIG1hcmdpbjogMDtcbn1cbmg0IHtcbiAgZ3JpZC1hcmVhOiBicmFuZDtcbn1cbmgzIHtcbiAgZ3JpZC1hcmVhOiB0aXRsZTtcbn1cbnAge1xuICBncmlkLWFyZWE6IGRlc2NyaXB0aW9uO1xufVxuc3BhbiB7XG4gIGdyaWQtYXJlYTogcHJpY2U7XG4gIHRleHQtYWxpZ246IHJpZ2h0O1xuICBmb250LXdlaWdodDogYm9sZDtcbiAgZm9udC1zaXplOiBsYXJnZXI7XG59XG4uYnV0dG9ucyB7XG4gIGdyaWQtYXJlYTogYnV0dG9ucztcbiAgZGlzcGxheTogZ3JpZDtcbiAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiByZXBlYXQoMiwgMWZyKTtcbiAgZ2FwOiB2YXIoLS1nYXAtcyk7XG59XG4uYnV0dG9ucyBidXR0b24ge1xuICB3aWR0aDogMTAwJTtcbiAgYm9yZGVyOiBub25lO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1ibGFjayk7XG4gIGNvbG9yOiB2YXIoLS13aGl0ZSk7XG4gIHBhZGRpbmc6IHZhcigtLWdhcCkgdmFyKC0tZ2FwLWwpO1xuICBmb250LXdlaWdodDogYm9sZDtcbiAgZm9udC1zaXplOiBsYXJnZXI7XG59XG4uYnV0dG9ucyBidXR0b24uY3RhIHtcbiAgYmFja2dyb3VuZDogdmFyKC0tY2xyLWN0YSk7XG59XG48L3N0eWxlPlxuPGg0PjwvaDQ+XG48aDM+PC9oMz5cbjxwPjwvcD5cbjxzcGFuIHBhcnQ9XCJwcm9kdWN0LXRpbGUtcHJpY2VcIj48L3NwYW4+XG48ZGl2IGNsYXNzPVwiYnV0dG9uc1wiPlxuICAgIDxidXR0b24+RGV0YWlsczwvYnV0dG9uPlxuICAgIDxidXR0b24gY2xhc3M9XCJjdGFcIj5DYXJ0PC9idXR0b24+XG48L2Rpdj5cbmA7XG5cbkFic3RyYWN0Q29tcG9uZW50LmluaXRDb21wb25lbnQoXCJjYXRlZ29yeS1pdGVtLWhvdmVyXCIsIEhvdmVyLCB0ZW1wbGF0ZSk7XG4iLCAiLy9AdHMtbm9jaGVja1xuaW1wb3J0IHsgQWJzdHJhY3RDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQWJzdHJhY3RDb21wb25lbnQuanNcIjtcblxuLyoqXG4gKiBAcHJvcGVydHkge0hUTUxEaXZFbGVtZW50fSBjb250ZW50Tm9kZVxuICogQHByb3BlcnR5IHtIVE1MU2xvdEVsZW1lbnR9IGNvbnRlbnRTbG90XG4gKiBAcHJvcGVydHkge0FjY29yZGlvbkl0ZW19IGNsb25lXG4gKi9cbmNsYXNzIEFjY29yZGlvbkl0ZW0gZXh0ZW5kcyBBYnN0cmFjdENvbXBvbmVudCB7XG4gIHN0YXRpYyBvYnNlcnZlZEF0dHJpYnV0ZXMgPSBbXCJkYXRhLW9wZW5cIl07XG5cbiAgLyoqIEBpbmhlcml0ZG9jICovXG4gIGdldCBlbGVtZW50cygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29udGVudFNsb3Q6IFwiZGl2LmNvbnRlbnQtc2xvdCBzbG90XCIsXG4gICAgICBjb250ZW50Tm9kZTogXCJkaXYuY29udGVudC1zbG90XCIsXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBAaW5oZXJpdGRvYyAqL1xuICBnZXQgbGlzdGVuZXJzKCkge1xuICAgIHJldHVybiB7XG4gICAgICBcImRpdi5sYWJlbC1zbG90XCI6IHtcbiAgICAgICAgY2xpY2s6IHRoaXMudG9nZ2xlLmJpbmQodGhpcyksXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIHJlbmRlclxuICAgKi9cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgaWYgKCF0aGlzLmNsYXNzTGlzdC5jb250YWlucyhcImNsb25lXCIpKSB7XG4gICAgICBzdXBlci5jb25uZWN0ZWRDYWxsYmFjaygpO1xuICAgICAgdGhpcy5kYXRhc2V0Lm9wZW4gPSB0aGlzLmRhdGFzZXQub3BlbiA/PyBmYWxzZS50b1N0cmluZygpO1xuICAgICAgdGhpcy5pbml0Q2xvbmUoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogY2xvbmUgc2VsZiBhbmQgaGlkZSBpbiBvcGVuIHN0YXRlXG4gICAqIGZvciBtZWFzdXJpbmcgaGVpZ2h0XG4gICAqL1xuICBpbml0Q2xvbmUoKSB7XG4gICAgdGhpcy5jbG9uZSA9IG5ldyBBY2NvcmRpb25JdGVtKCk7XG4gICAgdGhpcy5jbG9uZS5pbm5lckhUTUwgPSB0aGlzLmlubmVySFRNTDtcbiAgICB0aGlzLmNsb25lLmNsYXNzTGlzdC5hZGQoXCJjbG9uZVwiKTtcbiAgICB0aGlzLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQodGhpcy5jbG9uZSk7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgIHRoaXMuc3R5bGUuc2V0UHJvcGVydHkoXG4gICAgICAgIFwiLS1oZWlnaHRcIixcbiAgICAgICAgdGhpcy5jbG9uZS5jb250ZW50Tm9kZS5vZmZzZXRIZWlnaHQudG9TdHJpbmcoKVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIG5vaW5zcGVjdGlvbiBKU1VudXNlZEdsb2JhbFN5bWJvbHNcbiAgLyoqXG4gICAqIEhhbmRsZSBhdHRyaWJ1dGUgY2hhbmdlXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvbGRWYWx1ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmV3VmFsdWVcbiAgICovXG4gIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICBpZiAoIXRoaXMuaXNDb25uZWN0ZWQgfHwgb2xkVmFsdWUgPT09IG5ld1ZhbHVlKSByZXR1cm47XG4gICAgaWYgKFwiZGF0YS1vcGVuXCIgPT09IG5hbWUpIHtcbiAgICAgIHRoaXMub3BlbiA9IG5ld1ZhbHVlID09PSBcInRydWVcIjtcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJjaGFuZ2VcIiwgeyBkZXRhaWw6IHRoaXMgfSkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiB0cmlnZ2VyIGhlaWdodCBjYWxjdWxhdGlvblxuICAgKi9cbiAgdXBkYXRlKCkge1xuICAgIGlmICh0aGlzLm9wZW4pIHtcbiAgICAgIHRoaXMuc3R5bGUuc2V0UHJvcGVydHkoXG4gICAgICAgIFwiLS1oZWlnaHRcIixcbiAgICAgICAgdGhpcy5jbG9uZS5jb250ZW50Tm9kZS5vZmZzZXRIZWlnaHQudG9TdHJpbmcoKVxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlIG9wZW4gc3RhdGVcbiAgICovXG4gIHRvZ2dsZSgpIHtcbiAgICB0aGlzLm9wZW4gPSAhdGhpcy5vcGVuO1xuICAgIHRoaXMudXBkYXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogT2J0YWluIG9wZW4gc3RhdGVcbiAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAqL1xuICBnZXQgb3BlbigpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhc2V0Lm9wZW4gPT09IFwidHJ1ZVwiO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBvcGVuIHN0YXRlXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gdlxuICAgKi9cbiAgc2V0IG9wZW4odikge1xuICAgIGlmICh0aGlzLm9wZW4gIT09ICEhdikge1xuICAgICAgdGhpcy5kYXRhc2V0Lm9wZW4gPSAoISF2KS50b1N0cmluZygpO1xuICAgIH1cbiAgfVxufVxuXG4vKiBzdXBwcmVzcyBjdXN0b20gcHJvcGVydGllcyBkZWZpbmVkIG91dHNpZGUgb2YgZWxlbWVudCwgc2xvdCBpcyBub3QgdmFsaWQsIGRlZmF1bHQgdmFsdWVzIGZvciBjdXN0b20gcHJvcGVydGllcyAqL1xuLy8gbm9pbnNwZWN0aW9uIENzc1VucmVzb2x2ZWRDdXN0b21Qcm9wZXJ0eSxDc3NJbnZhbGlkSHRtbFRhZ1JlZmVyZW5jZSxDc3NJbnZhbGlkRnVuY3Rpb25cbmNvbnN0IHRlbXBsYXRlID0gLyogaHRtbCAqLyBgXG48c3R5bGU+XG46aG9zdCB7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG59XG5kaXYubGFiZWwtc2xvdCB7XG4gICAgY3Vyc29yOiB2YXIoLS1jdXJzb3IsIHBvaW50ZXIpO1xufVxuOmhvc3QoOm5vdCguY2xvbmUpKSBkaXYuY29udGVudC1zbG90IHtcbiAgICBtYXgtaGVpZ2h0OiAwO1xufVxuZGl2LmNvbnRlbnQtc2xvdCxcbmRpdi5jb250ZW50LXNsb3Qgc2xvdDo6c2xvdHRlZCgqKSB7XG4gICAgdHJhbnNpdGlvbjogYWxsIHZhcigtLXRyYW5zaXRpb24tZHVyYXRpb24sIDI1MG1zKSB2YXIoLS10cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbiwgZWFzZS1pbi1vdXQpO1xufVxuOmhvc3QoOm5vdCguY2xvbmUpW2RhdGEtb3Blbj1cInRydWVcIl0pIGRpdi5jb250ZW50LXNsb3Qge1xuICAgIG1heC1oZWlnaHQ6IGNhbGModmFyKC0taGVpZ2h0KSAqIDFweCk7XG59XG46aG9zdCg6bm90KC5jbG9uZSk6bm90KFtkYXRhLW9wZW49XCJ0cnVlXCJdKSkgZGl2LmNvbnRlbnQtc2xvdCBzbG90OjpzbG90dGVkKCopIHtcbiAgICBtYXJnaW4tYmxvY2s6IDA7XG59XG46aG9zdCguY2xvbmUpIHtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgbGVmdDogLTIwMHZ3O1xuICAgIHdpZHRoOiAxMDAlO1xufVxuPC9zdHlsZT5cbjxkaXYgY2xhc3M9XCJsYWJlbC1zbG90XCI+PHNsb3QgbmFtZT1cImxhYmVsXCI+PC9zbG90PjwvZGl2PlxuPGRpdiBjbGFzcz1cImNvbnRlbnQtc2xvdFwiPjxzbG90Pjwvc2xvdD48L2Rpdj5cbmA7XG5cbkFic3RyYWN0Q29tcG9uZW50LmluaXRDb21wb25lbnQoXCJhY2NvcmRpb24taXRlbVwiLCBBY2NvcmRpb25JdGVtLCB0ZW1wbGF0ZSk7XG4iLCAiLy9AdHMtbm9jaGVja1xuaW1wb3J0IHsgQWJzdHJhY3RDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQWJzdHJhY3RDb21wb25lbnQuanNcIjtcbmltcG9ydCBcIi4vSXRlbS5qc1wiO1xuXG4vKipcbiBAcHJvcGVydHkge0hUTUxTbG90RWxlbWVudH0gaXRlbVNsb3RcbiAqL1xuY2xhc3MgQWNjb3JkaW9uIGV4dGVuZHMgQWJzdHJhY3RDb21wb25lbnQge1xuICAvKiogQGluaGVyaXRkb2MgKi9cbiAgZ2V0IGVsZW1lbnRzKCkge1xuICAgIHJldHVybiB7XG4gICAgICBpdGVtU2xvdDogXCJzbG90XCIsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplXG4gICAqL1xuICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICBzdXBlci5jb25uZWN0ZWRDYWxsYmFjaygpO1xuICAgIGNvbnN0IGV2dE9wdGlvbnMgPSB7XG4gICAgICBzaWduYWw6IHRoaXMuZGlzY29ubmVjdGVkU2lnbmFsLFxuICAgIH07XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgKCkgPT4gdGhpcy51cGRhdGVJdGVtTGlzdCgpLCBldnRPcHRpb25zKTtcbiAgICB0aGlzLml0ZW1TbG90LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICBcInNsb3RjaGFuZ2VcIixcbiAgICAgICgpID0+IHRoaXMudXBkYXRlSXRlbUxpc3QoMCksXG4gICAgICBldnRPcHRpb25zXG4gICAgKTtcbiAgICBpZiAoIXNjcmVlbi5vcmllbnRhdGlvbikge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIFwib3JpZW50YXRpb25jaGFuZ2VcIixcbiAgICAgICAgKCkgPT4gdGhpcy51cGRhdGVJdGVtTGlzdCgpLFxuICAgICAgICBldnRPcHRpb25zXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBzY3JlZW4ub3JpZW50YXRpb24uYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgXCJjaGFuZ2VcIixcbiAgICAgICAgKCkgPT4gdGhpcy51cGRhdGVJdGVtTGlzdCgpLFxuICAgICAgICBldnRPcHRpb25zXG4gICAgICApO1xuICAgIH1cbiAgICB0aGlzLml0ZW1DaGFuZ2VIYW5kbGVyID0gdGhpcy5oYW5kbGVJdGVtQ2hhbmdlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5pdGVtcy5mb3JFYWNoKChpKSA9PlxuICAgICAgaS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuaXRlbUNoYW5nZUhhbmRsZXIsIGV2dE9wdGlvbnMpXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgaXRlbSBvcGVuIHN0YXRlIGNoYW5nZVxuICAgKlxuICAgKiBAcGFyYW0ge0N1c3RvbUV2ZW50fSBlXG4gICAqIEBwYXJhbSB7QWNjb3JkaW9uSXRlbX0gZS5kZXRhaWxcbiAgICovXG4gIGhhbmRsZUl0ZW1DaGFuZ2UoZSkge1xuICAgIHRoaXMuaXRlbXMuZm9yRWFjaCgoaSkgPT5cbiAgICAgIGkucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLml0ZW1DaGFuZ2VIYW5kbGVyKVxuICAgICk7XG4gICAgaWYgKGUuZGV0YWlsLm9wZW4gJiYgIXRoaXMubXVsdGkpIHtcbiAgICAgIHRoaXMuaXRlbXNcbiAgICAgICAgPy5maWx0ZXIoKGkpID0+IGkgIT09IGUuZGV0YWlsKVxuICAgICAgICAuZm9yRWFjaCgoaSkgPT4gKGkub3BlbiA9IGZhbHNlKSk7XG4gICAgfVxuICAgIHRoaXMuaXRlbXMuZm9yRWFjaCgoaSkgPT5cbiAgICAgIGkuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLml0ZW1DaGFuZ2VIYW5kbGVyLCB7XG4gICAgICAgIHNpZ25hbDogdGhpcy5kaXNjb25uZWN0ZWRTaWduYWwsXG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGxpc3Qgb2YgaXRlbXNcbiAgICpcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGRlYm91bmNlXG4gICAqL1xuICB1cGRhdGVJdGVtTGlzdChkZWJvdW5jZSA9IG51bGwpIHtcbiAgICBjb25zdCB0aW1lb3V0ID0gZGVib3VuY2UgPz8gNTA7XG4gICAgaWYgKHRoaXMuZGVib3VuY2VUaW1lb3V0KSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5kZWJvdW5jZVRpbWVvdXQpO1xuICAgIH1cbiAgICB0aGlzLmRlYm91bmNlVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5pdGVtcy5mb3JFYWNoKChpKSA9PiBpLnVwZGF0ZSgpKTtcbiAgICB9LCB0aW1lb3V0KTtcbiAgfVxuXG4gIC8vIG5vaW5zcGVjdGlvbiBKU1VudXNlZEdsb2JhbFN5bWJvbHNcbiAgLyoqXG4gICAqIENsb3NlIGFsbCBpdGVtcywgbWF5YmUgdXNlZCBmb3IgYSBidXR0b24gdG8gY2xvc2UgYWxsIChtdWx0aSBvcGVuKVxuICAgKi9cbiAgY2xvc2VBbGwoKSB7XG4gICAgdGhpcy5pdGVtcy5mb3JFYWNoKChpKSA9PiAoaS5vcGVuID0gZmFsc2UpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBvYnRhaW4gaXRlbXNcbiAgICogQHJldHVybnMge0FjY29yZGlvbkl0ZW1bXX1cbiAgICovXG4gIGdldCBpdGVtcygpIHtcbiAgICAvKiBzdXBwcmVzcyB1bmtub3duIGVsZW1lbnQgYWNjb3JkaW9uLWl0ZW0gKi9cbiAgICAvLyBub2luc3BlY3Rpb24gSlNWYWxpZGF0ZVR5cGVzXG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5xdWVyeVNlbGVjdG9yQWxsKFwiYWNjb3JkaW9uLWl0ZW06bm90KC5jbG9uZSlcIikpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZSBpZiBhY2NvcmRpb24gY2FuIG9wZW4gbXVsdGlwbGUgdGFic1xuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICovXG4gIGdldCBtdWx0aSgpIHtcbiAgICByZXR1cm4gXCJ1bmRlZmluZWRcIiAhPT0gdHlwZW9mIHRoaXMuZGF0YXNldC5tdWx0aTtcbiAgfVxufVxuXG5jb25zdCB0ZW1wbGF0ZSA9IC8qIGh0bWwgKi8gYFxuPHN0eWxlPlxuOmhvc3Qge1xuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICBkaXNwbGF5OiBibG9jaztcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xufVxuPC9zdHlsZT5cbjxzbG90Pjwvc2xvdD5cbmA7XG5cbkFic3RyYWN0Q29tcG9uZW50LmluaXRDb21wb25lbnQoXCJhY2NvcmRpb24tYm94XCIsIEFjY29yZGlvbiwgdGVtcGxhdGUpO1xuIiwgImltcG9ydCB7IEFic3RyYWN0Q29tcG9uZW50IH0gZnJvbSBcIi4uL0Fic3RyYWN0Q29tcG9uZW50LmpzXCI7XG5cbmNsYXNzIFRvZG8gZXh0ZW5kcyBBYnN0cmFjdENvbXBvbmVudCB7XG4gIC8qKiBAaW5oZXJpdGRvYyAqL1xuICBnZXQgZWxlbWVudHMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJ1dHRvbjogXCJidXR0b25cIixcbiAgICAgIGlucHV0OiBcImlucHV0XCIsXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBAaW5oZXJpdGRvYyAqL1xuICBnZXQgbGlzdGVuZXJzKCkge1xuICAgIHJldHVybiB7XG4gICAgICBidXR0b246IHsgY2xpY2s6IHRoaXMuYWRkSGFuZGxlci5iaW5kKHRoaXMpIH0sXG4gICAgICBpbnB1dDogeyBrZXlkb3duOiB0aGlzLmFkZEhhbmRsZXIuYmluZCh0aGlzKSB9LFxuICAgIH07XG4gIH1cblxuICAvKiogQGluaGVyaXRkb2MgKi9cbiAgZ2V0IG11dGF0aW9ucygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcm9vdDogW3sgY2hpbGRMaXN0OiAobSwgbykgPT4gdGhpcy51cGRhdGVDb3VudGVyKG0sIG8pIH1dLFxuICAgIH07XG4gIH1cblxuICBnZXQgbXV0YXRpb25PYnNlcnZlck9wdGlvbnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBjb3VudGVyXG4gICAqL1xuICB1cGRhdGVDb3VudGVyKCkge1xuICAgIHRoaXMuc2hhZG93LnF1ZXJ5U2VsZWN0b3IoXCJoMyBzcGFuOmZpcnN0LW9mLXR5cGVcIikuaW5uZXJIVE1MID0gdGhpcy50b2Rvc1xuICAgICAgLmZpbHRlcigodCkgPT4gdC5kb25lKVxuICAgICAgLmxlbmd0aC50b1N0cmluZygpO1xuICAgIHRoaXMuc2hhZG93LnF1ZXJ5U2VsZWN0b3IoXCJoMyBzcGFuOmxhc3Qtb2YtdHlwZVwiKS5pbm5lckhUTUwgPVxuICAgICAgdGhpcy50b2Rvcy5sZW5ndGgudG9TdHJpbmcoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgYWRkIHRvZG9cbiAgICogQHBhcmFtIHtNb3VzZUV2ZW50fEtleWJvYXJkRXZlbnR9IGVcbiAgICovXG4gIGFkZEhhbmRsZXIoZSkge1xuICAgIGlmIChlLnR5cGUgPT09IFwia2V5ZG93blwiICYmIGUuY29kZSAhPT0gXCJFbnRlclwiKSByZXR1cm47XG4gICAgaWYgKHRoaXMuaW5wdXQudmFsaWRpdHkudmFsaWQpIHtcbiAgICAgIHRoaXMuYWRkVG9kbyh0aGlzLmlucHV0LnZhbHVlKTtcbiAgICAgIHRoaXMuaW5wdXQudmFsdWUgPSBcIlwiO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgdG9kb1xuICAgKiBAcGFyYW0ge1N0cmluZ30gbGFiZWxcbiAgICovXG4gIGFkZFRvZG8obGFiZWwpIHtcbiAgICBjb25zdCBpdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRvZG8taXRlbVwiKTtcbiAgICBpdGVtLmRhdGFzZXQubGFiZWwgPSBsYWJlbDtcbiAgICB0aGlzLmFwcGVuZENoaWxkKGl0ZW0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiB0b2Rvc1xuICAgKiBAcmV0dXJucyB7QXJyYXkuPE9iamVjdC48U3RyaW5nOiBsYWJlbCwgQm9vbGVhbjogZG9uZT4+fVxuICAgKi9cbiAgZ2V0IHRvZG9zKCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMucXVlcnlTZWxlY3RvckFsbChcInRvZG8taXRlbVwiKSkubWFwKChpKSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYWJlbDogaS5sYWJlbCxcbiAgICAgICAgZG9uZTogaS5jaGVja2VkLFxuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdG9kb3NcbiAgICogQHBhcmFtIHtBcnJheS48U3RyaW5nPn0gdlxuICAgKi9cbiAgc2V0IHRvZG9zKHYpIHtcbiAgICB0aGlzLnF1ZXJ5U2VsZWN0b3JBbGwoXCJ0b2RvLWl0ZW1cIikuZm9yRWFjaCgoaSkgPT4gaS5kZWxldGUoKSk7XG4gICAgdi5mb3JFYWNoKChpKSA9PiB0aGlzLmFkZFRvZG8odikpO1xuICB9XG59XG5cblRvZG8ucHJvdG90eXBlLnRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRlbXBsYXRlXCIpO1xuVG9kby5wcm90b3R5cGUudGVtcGxhdGUuaW5uZXJIVE1MID0gLypodG1sKi8gYFxuPHN0eWxlPlxuLmFkZCB7XG4gIHBhZGRpbmc6IHZhcigtLWxpc3QtaXRlbS1wYWRkaW5nKTtcbiAgZGlzcGxheTogZmxleDtcbiAgZ2FwOiB2YXIoLS1pdGVtLXBhZGRpbmctaW5saW5lKTtcbn1cbjwvc3R5bGU+XG48aDI+PHNsb3QgbmFtZT1cImhlYWRlclwiPllvdSBzaG91bGQgc2V0IGEgaGVhZGVyPC9zbG90PjwvaDI+XG48aDM+RG9uZTogPHNwYW4+PC9zcGFuPiAvIDxzcGFuPjwvc3Bhbj48L2gzPlxuPHNlY3Rpb24gY2xhc3M9XCJhZGRcIj5cbiAgPGlucHV0IHBsYWNlaG9sZGVyPVwiVG9kb1wiIHJlcXVpcmVkIG1pbj1cIjNcIj48YnV0dG9uPkFkZDwvYnV0dG9uPlxuPC9zZWN0aW9uPlxuPHNlY3Rpb24gY2xhc3M9XCJpdGVtc1wiPlxuICAgIDxzbG90Pjwvc2xvdD5cbjwvc2VjdGlvbj5cbmA7XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZShcInRvZG8tbGlzdFwiLCBUb2RvKTtcbiIsICJpbXBvcnQgeyBBYnN0cmFjdENvbXBvbmVudCB9IGZyb20gXCIuLi9BYnN0cmFjdENvbXBvbmVudC5qc1wiO1xuXG5jbGFzcyBJdGVtIGV4dGVuZHMgQWJzdHJhY3RDb21wb25lbnQge1xuICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICByZXR1cm4gW1wiZGF0YS1kb25lXCJdO1xuICB9XG5cbiAgLyoqIEBpbmhlcml0ZG9jICovXG4gIGdldCBlbGVtZW50cygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnV0dG9uOiBcImJ1dHRvblwiLFxuICAgICAgaW5wdXQ6IFwiaW5wdXRcIixcbiAgICB9O1xuICB9XG5cbiAgLyoqIEBpbmhlcml0ZG9jICovXG4gIGdldCBsaXN0ZW5lcnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJ1dHRvbjogeyBjbGljazogdGhpcy5kZWxldGVIYW5kbGVyLmJpbmQodGhpcykgfSxcbiAgICAgIGlucHV0OiB7IGNoYW5nZTogdGhpcy51cGRhdGVIYW5kbGVyLmJpbmQodGhpcykgfSxcbiAgICB9O1xuICB9XG5cbiAgLyoqIEBpbmhlcml0ZG9jICovXG4gIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7XG4gICAgdGhpcy5sYWJlbCA9IHRoaXMuZGF0YXNldC5sYWJlbDtcbiAgICB0aGlzLmNoZWNrZWQgPSB0aGlzLmRhdGFzZXQuZG9uZSA9PT0gXCJ0cnVlXCI7XG4gICAgdGhpcy5wYXJlbnROb2RlLnVwZGF0ZUNvdW50ZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgYXR0cmlidXRlIGNoYW5nZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb2xkVmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG5ld1ZhbHVlXG4gICAqL1xuICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgaWYgKCF0aGlzLmlucHV0IHx8IG9sZFZhbHVlID09PSBuZXdWYWx1ZSkgcmV0dXJuO1xuICAgIGlmIChcImRhdGEtZG9uZVwiID09PSBuYW1lKSB7XG4gICAgICB0aGlzLmNoZWNrZWQgPSBuZXdWYWx1ZSA9PT0gXCJ0cnVlXCI7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZVxuICAgKi9cbiAgdXBkYXRlSGFuZGxlcigpIHtcbiAgICB0aGlzLmRhdGFzZXQuZG9uZSA9IHRoaXMuY2hlY2tlZC50b1N0cmluZygpO1xuICAgIHRoaXMudG9nZ2xlTGluZVRocm91Z2goKTtcbiAgICB0aGlzLnBhcmVudE5vZGUudXBkYXRlQ291bnRlcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZVxuICAgKi9cbiAgZGVsZXRlSGFuZGxlcigpIHtcbiAgICB0aGlzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcyk7XG4gIH1cblxuICB0b2dnbGVMaW5lVGhyb3VnaCgpIHtcbiAgICB0aGlzLmlucHV0LnBhcmVudE5vZGUuY2xhc3NMaXN0LnRvZ2dsZShcImRvbmVcIiwgdGhpcy5jaGVja2VkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gY2hla2VkIHN0YXRlXG4gICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgKi9cbiAgZ2V0IGNoZWNrZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5wdXQuY2hlY2tlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgY2hlY2tlZCBzdGF0ZVxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IHZcbiAgICovXG4gIHNldCBjaGVja2VkKHYpIHtcbiAgICBpZiAodGhpcy5jaGVja2VkICE9PSAhIXYpIHtcbiAgICAgIHRoaXMuaW5wdXQuY2hlY2tlZCA9ICEhdjtcbiAgICAgIHRoaXMudG9nZ2xlTGluZVRocm91Z2goKTtcbiAgICAgIHRoaXMuaW5wdXQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJjaGFuZ2VcIikpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gbGFiZWxcbiAgICogQHJldHVybnMge1N0cmluZ31cbiAgICovXG4gIGdldCBsYWJlbCgpIHtcbiAgICByZXR1cm4gdGhpcy5zaGFkb3cucXVlcnlTZWxlY3RvcihcImxhYmVsIHNwYW5cIikuaW5uZXJIVE1MO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBsYWJlbFxuICAgKiBAcGFyYW0ge1N0cmluZ30gdlxuICAgKi9cbiAgc2V0IGxhYmVsKHYpIHtcbiAgICB0aGlzLnNoYWRvdy5xdWVyeVNlbGVjdG9yKFwibGFiZWwgc3BhblwiKS5pbm5lckhUTUwgPSB2O1xuICB9XG59XG5cbkl0ZW0ucHJvdG90eXBlLnRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRlbXBsYXRlXCIpO1xuSXRlbS5wcm90b3R5cGUudGVtcGxhdGUuaW5uZXJIVE1MID0gLyogaHRtbCAqLyBgXG48c3R5bGU+XG46aG9zdCB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgYmFja2dyb3VuZDogdmFyKC0tY2xyLWJnLWxpc3QtaXRlbSk7XG4gIHBhZGRpbmc6IHZhcigtLWxpc3QtaXRlbS1wYWRkaW5nKTtcbn1cbjpob3N0KDpob3Zlcikge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jbHItYmctbGlzdC1pdGVtLWhvdmVyKTtcbn1cbmxhYmVsLmRvbmUgc3BhbiB7XG4gIHRleHQtZGVjb3JhdGlvbjogbGluZS10aHJvdWdoO1xufVxuPC9zdHlsZT5cbjxsYWJlbD5cbiAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCI+XG4gICAgPHNwYW4+PC9zcGFuPlxuPC9sYWJlbD5cbjxidXR0b24+RGVsZXRlPC9idXR0b24+XG5gO1xuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJ0b2RvLWl0ZW1cIiwgSXRlbSk7XG4iLCAiaW1wb3J0IHsgQWJzdHJhY3RDb21wb25lbnQgfSBmcm9tIFwiLi9BYnN0cmFjdENvbXBvbmVudC5qc1wiO1xuY2xhc3MgTXlDb21wb25lbnQgZXh0ZW5kcyBBYnN0cmFjdENvbXBvbmVudCB7XG4gIGdldCBlbGVtZW50cygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbXk6IFwiLm15RWxlbWVudFwiLFxuICAgICAgYnV0dG9uOiBcIi5idXR0b25cIixcbiAgICB9O1xuICB9XG4gIGdldCBsaXN0ZW5lcnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIFwiLmJ1dHRvblwiOiB7XG4gICAgICAgIGNsaWNrOiAoZSkgPT5cbiAgICAgICAgICB0aGlzLm15LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiIGFyZSBhd2Vzb21lISFcIikpLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG4gIGdldCBtdXRhdGlvbnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG15OiBbXG4gICAgICAgIHsgY2hpbGRMaXN0OiAobSwgbykgPT4gY29uc29sZS5sb2cobSkgfSxcbiAgICAgICAgeyBjaGlsZExpc3Q6IChtLCBvKSA9PiBjb25zb2xlLmxvZyhvKSB9LFxuICAgICAgICB7IGNoaWxkTGlzdDogXCJUaGlzIHJhaXNlcyBhbiBlcnJvclwiIH0sXG4gICAgICBdLFxuICAgICAgYnV0dG9uOiBbeyBjaGlsZExpc3Q6IChtLCBvKSA9PiBjb25zb2xlLmxvZyhtLCBvKSB9XSxcbiAgICB9O1xuICB9XG4gIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7XG4gICAgY29uc29sZS5sb2codGhpcy5teSk7XG4gIH1cbn1cbk15Q29tcG9uZW50LnByb3RvdHlwZS50ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZW1wbGF0ZVwiKTtcbk15Q29tcG9uZW50LnByb3RvdHlwZS50ZW1wbGF0ZS5pbm5lckhUTUwgPSAvKiBodG1sICovIGBcbjxidXR0b24gY2xhc3M9XCJidXR0b25cIj5DbGljayE8L2J1dHRvbj5cbjxkaXYgY2xhc3M9XCJteUVsZW1lbnRcIj5cbiAgICBXZWIgQ29tcG9uZW50c1xuPC9kaXY+XG5gO1xuY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwibXktY29tcG9uZW50XCIsIE15Q29tcG9uZW50KTtcbiIsICJjbGFzcyBMYWxhIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICByZXR1cm4gW1wiZGF0YS10ZXN0XCJdO1xuICB9XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnNoYWRvdyA9IHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogXCJjbG9zZWRcIiB9KTtcbiAgICB0aGlzLnNoYWRvdy5hcHBlbmRDaGlsZCh0aGlzLnRlbXBsYXRlLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpKTtcbiAgICB0aGlzLl9ibGEgPSBudWxsO1xuICB9XG5cbiAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgY29uc29sZS5sb2coXCJhbGl2ZVwiKTtcbiAgfVxuXG4gIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIGNvbnNvbGUubG9nKFwiZGllZFwiKTtcbiAgfVxuXG4gIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgIGNhc2UgXCJkYXRhLXRlc3RcIjpcbiAgICAgICAgY29uc29sZS5sb2coYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnZXQgYmxhKCkge1xuICAgIHJldHVybiB0aGlzLl9ibGE7XG4gIH1cblxuICBzZXQgYmxhKHYpIHtcbiAgICB0aGlzLl9ibGEgPSB2O1xuICAgIHRoaXMuc2hhZG93LnF1ZXJ5U2VsZWN0b3IoXCJzcGFuXCIpLmlubmVyVGV4dCA9IHRoaXMuX2JsYTtcbiAgfVxufVxuXG5MYWxhLnByb3RvdHlwZS50ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZW1wbGF0ZVwiKTtcbkxhbGEucHJvdG90eXBlLnRlbXBsYXRlLmlubmVySFRNTCA9IC8qaHRtbCovIGBcbjxzdHlsZT5cbjpob3N0IHtcbiAgZGlzcGxheTogYmxvY2s7XG4gIGJhY2tncm91bmQ6IHJlZDtcbiAgLS1sYWxhLWNvbG9yOiBjeWFuO1xufVxuOmhvc3QgZGl2IHtcbiAgY29sb3I6IHdoaXRlO1xufVxuOmhvc3QoLnppcHApIGRpdiB7XG4gIGNvbG9yOiB2YXIoLS1sYWxhLWNvbG9yKTtcbn1cbjwvc3R5bGU+XG48ZGl2PlxuPHNwYW4+PC9zcGFuPlxuPHNsb3Q+PC9zbG90PlxuPC9kaXY+XG5gO1xuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJsYWxhLXRlc3RcIiwgTGFsYSk7XG4iLCAiZXhwb3J0IGNsYXNzIFJvdXRlciB7XG4gICNfcm91dGVzID0gW107XG4gICNfaW5pdGlhbCA9IFwiL1wiO1xuICAjX2N1cnJlbnQgPSBcIi9cIjtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmN1cnJlbnQgPSBsb2NhdGlvbi5wYXRobmFtZTtcbiAgICB0aGlzLmluaXRpYWwgPSB0aGlzLmN1cnJlbnQ7XG4gICAgdGhpcy5hYm9ydENvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgdGhpcy5hYm9ydFNpZ25hbCA9IHRoaXMuYWJvcnRDb250cm9sbGVyLnNpZ25hbDtcbiAgICBhZGRFdmVudExpc3RlbmVyKFwicG9wc3RhdGVcIiwgKGUpID0+IHRoaXMuaGFuZGxlSGlzdG9yeVBvcChlKSk7XG4gIH1cblxuICAvKipcbiAgICogRGVmaW5lIHJvdXRlc1xuICAgKiBAcGFyYW0ge1N0cmluZ30gcm91dGVcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAgICovXG4gIHJvdXRlKHJvdXRlID0gXCIvXCIsIGNiID0gKCkgPT4ge30pIHtcbiAgICB0aGlzLnJvdXRlcy5wdXNoKHsgcm91dGUsIGNiIH0pO1xuICAgIHRoaXMuYWRkTGlzdGVuZXIocm91dGUsIGNiKTtcbiAgfVxuXG4gIGFkZExpc3RlbmVyKHJvdXRlLCBjYikge1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYFtocmVmPVwiLyR7cm91dGV9XCJdYCkuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICBcImNsaWNrXCIsXG4gICAgICAgIChlKSA9PiB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHRoaXMucHVzaChyb3V0ZSk7XG4gICAgICAgICAgY2IoKTtcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHNpZ25hbDogdGhpcy5hYm9ydFNpZ25hbCxcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFkZExpc3RlbmVycygpIHtcbiAgICB0aGlzLnJvdXRlcy5mb3JFYWNoKChpKSA9PiB0aGlzLmFkZExpc3RlbmVyKGkucm91dGUsIGkuY2IpKTtcbiAgfVxuXG4gIHB1c2gocm91dGUpIHtcbiAgICBoaXN0b3J5LnB1c2hTdGF0ZShyb3V0ZSwgXCJcIiwgcm91dGUpO1xuICB9XG5cbiAgaGFuZGxlSGlzdG9yeVBvcChlKSB7XG4gICAgdGhpcy5hYm9ydENvbnRyb2xsZXIuYWJvcnQoKTtcbiAgICBpZiAobG9jYXRpb24ucGF0aG5hbWUgPT09IHRoaXMuaW5pdGlhbCkge1xuICAgICAgLy8gV2UgcmVsb2FkIHRoZSBwYWdlIHNpbmNlIHdlIGNhbm5vdCBrbm93IGhvdyB0byByZWNyZWF0ZSB0aGlzIHZpZXdcbiAgICAgIGxvY2F0aW9uLnJlbG9hZCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBydW4gdGhlIGFzc2lvY2lhdGVkIGNhbGxiYWNrIG90aGVyd2lzZVxuICAgICAgdGhpcy5yb3V0ZXMuZmluZCgocikgPT4gZS5zdGF0ZSA9PT0gci5yb3V0ZSk/LmNiPy4oKTtcbiAgICB9XG4gIH1cblxuICBnZXQgaW5pdGlhbCgpIHtcbiAgICByZXR1cm4gdGhpcy4jX2luaXRpYWw7XG4gIH1cbiAgc2V0IGluaXRpYWwodikge1xuICAgIHRoaXMuI19pbml0aWFsID0gdjtcbiAgfVxuXG4gIGdldCByb3V0ZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuI19yb3V0ZXM7XG4gIH1cbiAgc2V0IHJvdXRlcyh2KSB7XG4gICAgdGhpcy4jX3JvdXRlcyA9IHY7XG4gIH1cblxuICBnZXQgY3VycmVudCgpIHtcbiAgICByZXR1cm4gdGhpcy4jX2N1cnJlbnQ7XG4gIH1cbiAgc2V0IGN1cnJlbnQodikge1xuICAgIHRoaXMuI19jdXJyZW50ID0gdjtcbiAgfVxufVxuIiwgImltcG9ydCBcIi4vQ29tcG9uZW50cy9DYXRlZ29yeS9pbmRleC5qc1wiO1xuXG5jb25zdCBjbGVhckJvZHkgPSAoKSA9PiB7XG4gIGRvY3VtZW50LmJvZHlcbiAgICAucXVlcnlTZWxlY3RvckFsbChcIjpzY29wZSA+ICpcIilcbiAgICAuZm9yRWFjaCgobikgPT4gZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChuKSk7XG59O1xuXG5leHBvcnQgY29uc3QgaW5pdCA9IChyb3V0ZXIpID0+IHtcbiAgcm91dGVyLnJvdXRlKFwicm91dGVyLXRlc3RcIiwgKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKFwiUm91dGVkIHRvIHJvdXRlci10ZXN0XCIpO1xuICAgIGNsZWFyQm9keSgpO1xuICAgIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2F0ZWdvcnktbGlzdFwiKTtcbiAgICBub2RlLmRhdGFzZXQucHdhID0gXCJ0cnVlXCI7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChub2RlKTtcbiAgfSk7XG59O1xuIiwgImltcG9ydCBcIi4vQ29tcG9uZW50cy9idWlsZC5qc1wiO1xuaW1wb3J0IHsgUm91dGVyIH0gZnJvbSBcIi4vUm91dGVyLmpzXCI7XG5pbXBvcnQgeyBpbml0IGFzIGluaXRSb3V0ZXMgfSBmcm9tIFwiLi9yb3V0ZXMuanNcIjtcblxuY29uc3Qgcm91dGVyID0gbmV3IFJvdXRlcigpO1xuaW5pdFJvdXRlcyhyb3V0ZXIpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7O0FBQUEsTUFBTSw0QkFBNEI7QUFBQSxJQUNoQyxTQUFTO0FBQUEsSUFDVCxZQUFZO0FBQUEsSUFDWixXQUFXO0FBQUEsSUFDWCxlQUFlO0FBQUEsSUFDZix1QkFBdUI7QUFBQSxFQUN6QjtBQUVPLE1BQU0sb0JBQU4sY0FBZ0MsWUFBWTtBQUFBLElBQ2pELGNBQWM7QUFDWixZQUFNO0FBQ04sV0FBSyxTQUFTLEtBQUssYUFBYSxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQ2xELFdBQUssT0FBTyxZQUFZLEtBQUssU0FBUyxRQUFRLFVBQVUsSUFBSSxDQUFDO0FBQzdELFdBQUssYUFBYTtBQUFBLElBQ3BCO0FBQUEsSUFLQSxvQkFBb0I7QUFDbEIsV0FBSyx1QkFBdUIsSUFBSSxnQkFBZ0I7QUFDaEQsV0FBSyxxQkFBcUIsS0FBSyxxQkFBcUI7QUFDcEQsV0FBSyxhQUFhO0FBQUEsSUFDcEI7QUFBQSxJQU1BLHVCQUF1QjtBQUNyQixXQUFLLHFCQUFxQixNQUFNO0FBQ2hDLFdBQUssZ0JBQWdCO0FBQUEsSUFDdkI7QUFBQSxJQU1BLGVBQWU7QUFDYixpQkFBVyxZQUFZLE9BQU8sS0FBSyxLQUFLLFFBQVEsR0FBRztBQUNqRCxjQUFNLFFBQVEsTUFB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
