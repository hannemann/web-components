import { AbstractComponent } from "../Abstract.js";

const ITEMS_COUNT = 24;
const ITEMS_URL = "https://dummyjson.com/products";

class List extends AbstractComponent {
  get elements() {
    return {
      items: ".items",
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

  /**
   * Append items and assign to slot
   * @param {Array.<HTMLElement>} nodes
   */
  render(nodes) {
    console.groupCollapsed("Render tiles");
    console.time("render");
    const slot = this.shadow.querySelector("slot");
    nodes.forEach((p) => {
      this.appendChild(p);
      slot.assign(p);
    });
    console.log(`${ITEMS_COUNT} product tiles rendered`);
    console.timeEnd("render");
    console.groupEnd();
  }

  /**
   * Obtain category-item's from slot
   */
  get products() {
    return this.items.querySelector("slot").assignedElements();
  }
}

const template = /* html */ `
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
