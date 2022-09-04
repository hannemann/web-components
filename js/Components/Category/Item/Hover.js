import { AbstractComponent } from "../../Abstract.js";

class Hover extends AbstractComponent {
  get elements() {
    return {
      brandNode: "h4",
      titleNode: "h3",
      descriptionNode: "p",
      priceNode: "span",
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
}

const template = /* html */ `
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
<span></span>
<div class="buttons">
    <button>Details</button>
    <button class="cta">Cart</button>
</div>
`;

AbstractComponent.initComponent("category-item-hover", Hover, template);
