try {
  const routerImport = await import("./Router.js");
  const router = new routerImport.Router();
  const routes = await import("./routes.js");
  routes.init(router);
} catch (error) {}
