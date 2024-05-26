"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoCompact = void 0;
const Base_1 = require("../Base");
const VideoCompactParser_1 = require("./VideoCompactParser");
/** Represent a compact video (e.g. from search result, playlist's videos, channel's videos) */
class VideoCompact extends Base_1.Base {
    /** @hidden */
    constructor(attr) {
        super(attr.client);
        Object.assign(this, attr);
    }
    /** Whether this video is private / deleted or not, only useful in playlist's videos */
    get isPrivateOrDeleted() {
        return !this.duration;
    }
    /**
     * Load this instance with raw data from Youtube
     *
     * @hidden
     */
    load(data) {
        VideoCompactParser_1.VideoCompactParser.loadVideoCompact(this, data);
        return this;
    }
    /**
     * Get {@link Video} object based on current video id
     *
     * Equivalent to
     * ```js
     * client.getVideo(videoCompact.id);
     * ```
     */
    async getVideo() {
        return await this.client.getVideo(this.id);
    }
    /**
     * Get Video transcript (if exists)
     *
     * Equivalent to
     * ```js
     * client.getVideoTranscript(video.id);
     * ```
     */
    async getTranscript(languageCode) {
        return this.client.getVideoTranscript(this.id, languageCode);
    }
}
exports.VideoCompact = VideoCompact;
