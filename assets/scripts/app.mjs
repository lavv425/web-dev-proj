import Router from "./modules/Router/Router.mjs";
import { REGISTER_VIEW_ENDPOINT, ROUTER_CONFIG } from "./constants/constants.mjs";
import Typer from "./modules/Typer/Typer.mjs";
import { hideLoader } from "./utils/loaderUtils.mjs";

export const T = new Typer();
// sendBeacon (where available) cause its non-blocking
try {
    if ("sendBeacon" in navigator && navigator.sendBeacon) {
        navigator.sendBeacon(T.isType("s", REGISTER_VIEW_ENDPOINT));
    } else {
        fetch(T.isType("s", REGISTER_VIEW_ENDPOINT), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
        })
    }


} catch (error) {
    // fails quietly, doesn't need to throw or signal the user
}
const routerInstance = new Router(T.isType("o", ROUTER_CONFIG.routes), T.isType("o", ROUTER_CONFIG.config));
hideLoader();

export default routerInstance;