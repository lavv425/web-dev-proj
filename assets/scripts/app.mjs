import Router from "./modules/router/router.mjs";

const routes = {
    "/": "pages/index.html",
    "/about": "pages/about.html",
    "/contact": "pages/contact-me.html",
};

const router = new Router(routes, {
    selector: "#app",
    isPathRelative: true,
    basePath: "/web-dev-proj",
});