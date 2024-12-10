const PREFIX_BASE_PATH = "/web-dev-proj";
const BASE_URL = `http://localhost${PREFIX_BASE_PATH}`;
export const REGISTER_VIEW_ENDPOINT = `${BASE_URL}/backend/api/registerView/registerView.php`;
export const CONTACT_ME_ENDPOINT = `${BASE_URL}/backend/api/contactMe/contactMe.php`;

export const ROUTER_CONFIG = {
    routes: {
        "/": "pages/index.html",
        "/about": "pages/about.html",
        "/resume": "pages/resume.html",
        "/contact-me": "pages/contact-me.html",
    },
    config: {
        selector: "#app",
        isPathRelative: true,
        basePath: PREFIX_BASE_PATH,
        cachePages: false
    }
};

export const EMAIL_VALIDATION_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;