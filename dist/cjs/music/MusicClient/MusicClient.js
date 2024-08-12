"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicClient = void 0;
const common_1 = require("../../common");
const MusicLyrics_1 = require("../MusicLyrics");
const MusicSearchResult_1 = require("../MusicSearchResult");
const constants_1 = require("../constants");
/** Youtube Music Client */
class MusicClient {
    constructor(options = {}) {
        const fullOptions = {
            initialCookie: "",
            fetchOptions: {},
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
            clientName: "WEB_REMIX",
            clientVersion: constants_1.INNERTUBE_CLIENT_VERSION,
            ...fullOptions,
        });
    }
    async search(query, type) {
        if (!type) {
            const response = await this.http.post(`${constants_1.I_END_POINT}/search`, {
                data: { query },
            });
            return MusicSearchResult_1.MusicAllSearchResultParser.parseSearchResult(response.data, this);
        }
        else {
            const result = new MusicSearchResult_1.MusicSearchResult({ client: this });
            await result.search(query, type);
            return result;
        }
    }
    /**
     * Searches for all video, song, album, playlist, or artist
     *
     * @param query The search query
     */
    async searchAll(query) {
        const response = await this.http.post(`${constants_1.I_END_POINT}/search`, {
            data: { query },
        });
        return {
            top: MusicSearchResult_1.MusicAllSearchResultParser.parseTopResult(response.data, this),
            shelves: MusicSearchResult_1.MusicAllSearchResultParser.parseSearchResult(response.data, this),
        };
    }
    /**
     * Get lyrics of a song
     *
     * @param query The search query
     * @param options Search options
     *
     */
    async getLyrics(id) {
        // get watch page data to obtain lyric browse id
        const watchResponse = await this.http.post(`${constants_1.I_END_POINT}/next`, {
            data: { videoId: id },
        });
        const lyricTab = watchResponse.data.contents.singleColumnMusicWatchNextResultsRenderer.tabbedRenderer
            .watchNextTabbedResultsRenderer.tabs[1].tabRenderer;
        if (lyricTab.unselectable)
            return undefined;
        // get lyric data with browse id
        const lyricsBrowseId = lyricTab.endpoint.browseEndpoint.browseId;
        const lyricResponse = await this.http.post(`${constants_1.I_END_POINT}/browse`, {
            data: { browseId: lyricsBrowseId },
        });
        const data = lyricResponse.data.contents.sectionListRenderer.contents[0]
            .musicDescriptionShelfRenderer;
        const content = data.description.runs[0].text;
        const description = data.footer.runs[0].text;
        return new MusicLyrics_1.MusicLyrics({
            content,
            description,
        });
    }
}
exports.MusicClient = MusicClient;
