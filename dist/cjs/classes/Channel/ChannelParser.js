"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelParser = void 0;
const BaseChannel_1 = require("../BaseChannel");
const PlaylistCompact_1 = require("../PlaylistCompact");
const Thumbnails_1 = require("../Thumbnails");
const VideoCompact_1 = require("../VideoCompact");
const ShortCompact_1 = require("../ShortCompact");
class ChannelParser {
    static loadChannel(target, data) {
        var _a;
        const { channelId, title, avatar, subscriberCountText, } = data.header.c4TabbedHeaderRenderer;
        target.id = channelId;
        target.name = title;
        target.thumbnails = new Thumbnails_1.Thumbnails().load(avatar.thumbnails);
        target.videoCount = 0; // data not available
        target.subscriberCount = subscriberCountText === null || subscriberCountText === void 0 ? void 0 : subscriberCountText.simpleText;
        target.description = (_a = data === null || data === void 0 ? void 0 : data.metadata) === null || _a === void 0 ? void 0 : _a.channelMetadataRenderer.description;
        const { tvBanner, mobileBanner, banner } = data.header.c4TabbedHeaderRenderer;
        target.banner = new Thumbnails_1.Thumbnails().load((banner === null || banner === void 0 ? void 0 : banner.thumbnails) || []);
        target.tvBanner = new Thumbnails_1.Thumbnails().load((tvBanner === null || tvBanner === void 0 ? void 0 : tvBanner.thumbnails) || []);
        target.mobileBanner = new Thumbnails_1.Thumbnails().load((mobileBanner === null || mobileBanner === void 0 ? void 0 : mobileBanner.thumbnails) || []);
        target.shelves = ChannelParser.parseShelves(target, data);
        return target;
    }
    static parseShelves(target, data) {
        var _a;
        const shelves = [];
        const rawShelves = data.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content
            .sectionListRenderer.contents;
        for (const rawShelf of rawShelves) {
            const shelfRenderer = rawShelf.itemSectionRenderer.contents[0].shelfRenderer || rawShelf.itemSectionRenderer.contents[0].reelShelfRenderer;
            const isShortShelf = (rawShelf.itemSectionRenderer.contents[0].reelShelfRenderer);
            if (!shelfRenderer)
                continue;
            const { title, subtitle } = shelfRenderer;
            let renderer = isShortShelf ? shelfRenderer : (_a = shelfRenderer.content) === null || _a === void 0 ? void 0 : _a.horizontalListRenderer;
            if (!renderer)
                continue;
            const items = renderer.items
                .map((i) => {
                if (isShortShelf) {
                    if (i.reelItemRenderer) {
                        return new ShortCompact_1.ShortCompact({ client: target.client }).load(i.reelItemRenderer);
                    }
                }
                else {
                    if (i.gridVideoRenderer)
                        return new VideoCompact_1.VideoCompact({ client: target.client }).load(i.gridVideoRenderer);
                    if (i.gridPlaylistRenderer)
                        return new PlaylistCompact_1.PlaylistCompact({ client: target.client }).load(i.gridPlaylistRenderer);
                    if (i.gridChannelRenderer)
                        return new BaseChannel_1.BaseChannel({ client: target.client }).load(i.gridChannelRenderer);
                }
                return undefined;
            })
                .filter((i) => i !== undefined);
            const shelf = {
                title: title.runs[0].text,
                subtitle: subtitle === null || subtitle === void 0 ? void 0 : subtitle.simpleText,
                items,
            };
            shelves.push(shelf);
        }
        return shelves;
    }
}
exports.ChannelParser = ChannelParser;
