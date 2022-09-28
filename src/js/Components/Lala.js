class Lala extends HTMLElement {
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
}

Lala.prototype.template = document.createElement("template");
Lala.prototype.template.innerHTML = /*html*/ `
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
