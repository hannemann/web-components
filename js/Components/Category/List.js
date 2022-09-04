import { AbstractComponent } from "../Abstract.js";

const ITEMS_COUNT = 24;

class List extends AbstractComponent {
  get elements() {
    return {
      items: ".items",
    };
  }
  async connectedCallback() {
    super.connectedCallback();
    try {
      console.log("Start load timer.");
      console.time("load");
      await this.load();
      console.log("Data ready.");
      console.timeLog("load");
      console.log("Start remder timer.");
      console.time("render");
      this.render();
      console.timeLog("render");
    } catch (error) {
      console.error(error);
    }
  }

  async load() {
    const response = await fetch("https://jsonplaceholder.typicode.com/photos");
    const result = await response.json();
    console.log("Data loaded.");
    console.timeLog("load");
    this.products = result?.slice(0, ITEMS_COUNT).map((p) => {
      p.price = (Math.random() * 100).toFixed(2);
      p.name = p.title.split(" ").shift();
      return p;
    });
    console.log("Data decorated.");
    console.timeLog("load");
  }

  render() {
    this.products.forEach((p) => this.addItem(p));
  }

  addItem(product) {
    const node = document.createElement("category-item");
    node.productData = product;
    this.items.appendChild(node);
  }
}

const template = /* html */ `
<link rel="stylesheet" href="/css/components/Category/List.css">
<h2>Category</h2>
<div class="items"></div>
`;

AbstractComponent.initComponent("category-list", List, template);
