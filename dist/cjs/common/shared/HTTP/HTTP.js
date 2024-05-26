"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const url_1 = require("url");
const https_proxy_agent_1 = require("https-proxy-agent");
/**
 * @hidden
 */
class HTTP {
    constructor(options) {
        this.proxy = options.proxy || "";
        this.apiKey = options.apiKey;
        this.baseUrl = options.baseUrl;
        this.clientName = options.clientName;
        this.clientVersion = options.clientVersion;
        this.cookie = options.initialCookie || "";
        this.defaultHeaders = {
            "x-youtube-client-version": this.clientVersion,
            "x-youtube-client-name": "1",
            "content-type": "application/json",
            "accept-encoding": "gzip, deflate, br",
            "Accept-Language": "de-DE,de;q=0.9",
        };
        this.defaultFetchOptions = options.fetchOptions || {};
        this.defaultClientOptions = options.youtubeClientOptions || {};
    }
    async get(path, options) {
        return await this.request(path, {
            ...options,
            params: { prettyPrint: "false", ...options?.params },
            method: "GET",
        });
    }
    async post(path, options) {
        return await this.request(path, {
            ...options,
            method: "POST",
            params: {
                key: this.apiKey,
                prettyPrint: "false",
                ...options?.params,
            },
            data: {
                context: {
                    client: {
                        clientName: this.clientName,
                        clientVersion: this.clientVersion,
                        ...this.defaultClientOptions,
                    },
                },
                ...options?.data,
            },
        });
    }
    async request(path, partialOptions) {
        const options = {
            ...partialOptions,
            ...this.defaultFetchOptions,
            headers: {
                ...this.defaultHeaders,
                cookie: this.cookie,
                referer: `https://${this.baseUrl}/`,
                ...partialOptions.headers,
                ...this.defaultFetchOptions.headers,
            },
            body: partialOptions.data ? JSON.stringify(partialOptions.data) : undefined,
            agent: Boolean(this.proxy) ? new https_proxy_agent_1.HttpsProxyAgent(this.proxy) : undefined,
        };
        // if URL is a full URL, ignore baseUrl
        let urlString;
        if (path.startsWith("http")) {
            const url = new URL(path);
            for (const [key, value] of Object.entries(partialOptions.params || {})) {
                url.searchParams.set(key, value);
            }
            urlString = url.toString();
        }
        else {
            urlString = `https://${this.baseUrl}/${path}?${new url_1.URLSearchParams(partialOptions.params)}`;
        }
        const response = await node_fetch_1.default(urlString, options);
        const data = await response.json();
        this.parseCookie(response);
        return { data };
    }
    parseCookie(response) {
        const cookie = response.headers.get("set-cookie");
        if (cookie)
            this.cookie = cookie;
    }
}
exports.HTTP = HTTP;
