"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const common_1 = require("../../common");
const Channel_1 = require("../Channel");
const LiveVideo_1 = require("../LiveVideo");
const MixPlaylist_1 = require("../MixPlaylist");
const Playlist_1 = require("../Playlist");
const SearchResult_1 = require("../SearchResult");
const Video_1 = require("../Video");
const constants_1 = require("../constants");
// export type ClientOptions = {
// 	initialCookie: string;
// 	oauth: OAuthOptions;
// 	/** Optional options for http client */
// 	fetchOptions: Partial<RequestInit>;
// 	/** Optional options passed when sending a request to youtube (context.client) */
// 	youtubeClientOptions: Record<string, unknown>;
// 	proxy:string;
// };
/** Youtube Client */
class Client {
    constructor(options = {}) {
        this.options = {
            initialCookie: "",
            oauth: { enabled: false },
            fetchOptions: {},
            proxy: "",
            ...options,
            youtubeClientOptions: {
                hl: "en",
                gl: "US",
                ...options.youtubeClientOptions,
            },
            apiKey: options.apiKey || constants_1.INNERTUBE_API_KEY,
            baseUrl: options.baseUrl || constants_1.BASE_URL,
            clientName: options.clientName || constants_1.INNERTUBE_CLIENT_NAME,
            clientVersion: options.clientVersion || constants_1.INNERTUBE_CLIENT_VERSION,
        };
        this.http = new common_1.HTTP(this.options);
    }
    get oauth() {
        return {
            token: this.http.oauth.token,
            expiresAt: this.http.oauth.expiresAt,
            refreshToken: this.http.oauth.refreshToken,
        };
    }
    /**
     * Searches for videos / playlists / channels
     *
     * @param query The search query
     * @param options Search options
     *
     */
    async search(query, options) {
        const result = new SearchResult_1.SearchResult({ client: this });
        await result.search(query, options || {});
        return result;
    }
    /**
     * Search for videos / playlists / channels and returns the first result
     *
     * @return Can be {@link VideoCompact} | {@link PlaylistCompact} | {@link BaseChannel} | `undefined`
     */
    async findOne(query, options) {
        const result = await this.search(query, options);
        return result.items[0] || undefined;
    }
    /** Get playlist information and its videos by playlist id or URL */
    async getPlaylist(playlistId) {
        if (playlistId.startsWith("RD")) {
            const response = await this.http.post(`${constants_1.I_END_POINT}/next`, {
                data: { playlistId },
            });
            if (response.data.error) {
                return undefined;
            }
            return new MixPlaylist_1.MixPlaylist({ client: this }).load(response.data);
        }
        const response = await this.http.post(`${constants_1.I_END_POINT}/browse`, {
            data: { browseId: `VL${playlistId}` },
        });
        if (response.data.error || response.data.alerts?.shift()?.alertRenderer?.type === "ERROR") {
            return undefined;
        }
        return new Playlist_1.Playlist({ client: this }).load(response.data);
    }
    /** Get video information by video id or URL */
    async getVideo(videoId) {
        const nextPromise = this.http.post(`${constants_1.I_END_POINT}/next`, { data: { videoId } });
        const playerPromise = this.http.post(`${constants_1.I_END_POINT}/player`, { data: { videoId } });
        const [nextResponse, playerResponse] = await Promise.all([nextPromise, playerPromise]);
        const data = { response: nextResponse.data, playerResponse: playerResponse.data };
        const playabilityStatus = data.playerResponse?.playabilityStatus;
        const hasWatchContents = !!data.response?.contents?.twoColumnWatchNextResults?.results?.results?.contents;
        // Unavailable / deleted / errored video (or an empty payload): still return a
        // Video so callers can inspect `isDeleted` / `isError`. parseRawData classifies
        // these and loadBaseVideo returns early without touching missing fields.
        if (!hasWatchContents || playabilityStatus?.status === "ERROR") {
            return new Video_1.Video({ client: this }).load(data);
        }
        return (!playabilityStatus?.liveStreamability
            ? new Video_1.Video({ client: this }).load(data)
            : new LiveVideo_1.LiveVideo({ client: this }).load(data));
    }
    /** Get Channel information by channel handel */
    async getAbout(channelHandle) {
        const response = await this.http.get(`${channelHandle}/about`, {
            params: { pbj: "1" },
        });
        return response;
    }
    /**
     * Get channel information by channel id.
     *
     * Always returns a {@link Channel}; inspect `channel.apiDataQuality`
     * (`full` | `partial` | `unavailable` | `error`) to decide how to handle it.
     * For `unavailable`/`error` the requested id is preserved and
     * `channel.unavailableReason` describes why.
     */
    async getChannel(channelId) {
        const response = await this.http.post(`${constants_1.I_END_POINT}/browse`, {
            data: { browseId: channelId },
        });
        const channel = new Channel_1.Channel({ client: this }).load(response.data);
        if (!channel.id)
            channel.id = channelId;
        return channel;
    }
    /**
     * Get video transcript / caption by video id
     */
    async getVideoTranscript(videoId, languageCode) {
        const video = await this.getVideo(videoId);
        return video?.captions?.get(languageCode);
    }
    /**
     * Returns this library's name and version from package.json
     */
    static getVersion() {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pkg = require("../../../../package.json");
        return { name: pkg.name, version: pkg.version };
    }
}
exports.Client = Client;
