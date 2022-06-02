"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const common_1 = require("../common");
const constants_1 = require("../constants");
/** Represents a Video, usually returned from `client.getVideo()`  */
class Video extends _1.BaseVideo {
    /** @hidden */
    constructor(video = {}) {
        super();
        /**
         * Comments of this video
         *
         * You need to load the comment first by calling `video.nextComments()` as youtube doesn't send any comments data when loading the video (from `client.getVideo()`)
         */
        this.comments = [];
        Object.assign(this, video);
    }
    /**
     * Load this instance with raw data from Youtube
     *
     * @hidden
     */
    load(data) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
        super.load(data);
        this.comments = [];
        let countData;
        countData = ((_h = (_g = (_f = (_e = (_d = (_c = (_b = (_a = data[3].response) === null || _a === void 0 ? void 0 : _a.contents) === null || _b === void 0 ? void 0 : _b.twoColumnWatchNextResults) === null || _c === void 0 ? void 0 : _c.results) === null || _d === void 0 ? void 0 : _d.results) === null || _e === void 0 ? void 0 : _e.contents[2].itemSectionRenderer) === null || _f === void 0 ? void 0 : _f.contents[0].commentsEntryPointHeaderRenderer) === null || _g === void 0 ? void 0 : _g.commentCount) === null || _h === void 0 ? void 0 : _h.simpleText) || null;
        if (countData && countData.includes('K')) {
            countData = parseFloat(countData.replace(',', '.').replace('K', '')) * 1000;
            countData = parseInt(countData);
        }
        else {
            countData = countData ? parseInt(countData) : null;
        }
        this.commentCount = countData;
        // Durationa
        const videoInfo = _1.BaseVideo.parseRawData(data);
        this.duration = +videoInfo.videoDetails.lengthSeconds;
        this.category = ((_l = (_k = (_j = data[2].playerResponse) === null || _j === void 0 ? void 0 : _j.microformat) === null || _k === void 0 ? void 0 : _k.playerMicroformatRenderer) === null || _l === void 0 ? void 0 : _l.category) || null;
        this.publishDate = ((_p = (_o = (_m = data[2].playerResponse) === null || _m === void 0 ? void 0 : _m.microformat) === null || _o === void 0 ? void 0 : _o.playerMicroformatRenderer) === null || _p === void 0 ? void 0 : _p.publishDate) || null;
        let formats = ((_s = (_r = (_q = data[2].playerResponse) === null || _q === void 0 ? void 0 : _q.streamingData) === null || _r === void 0 ? void 0 : _r.formats) === null || _s === void 0 ? void 0 : _s.length) > 0 ? (_u = (_t = data[2].playerResponse) === null || _t === void 0 ? void 0 : _t.streamingData) === null || _u === void 0 ? void 0 : _u.formats[0] : null;
        this.isShorts = this.duration <= 60 && formats && formats.height / formats.width > 1.1 ? true : false;
        const itemSectionRenderer = data[3].response.contents.twoColumnWatchNextResults.results.results.contents.find((c) => c.itemSectionRenderer && c.itemSectionRenderer.sectionIdentifier === 'comment-item-section').itemSectionRenderer;
        this.commentContinuation = common_1.getContinuationFromItems(itemSectionRenderer.contents);
        return this;
    }
    /**
     * Load next 20 comments of the video, and push the loaded comments to {@link Video.comments}
     * You can only load up to 2000 comments from a video, this is due to the limitation from Youtube
     *
     * @example
     * ```js
     * const video = await youtube.getVideo(VIDEO_ID);
     * await video.nextComments();
     * console.log(video.comments) // first 20 comments
     *
     * let newComments = await video.nextComments();
     * console.log(newComments) // 20 loaded comments
     * console.log(video.comments) // first 40 comments
     *
     * await video.nextComments(0); // load the rest of the comments in the video
     * ```
     *
     * @param count How many times to load the next comments. Set 0 to load all comments (might take a while on a video with many comments!)
     *
     * @returns Loaded comments
     */
    nextComments(count = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            const newComments = [];
            for (let i = 0; i < count || count == 0; i++) {
                if (!this.commentContinuation)
                    break;
                try {
                    const response = yield this.client.http.post(`${constants_1.I_END_POINT}/next`, {
                        data: { continuation: this.commentContinuation },
                    });
                    const endpoints = response.data.onResponseReceivedEndpoints.pop();
                    const continuationItems = (endpoints.reloadContinuationItemsCommand || endpoints.appendContinuationItemsAction).continuationItems;
                    this.commentContinuation = common_1.getContinuationFromItems(continuationItems);
                    const comments = common_1.mapFilter(continuationItems, "commentThreadRenderer");
                    newComments.push(...comments.map((c) => new _1.Comment({ video: this, client: this.client }).load(c)));
                    console.log('action done. comms', newComments.length);
                }
                catch (e) {
                    console.log('Req failed: Probably timeout');
                    if (newComments.length > 0) {
                        this.comments.push(...newComments);
                        return newComments;
                    }
                    else {
                        break;
                    }
                }
            }
            this.comments.push(...newComments);
            return newComments;
        });
    }
}
exports.default = Video;
