"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelParser = void 0;
const common_1 = require("../../common");
const BaseChannel_1 = require("../BaseChannel");
const PlaylistCompact_1 = require("../PlaylistCompact");
const VideoCompact_1 = require("../VideoCompact");
class ChannelParser {
    static loadChannel(target, data) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const { channelId, title, avatar, subscriberCountText, badges, headerLinks, videosCountText, channelHandleText, tagline, } = data.header.c4TabbedHeaderRenderer;
        target.id = channelId;
        target.name = title;
        target.thumbnails = new common_1.Thumbnails().load(avatar.thumbnails);
        target.videoCount = ((_a = videosCountText === null || videosCountText === void 0 ? void 0 : videosCountText.runs[0]) === null || _a === void 0 ? void 0 : _a.text) || 0;
        target.channelHandle = ((_b = channelHandleText === null || channelHandleText === void 0 ? void 0 : channelHandleText.runs[0]) === null || _b === void 0 ? void 0 : _b.text) || null;
        target.badge = (badges && badges.length > 0) ? (_d = (_c = badges[0]) === null || _c === void 0 ? void 0 : _c.metadataBadgeRenderer) === null || _d === void 0 ? void 0 : _d.tooltip : null;
        target.channelLink = ((_f = (_e = data === null || data === void 0 ? void 0 : data.metadata) === null || _e === void 0 ? void 0 : _e.channelMetadataRenderer) === null || _f === void 0 ? void 0 : _f.ownerUrls[0]) || null;
        if (!target.channelLink && target.channelHandle) {
            target.channelLink = 'http://www.youtube.com/' + target.channelHandle;
        }
        target.description = ((_h = (_g = data === null || data === void 0 ? void 0 : data.metadata) === null || _g === void 0 ? void 0 : _g.channelMetadataRenderer) === null || _h === void 0 ? void 0 : _h.description) || ((_j = tagline === null || tagline === void 0 ? void 0 : tagline.channelTaglineRenderer) === null || _j === void 0 ? void 0 : _j.content) || null;
        target.channelTags = ((_l = (_k = data === null || data === void 0 ? void 0 : data.microformat) === null || _k === void 0 ? void 0 : _k.microformatDataRenderer) === null || _l === void 0 ? void 0 : _l.tags) || [];
        target.subscriberCount = subscriberCountText === null || subscriberCountText === void 0 ? void 0 : subscriberCountText.simpleText;
        const { tvBanner, mobileBanner, banner } = data.header.c4TabbedHeaderRenderer;
        target.banner = new common_1.Thumbnails().load((banner === null || banner === void 0 ? void 0 : banner.thumbnails) || []);
        target.tvBanner = new common_1.Thumbnails().load((tvBanner === null || tvBanner === void 0 ? void 0 : tvBanner.thumbnails) || []);
        target.mobileBanner = new common_1.Thumbnails().load((mobileBanner === null || mobileBanner === void 0 ? void 0 : mobileBanner.thumbnails) || []);
        target.shelves = ChannelParser.parseShelves(target, data);
        return target;
    }
    static parseShelves(target, data) {
        const shelves = [];
        const rawShelves = data.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content
            .sectionListRenderer.contents;
        for (const rawShelf of rawShelves) {
            const shelfRenderer = rawShelf.itemSectionRenderer.contents[0].shelfRenderer;
            if (!shelfRenderer)
                continue;
            const { title, content, subtitle } = shelfRenderer;
            if (!content.horizontalListRenderer)
                continue;
            const items = content.horizontalListRenderer.items
                .map((i) => {
                if (i.gridVideoRenderer)
                    return new VideoCompact_1.VideoCompact({ client: target.client }).load(i.gridVideoRenderer);
                if (i.gridPlaylistRenderer)
                    return new PlaylistCompact_1.PlaylistCompact({ client: target.client }).load(i.gridPlaylistRenderer);
                if (i.gridChannelRenderer)
                    return new BaseChannel_1.BaseChannel({ client: target.client }).load(i.gridChannelRenderer);
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
