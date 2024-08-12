"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseChannelParser = void 0;
const common_1 = require("../../common");
class BaseChannelParser {
    static loadBaseChannel(target, data) {
        const { channelId, title, thumbnail, subscriberCountText, videoCountText } = data;
        target.id = channelId;
        target.name = title.simpleText;
        target.thumbnails = new common_1.Thumbnails().load(thumbnail.thumbnails);
        target.subscriberCount = subscriberCountText?.simpleText;
        try {
            if (target.videoCount === 0 && videoCountText?.simpleText?.includes('subscribers')) {
                target.videoCountWrong = videoCountText.simpleText;
            }
        }
        catch (e) {
        }
        return target;
    }
    /** Parse tab data from request, tab name is ignored if it's a continuation data */
    static parseTabData(name, data) {
        const tab = data.contents?.twoColumnBrowseResultsRenderer.tabs.find((t) => {
            return (t.tabRenderer?.endpoint.browseEndpoint.params ===
                BaseChannelParser.TAB_TYPE_PARAMS[name]);
        });
        return (tab?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer
            ?.contents[0]?.gridRenderer?.items ||
            tab?.tabRenderer?.content?.richGridRenderer?.contents?.map((c) => c?.richItemRenderer?.content || c) ||
            data.onResponseReceivedActions?.[0]?.appendContinuationItemsAction?.continuationItems?.map((c) => c?.richItemRenderer?.content || c) ||
            []);
    }
}
exports.BaseChannelParser = BaseChannelParser;
BaseChannelParser.TAB_TYPE_PARAMS = {
    videos: "EgZ2aWRlb3PyBgQKAjoA",
    shorts: "EgZzaG9ydHPyBgUKA5oBAA%3D%3D",
    live: "EgdzdHJlYW1z8gYECgJ6AA%3D%3D",
    playlists: "EglwbGF5bGlzdHPyBgQKAkIA",
};
