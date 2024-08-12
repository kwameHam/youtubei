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
/** Youtube Client */
class Client {
    constructor(options = {}) {
        this.options = {
            initialCookie: "",
            fetchOptions: {},
            proxy: "",
            ...options,
            youtubeClientOptions: {
                hl: "en",
                gl: "US",
                ...options.youtubeClientOptions,
            },
        };
        this.http = new common_1.HTTP({
            apiKey: constants_1.INNERTUBE_API_KEY,
            baseUrl: constants_1.BASE_URL,
            clientName: constants_1.INNERTUBE_CLIENT_NAME,
            clientVersion: constants_1.INNERTUBE_CLIENT_VERSION,
            ...this.options,
        });
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
        const response = await this.http.get(`${constants_1.WATCH_END_POINT}`, {
            params: { v: videoId, pbj: "1" },
        });
        const data = Array.isArray(response.data)
            ? response.data.reduce((prev, curr) => ({ ...prev, ...curr }), {})
            : response.data;
        if (!data.response?.contents?.twoColumnWatchNextResults.results.results.contents ||
            data.playerResponse.playabilityStatus.status === "ERROR") {
            return undefined;
        }
        return (!data.playerResponse.playabilityStatus.liveStreamability
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
    /** Get channel information by channel id+ */
    async getChannel(channelId) {
        const response = await this.http.post(`${constants_1.I_END_POINT}/browse`, {
            data: { browseId: channelId },
        });
        if (response.data.error || response.data.alerts?.shift()?.alertRenderer?.type === "ERROR") {
            return undefined;
        }
        return new Channel_1.Channel({ client: this }).load(response.data);
    }
    /**
     * Get video transcript / caption by video id
     */
    async getVideoTranscript(videoId, languageCode) {
        const video = await this.getVideo(videoId);
        return video?.captions?.get(languageCode);
    }
}
exports.Client = Client;
