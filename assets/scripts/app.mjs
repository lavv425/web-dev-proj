import Router from "./modules/Router/Router.mjs";

const routes = {
    "/": "pages/index.html",
    "/about": "pages/about.html",
    "/resume": "pages/resume.html",
    "/contact": "pages/contact-me.html",
};


const config = {
    selector: "#app",
    isPathRelative: true,
    basePath: "/web-dev-proj",
    cachePages: false
};

const routerInstance = new Router(routes, config);

export default routerInstance;