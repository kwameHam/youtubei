"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoComments = void 0;
const Continuable_1 = require("../Continuable");
const constants_1 = require("../constants");
const VideoParser_1 = require("./VideoParser");
/**
 * {@link Continuable} of videos inside a {@link Video}
 *
 * @example
 * ```js
 * const video = await youtube.getVideo(VIDEO_ID);
 * await video.comments.next();
 * console.log(video.comments) // first 20 comments
 *
 * let newComments = await video.comments.next();
 * console.log(newComments) // 20 loaded comments
 * console.log(video.comments) // first 40 comments
 *
 * await video.comments.next(0); // load the rest of the comments in the video
 * ```
 *
 * @param count How many times to load the next comments. Set 0 to load all comments (might take a while on a video with many  comments!)
 *
 * @returns Loaded comments
 */
class VideoComments extends Continuable_1.Continuable {
    /** @hidden */
    constructor({ client, video }) {
        super({ client, strictContinuationCheck: true });
        this.video = video;
    }
    async fetch() {
        const response = await this.client.http.post(`${constants_1.I_END_POINT}/next`, {
            data: { continuation: this.continuation },
        });
        const items = VideoParser_1.VideoParser.parseComments(response.data, this.video);
        const continuation = VideoParser_1.VideoParser.parseCommentContinuation(response.data);
        return { continuation, items };
    }
}
exports.VideoComments = VideoComments;
