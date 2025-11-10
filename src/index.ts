import { getProfile, minecraftAuth, UserInfo } from "./auth";
import { epoxyFetch, initWisp } from "./connection/epoxy";
import { makeFakeWebSocket } from "./connection/fakewebsocket";

//@ts-expect-error this gets filled in by rollup
export const VERSION = self.VERSION;
//@ts-expect-error this too
export const COMMITHASH = self.COMMITHASH;

export let wispUrl: string;

export type AuthStore = {
	user: UserInfo | null;
	yggToken: string;
	msToken: string;
};

export type TokenStore = {
	username: string;
	token: string;
	ms: string;
};

export let authstore: AuthStore = {
	user: null,
	yggToken: "",
	msToken: "",
};

const nativeFetch = fetch;

export function setWispUrl(wisp: string) {
	const wispUrlUrl = new URL(wisp);
	if (!wispUrlUrl.pathname.endsWith("/")) {
		wispUrlUrl.pathname += "/";
	}
	wispUrl = wispUrlUrl.href;
}

wispUrl =
	((window as any).anura && (window as any).anura.wsproxyURL) ||
	new URL(window.location.href).searchParams.get("wisp") ||
	localStorage["wispcraft_wispurl"] ||
	"wss://anura.pro/";

try {
	setWispUrl(wispUrl);
} catch (e) {
	console.error(e);
}

if (localStorage["wispcraft_accounts"]) {
	const accounts = JSON.parse(
		localStorage["wispcraft_accounts"]
	) as TokenStore[];
	const account = accounts.find(
		(account) =>
			account.username === localStorage["wispcraft_last_used_account"]
	);
	if (account) {
		(async () => {
			try {
				authstore.msToken = account.ms;
				authstore.yggToken = account.token;
				authstore.user = await getProfile(authstore.yggToken);
			} catch (e) {
				authstore.yggToken = await minecraftAuth(authstore.msToken);
				authstore.user = await getProfile(authstore.yggToken);
			}
		})();
	}
}

// replace websocket with our own
window.WebSocket = makeFakeWebSocket();

// eagler will fetch texture packs, will fail if cors isn't set
// should really fix this but whatever
window.fetch = async function (url: RequestInfo | URL, init?: RequestInit) {
	try {
		return await nativeFetch(url, init);
	} catch (e) {
		return await epoxyFetch("" + url, init);
	}
};

type EaglerXOptions = any;
let eagoptions: EaglerXOptions;
// append settings to the server list
const settings = { addr: "settings://", name: "Wispcraft Settings" };
let relayId = Math.floor(Math.random() * 3);
Object.defineProperty(window, "eaglercraftXOpts", {
	get() {
		if (eagoptions) {
			return eagoptions;
		}
		return {
			container: "game_frame",
			worldsDB: "worlds",
			relays: [
				{
					addr: "wss://relay.deev.is/",
					comment: "lax1dude relay #1",
					primary: relayId == 0,
				},
				{
					addr: "wss://relay.lax1dude.net/",
					comment: "lax1dude relay #2",
					primary: relayId == 1,
				},
				{
					addr: "wss://relay.shhnowisnottheti.me/",
					comment: "ayunami relay #1",
					primary: relayId == 2,
				},
			],
		};
	},
	set(v) {
		eagoptions = v;
		if (eagoptions?.servers) {
			eagoptions.servers.unshift(settings);
		} else {
			eagoptions.servers = [settings];
		}
	},
});

initWisp(wispUrl);

if (window["anura"]) {
	document.addEventListener("click", function () {
		setTimeout(function () {
			(window.frameElement as HTMLIFrameElement)?.focus();
			window.focus();
		}, 5);
	});
	(window.frameElement as HTMLIFrameElement)?.focus();
}
