import { deviceCodeAuth, getProfile, minecraftAuth } from "./auth";
import { reconnect, set_wisp_server } from "./connection/epoxy";
import { authstore, TokenStore } from ".";
import encodeQR from "qr";

let keydownListeners: Array<EventListenerOrEventListenerObject> = [];
const nativeAddEventListener = window.addEventListener;
window.addEventListener = (
	type: string,
	listener: EventListenerOrEventListenerObject
) => {
	if (type == "keydown") {
		keydownListeners.push(listener);
	}
	nativeAddEventListener(type, listener);
};
export function createUI() {
	const ui = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,100..900&family=Rajdhani:wght@700&display=swap');

            .backdrop-blur {
                display: block;
                width: 100vw;
                height: 100vh;
                position: fixed;
                z-index: 10;
                top: 0;
                left: 0;
                background-color: rgba(0, 0, 0, 0.5);
            }

            .settings-ui {
                width: 80vw;
                height: 80vh;
                position: fixed;
                z-index: 20;
                background-color: #020817;
                border-radius: 1rem;
                border: 1px solid #1E293B;
                color: #F8FAFC;
                font-family: "Inter";
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                flex-direction: column;
            }

            .settings-ui * {
                margin: 0;
                padding: 0;
            }

            .header {
                padding: 1rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .header .side {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .header #close {
                cursor: pointer;
            }

            .header h1 {
                font-family: "Rajdhani";
            }

            .header img {
                height: 3rem;
                width: 3rem;
                border-radius: 0.5rem;
            }

            .settings-ui .tabs {
                padding: 0rem 1rem;
                display: flex;
                align-items: start;
                gap: 2rem;
                border-bottom: 1px solid #1E293B;
            }

            .settings-ui span {
                cursor: pointer;
                padding-bottom: 8px;
                color: #94A3B8;
                transition: color 0.2s;
            }

            .settings-ui span.selected {
                border-bottom: 2px solid #3C82F6;
                color: #F8FAFC;
            }

            .content {
                display: flex;
                flex-direction: column;
                flex: 1;
                overflow-y: auto;
                padding: 1.5rem;
                gap: 1.5rem;
            }

            .settings-ui .setting {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }

            .hidden {
                display: none !important;
            }

            .settings-ui .input {
                background-color: #000000;
                color: #F8FAFC;
                border: 1px solid #1E293B;
                border-radius: 6px;
                padding: 10px 12px;
                font-size: 14px;
                transition: border-color 0.2s;
            }

            .settings-ui .input:focus {
                outline: none;
                border-color: #619bff;
            }

            .settings-ui .select {
                background-color: #000000;
                color: #F8FAFC;
                border: 1px solid #1E293B;
                border-radius: 6px;
                padding: 10px 32px 10px 12px;
                font-size: 14px;
                cursor: pointer;
                appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 12px center;
            }

            .settings-ui .button {
                background-color: #3C82F6;
                color: #FFFFFF;
                border: none;
                border-radius: 6px;
                padding: 10px 16px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: opacity 0.2s;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            .settings-ui .button:hover:not(:disabled) {
                opacity: 0.9;
            }

            .settings-ui .button:disabled {
                background-color: #1E293B;
                color: #64748B;
                cursor: not-allowed;
            }

            #account_status {
                font-size: 14px;
                color: #94A3B8;
                line-height: 1.5;
            }

            #account_status svg {
                background-color: white;
                padding: 8px;
                border-radius: 8px;
                margin: 10px 0;
            }

            .link {
                color: #3C82F6;
                text-decoration: none;
            }

            .link:hover {
                text-decoration: underline;
            }
            
            .list {
              padding-left: 1.5rem;
              color: #94A3B8;
            }

            .list li {
                margin-bottom: 0.5rem;
            }
            svg {
          	  max-width: 10%
            }
            .exit {
            	max-width: 100%
            }
        </style>

        <div class="backdrop-blur hidden" id="backdrop_blur"></div>

        <div class="settings-ui hidden" id="settings_ui">
            <div class="header">
                <div class="side">
                    <img src="https://avatars.githubusercontent.com/u/116328501">
                    <h1>Wispcraft Configuration</h1>
                </div>
                <div class="side" style="padding-right:1rem;color:#94A3B8;">
                    <svg id="close" class="exit" onclick="document.querySelector('.settings-ui').classList.add('hidden');document.querySelector('.backdrop-blur').classList.add('hidden');" xmlns="http://www.w3.org/2000/svg" width="24" height="24" stroke="currentColor" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </div>
            </div>

            <div class="tabs">
                <span class="selected" id="settings_tab">Settings</span>
                <span id="about_tab">About</span>
            </div>

            <div class="content" id="settings">
                <div class="setting">
                    <p style="font-weight: 500; font-size: 14px;">Wisp Server</p>
                    <input class="input" id="wisp_url" placeholder="wss://anura.pro/" />
                    <p id="save_status" style="font-size: 12px; height: 14px; color: #3C82F6;"></p>
                </div>

                <div class="setting">
                    <p style="font-weight: 500; font-size: 14px;">Microsoft Accounts</p>
                    <select name="accounts" id="account_select" class="select">
                        <option selected disabled>Choose an account</option>
                        <option value="no-account">NONE</option>
                    </select>
                    <div id="account_status"></div>
                    <div style="display: flex; gap: 10px;">
                        <button class="button" id="addbutton" style="flex: 1;">Add Account</button>
                        <button class="button" id="removebutton" style="flex: 1; background-color: #1E293B;" disabled>Remove</button>
                    </div>
                </div>
            </div>

            <div class="content hidden" id="about">
                <div class="setting">
                  <p style="line-height: 1.6; color: #94A3B8;">
                    Wispcraft uses the <a class="link" href="https://github.com/MercuryWorkshop/wisp-protocol" target="_blank">Wisp protocol</a> to allow an Eaglercraft client to connect to traditional Java Minecraft servers.
                  </p>
                  
                  <div style="background-color: #0F172A; border: 1px solid #1E293B; padding: 1rem; border-radius: 8px;">
                    <p style="margin-bottom: 0.5rem; font-size: 13px;">To connect to Java servers, prefix with:</p>
                    <code style="color: #3C82F6; font-family: monospace;">java://</code>
                    <p style="margin-top: 1rem; margin-bottom: 0.5rem; font-size: 13px;">For Eaglercraft servers, use:</p>
                    <code style="color: #3C82F6; font-family: monospace;">wss://</code>
                  </div>

                  <p style="font-weight: 600; margin-top: 1rem;">Warnings:</p>
                  <ul class="list">
                    <li>Connecting to cracked servers over Wisp grants the Wisp server access to your session data.</li>
                    <li>Using official accounts may lead to automated server-side security flags.</li>
                  </ul>
                </div>
            </div>
        </div>`;

	document.body.insertAdjacentHTML("beforeend", ui);

	const settings = document.querySelector("#settings") as HTMLDivElement;
	const about = document.querySelector("#about") as HTMLDivElement;
	const settingsTab = document.querySelector("#settings_tab") as HTMLSpanElement;
	const aboutTab = document.querySelector("#about_tab") as HTMLSpanElement;
	const wispInput = document.querySelector("#wisp_url") as HTMLInputElement;
	const saveStatus = document.querySelector("#save_status") as HTMLParagraphElement;
	const accountSelect = document.querySelector("#account_select") as HTMLSelectElement;
	const addButton = document.querySelector("#addbutton") as HTMLButtonElement;
	const removeButton = document.querySelector("#removebutton") as HTMLButtonElement;
	const accountStatus = document.querySelector("#account_status") as HTMLParagraphElement;

	wispInput.addEventListener("focusin", () =>
		keydownListeners.map((listener) => window.removeEventListener("keydown", listener))
	);

	wispInput.addEventListener("focusout", () =>
		keydownListeners.map((listener) => nativeAddEventListener("keydown", listener))
	);

	if (localStorage["wispcraft_wispurl"]) {
		wispInput.value = localStorage["wispcraft_wispurl"] as string;
	}

	if (localStorage["wispcraft_accounts"]) {
		const accounts = JSON.parse(localStorage["wispcraft_accounts"]) as TokenStore[];
		for (const account of accounts) {
			const option = document.createElement("option");
			option.value = account.username;
			option.innerText = account.username;
			accountSelect.add(option);
		}
	}

	if (localStorage["wispcraft_last_used_account"]) {
		accountSelect.value = localStorage["wispcraft_last_used_account"];
	}

	let saveTi: any = -1;

	wispInput.onchange = async () => {
		if (saveTi != -1) {
			clearTimeout(saveTi);
			saveTi = -1;
		}
		try {
			const value = wispInput.value;
			localStorage.setItem("wispcraft_wispurl", value);
			set_wisp_server(value);
			await reconnect();
			saveStatus.innerText = `Wisp server updated.`;
		} catch (e) {
			saveStatus.innerText = `Error: ${new String(e).toString()}`;
		}
		saveTi = setTimeout(() => { saveStatus.innerText = ""; }, 5000);
	};

	aboutTab.onclick = () => {
		settingsTab.classList.remove("selected");
		aboutTab.classList.add("selected");
		settings.classList.add("hidden");
		about.classList.remove("hidden");
	};

	settingsTab.onclick = () => {
		aboutTab.classList.remove("selected");
		settingsTab.classList.add("selected");
		about.classList.add("hidden");
		settings.classList.remove("hidden");
	};

	accountSelect.onchange = async () => {
		if (accountSelect.value === "no-account") {
			authstore.user = null;
			authstore.yggToken = "";
			localStorage["wispcraft_last_used_account"] = "no-account";
			removeButton.disabled = true;
			return;
		}
		const accounts = JSON.parse(localStorage["wispcraft_accounts"]) as TokenStore[];
		const account = accounts.find(a => a.username === accountSelect.value);
		if (account) {
			try {
				try {
					authstore.msToken = account.ms;
					authstore.yggToken = account.token;
					authstore.user = await getProfile(authstore.yggToken);
				} catch (e) {
					authstore.yggToken = await minecraftAuth(authstore.msToken);
					authstore.user = await getProfile(authstore.yggToken);
				}
				localStorage["wispcraft_last_used_account"] = authstore.user.name;
				removeButton.disabled = false;
				return;
			} catch (e) {
				removeAcc();
			}
		}
		accountSelect.value = "no-account";
		authstore.user = null;
		authstore.yggToken = "";
		localStorage["wispcraft_last_used_account"] = "no-account";
		removeButton.disabled = true;
	};

	const removeAcc = () => {
		if (accountSelect.value === "no-account") return;
		const localAuthStore = localStorage["wispcraft_accounts"];
		if (!localAuthStore) return;
		const accounts = JSON.parse(localAuthStore);
		const existingAccount = accounts.findIndex((a: any) => a.username === accountSelect.value);
		if (existingAccount == -1) return;
		accounts.splice(existingAccount, 1);
		localStorage["wispcraft_accounts"] = JSON.stringify(accounts);
		accountSelect.remove(accountSelect.selectedIndex);
	};

	removeButton.onclick = removeAcc;

	addButton.onclick = async () => {
		try {
			addButton.disabled = true;
			const codeGenerator = await deviceCodeAuth();
			const linkUrl = "https://microsoft.com/link?otc=" + codeGenerator.code;
			const qrSvg = encodeQR(linkUrl, "svg", { scale: 5, border: 1 });
			accountStatus.innerHTML = `Use code <code style="color:#3C82F6; font-weight:bold;">${codeGenerator.code}</code> at <a class="link" id="mslink" href="javascript:void(0)">microsoft.com/link</a><br />${qrSvg}`;

			accountStatus.querySelector<HTMLAnchorElement>("#mslink")!.onclick = async () => {
				window.open(linkUrl, "", "height=600,width=450");
			};

			const token = await codeGenerator.token;
			accountStatus.innerHTML = "Authenticating...";
			authstore.msToken = token;
			authstore.yggToken = await minecraftAuth(authstore.msToken);
			authstore.user = await getProfile(authstore.yggToken);

			const localAuthStore = localStorage["wispcraft_accounts"];
			const newAccEntry = { username: authstore.user.name, token: authstore.yggToken, ms: authstore.msToken };

			let accounts = localAuthStore ? JSON.parse(localAuthStore) : [];
			const idx = accounts.findIndex((a: any) => a.username === authstore.user?.name);
			if (idx !== -1) accounts.splice(idx, 1, newAccEntry); else accounts.push(newAccEntry);

			localStorage["wispcraft_accounts"] = JSON.stringify(accounts);
			const selector = document.createElement("option");
			selector.value = authstore.user.name;
			selector.innerText = authstore.user.name;
			accountSelect.add(selector);
			accountSelect.value = authstore.user.name;
			accountStatus.innerHTML = "";
			addButton.disabled = false;
			localStorage["wispcraft_last_used_account"] = authstore.user.name;
		} catch (e) {
			accountStatus.innerHTML = `Error: ${new String(e).toString()}`;
			addButton.disabled = false;
		}
	};

	if (!localStorage["seen_about"]) {
		aboutTab.click();
		localStorage["seen_about"] = 1;
	}
}

export function showUI() {
	const settingsUi = document.querySelector(".settings-ui");
	if (!settingsUi) {
		createUI();
		return showUI();
	}
	settingsUi.classList.remove("hidden");
	document.querySelector(".backdrop-blur")!.classList.remove("hidden");
}