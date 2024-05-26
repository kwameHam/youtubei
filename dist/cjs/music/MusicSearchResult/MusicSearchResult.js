"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicSearchResult = exports.MusicSearchTypeEnum = void 0;
const MusicContinuable_1 = require("../MusicContinuable");
const constants_1 = require("../constants");
const MusicSearchResultParser_1 = require("./MusicSearchResultParser");
const proto_1 = require("./proto");
var MusicSearchTypeEnum;
(function (MusicSearchTypeEnum) {
    MusicSearchTypeEnum["Song"] = "song";
    MusicSearchTypeEnum["Video"] = "video";
})(MusicSearchTypeEnum = exports.MusicSearchTypeEnum || (exports.MusicSearchTypeEnum = {}));
/**
 * Represents search result, usually returned from `client.search();`.
 *
 * {@link MusicSearchResult} is a helper class to manage search result
 *
 * @example
 * ```ts
 * const result = await music.search("Keyword", "song");
 *
 * console.log(result.items); // search result from first page
 *
 * let nextSearchResult = await result.next();
 * console.log(nextSearchResult); // search result from second page
 *
 * nextSearchResult = await result.next();
 * console.log(nextSearchResult); // search result from third page
 *
 * console.log(result.items); // search result from first, second, and third page.
 * ```
 *
 * @noInheritDoc
 */
class MusicSearchResult extends MusicContinuable_1.MusicContinuable {
    /** @hidden */
    constructor({ client, type }) {
        super({ client });
        if (type)
            this.type = type;
    }
    /**
     * Initialize data from search
     *
     * @param query Search query
     * @param options Search Options
     *
     * @hidden
     */
    async search(query, type) {
        this.items = [];
        this.type = type;
        const bufferParams = proto_1.MusicSearchProto.encode(proto_1.optionsToProto(type)).finish();
        const response = await this.client.http.post(`${constants_1.I_END_POINT}/search`, {
            data: {
                query,
                params: Buffer.from(bufferParams).toString("base64"),
            },
        });
        const { data, continuation } = MusicSearchResultParser_1.MusicSearchResultParser.parseInitialSearchResult(response.data, type, this.client);
        this.items.push(...data);
        this.continuation = continuation;
        return this;
    }
    async fetch() {
        if (!this.type) {
            return {
                items: [],
                continuation: undefined,
            };
        }
        const response = await this.client.http.post(`${constants_1.I_END_POINT}/search`, {
            data: { continuation: this.continuation },
        });
        const { data, continuation } = MusicSearchResultParser_1.MusicSearchResultParser.parseContinuationSearchResult(response.data, this.type, this.client);
        return {
            items: data,
            continuation,
        };
    }
}
exports.MusicSearchResult = MusicSearchResult;
