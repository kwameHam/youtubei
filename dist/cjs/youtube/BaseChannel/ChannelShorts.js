"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelShorts = void 0;
const common_1 = require("../../common");
const Continuable_1 = require("../Continuable");
const VideoCompact_1 = require("../VideoCompact");
const constants_1 = require("../constants");
const BaseChannelParser_1 = require("./BaseChannelParser");
/**
 * {@link Continuable} of shorts inside a {@link BaseChannel}
 *
 * @example
 * ```js
 * const channel = await youtube.findOne(CHANNEL_NAME, {type: "channel"});
 * await channel.short.next();
 * console.log(channel.short.items) // first 30 shorts
 *
 * let newShorts = await channel.short.next();
 * console.log(newShorts) // 30 loaded shorts
 * console.log(channel.short.items) // first 60 shorts
 *
 * await channel.short.next(0); // load the rest of the shorts in the channel
 * ```
 */
class ChannelShorts extends Continuable_1.Continuable {
    /** @hidden */
    constructor({ client, channel }) {
        super({ client, strictContinuationCheck: true });
        this.channel = channel;
    }
    async fetch() {
        const params = BaseChannelParser_1.BaseChannelParser.TAB_TYPE_PARAMS.shorts;
        const response = await this.client.http.post(`${constants_1.I_END_POINT}/browse`, {
            data: { browseId: this.channel?.id, params, continuation: this.continuation },
        });
        const items = BaseChannelParser_1.BaseChannelParser.parseTabData("shorts", response.data);
        const continuation = common_1.getContinuationFromItems(items);
        const data = this.parseShorts(items);
        return {
            continuation,
            items: data.map((i) => new VideoCompact_1.VideoCompact({ client: this.client, channel: this.channel }).load(i)),
        };
    }
    parseShorts(items) {
        const shortItems = [];
        try {
            for (const item of items) {
                const short = {
                    videoId: undefined,
                    thumbnail: undefined,
                    headline: {},
                    viewCountText: { simpleText: undefined, runs: [{ text: '' }] }
                };
                const data = item?.shortsLockupViewModel;
                const reelWatchEndpoint = data?.onTap?.innertubeCommand?.reelWatchEndpoint;
                short.videoId = reelWatchEndpoint?.videoId;
                short.thumbnail = reelWatchEndpoint?.thumbnail;
                if (data?.overlayMetadata?.primaryText?.content)
                    short.headline = { simpleText: data.overlayMetadata.primaryText.content };
                if (data?.overlayMetadata?.secondaryText?.content)
                    short.viewCountText.simpleText = data.overlayMetadata.secondaryText.content; // = { simpleText:
                // data.overlaMetadata.secondaryText.content }
                if (!short.videoId) {
                    // console.log('ChannelShorts.parseShorts: parsing short failed:',item,'\n with short:',short)
                    continue;
                }
                shortItems.push(short);
            }
        }
        catch (e) {
            // console.log('Error: ChannelShorts.parseShorts : parsing short failed:',e)
        }
        return shortItems;
    }
}
exports.ChannelShorts = ChannelShorts;
