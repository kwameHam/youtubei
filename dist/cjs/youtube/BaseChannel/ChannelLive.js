"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelLive = void 0;
const common_1 = require("../../common");
const Continuable_1 = require("../Continuable");
const VideoCompact_1 = require("../VideoCompact");
const constants_1 = require("../constants");
const BaseChannelParser_1 = require("./BaseChannelParser");
/**
 * {@link Continuable} of videos inside a {@link BaseChannel}
 *
 * @example
 * ```js
 * const channel = await youtube.findOne(CHANNEL_NAME, {type: "channel"});
 * await channel.live.next();
 * console.log(channel.live.items) // first 30 live videos
 *
 * let newLives = await channel.videos.next();
 * console.log(newLives) // 30 loaded live videos
 * console.log(channel.live.items) // first 60 live videos
 *
 * await channel.live.next(0); // load the rest of the live videos in the channel
 * ```
 */
class ChannelLive extends Continuable_1.Continuable {
    /** @hidden */
    constructor({ client, channel }) {
        super({ client, strictContinuationCheck: true });
        this.channel = channel;
    }
    async fetch() {
        const params = BaseChannelParser_1.BaseChannelParser.TAB_TYPE_PARAMS.live;
        const response = await this.client.http.post(`${constants_1.I_END_POINT}/browse`, {
            data: { browseId: this.channel?.id, params, continuation: this.continuation },
        });
        const items = BaseChannelParser_1.BaseChannelParser.parseTabData("live", response.data);
        const continuation = common_1.getContinuationFromItems(items);
        // Same delegation as ChannelVideos: VideoCompact.loadLockup keeps page order,
        // sets uploadDate, detects upcoming streams (whose lockups carry the scheduled
        // start where an aired stream carries its view count — upstream's inline
        // stripToInt turned "Scheduled for 8/31/26, 4:00 PM" into a view count).
        const videos = items
            .map((i) => {
            if (i.videoRenderer)
                return new VideoCompact_1.VideoCompact({
                    client: this.client,
                    channel: this.channel,
                }).load(i.videoRenderer);
            if (i.lockupViewModel?.contentType === "LOCKUP_CONTENT_TYPE_VIDEO")
                return new VideoCompact_1.VideoCompact({
                    client: this.client,
                    channel: this.channel,
                }).loadLockup(i.lockupViewModel);
            return undefined;
        })
            .filter((v) => v !== undefined);
        return {
            continuation,
            items: videos,
        };
    }
}
exports.ChannelLive = ChannelLive;
