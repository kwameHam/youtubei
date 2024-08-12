"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoCaptions = void 0;
const Base_1 = require("../Base");
const Caption_1 = require("../Caption");
/**
 * Captions of a video
 *
 * @example
 * ```js
 *
 * console.log(video.captions.languages.map((l) => `${l.code} - ${l.name}`)); // printing out available languages for captions
 *
 * console.log(await video.captions.get("en")); // printing out captions of a specific language using language code
 * ```
 */
class VideoCaptions extends Base_1.Base {
    /** @hidden */
    constructor({ video, client }) {
        super(client);
        this.video = video;
        this.languages = [];
    }
    /**
     * Load this instance with raw data from Youtube
     *
     * @hidden
     */
    load(data) {
        const { captionTracks } = data;
        if (captionTracks) {
            this.languages = captionTracks.map((track) => new Caption_1.CaptionLanguage({
                captions: this,
                name: track.name.simpleText,
                code: track.languageCode,
                isTranslatable: !!track.isTranslatable,
                url: track.baseUrl,
            }));
        }
        return this;
    }
    /**
     * Get captions of a specific language or a translation of a specific language
     */
    async get(languageCode, translationLanguageCode) {
        if (!languageCode)
            languageCode = '' + this.client.options.youtubeClientOptions.hl;
        const url = this.languages.find((l) => l.code.toUpperCase() === languageCode?.toUpperCase())
            ?.url;
        if (!url)
            return undefined;
        const params = { fmt: "json3" };
        if (translationLanguageCode)
            params["tlang"] = translationLanguageCode;
        const response = await this.client.http.get(url, { params });
        const captions = response.data.events?.reduce((curr, e) => {
            if (e.segs === undefined)
                return curr;
            curr.push(new Caption_1.Caption({
                duration: e.dDurationMs,
                start: e.tStartMs,
                text: e.segs?.map((s) => s.utf8).join(),
                segments: e.segs,
            }));
            return curr;
        }, []);
        return captions;
    }
}
exports.VideoCaptions = VideoCaptions;
