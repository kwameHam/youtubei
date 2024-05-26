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
        let channelId, title, avatar, subscriberCountText, tvBanner, mobileBanner, banner, videoCount;
        const { c4TabbedHeaderRenderer, pageHeaderRenderer } = data.header;
        const metadata = (_a = data.metadata) === null || _a === void 0 ? void 0 : _a.channelMetadataRenderer;
        const microformat = (_b = data.microformat) === null || _b === void 0 ? void 0 : _b.microformatDataRenderer;
        if (c4TabbedHeaderRenderer) {
            channelId = c4TabbedHeaderRenderer.channelId;
            title = c4TabbedHeaderRenderer.title;
            subscriberCountText = (_c = c4TabbedHeaderRenderer.subscriberCountText) === null || _c === void 0 ? void 0 : _c.simpleText;
            avatar = (_d = c4TabbedHeaderRenderer.avatar) === null || _d === void 0 ? void 0 : _d.thumbnails;
            tvBanner = (_e = c4TabbedHeaderRenderer.tvBanner) === null || _e === void 0 ? void 0 : _e.thumbnails;
            mobileBanner = c4TabbedHeaderRenderer.mobileBanner.thumbnails;
            banner = c4TabbedHeaderRenderer.banner.thumbnails;
            videoCount = ((_g = (_f = c4TabbedHeaderRenderer.videosCountText) === null || _f === void 0 ? void 0 : _f.runs[0]) === null || _g === void 0 ? void 0 : _g.text) || 0;
            target.badge = ((c4TabbedHeaderRenderer === null || c4TabbedHeaderRenderer === void 0 ? void 0 : c4TabbedHeaderRenderer.badges) && (c4TabbedHeaderRenderer === null || c4TabbedHeaderRenderer === void 0 ? void 0 : c4TabbedHeaderRenderer.badges.length) > 0) ? (_j = (_h = c4TabbedHeaderRenderer.badges[0]) === null || _h === void 0 ? void 0 : _h.metadataBadgeRenderer) === null || _j === void 0 ? void 0 : _j.tooltip : null;
            target.channelHandle = ((_l = (_k = c4TabbedHeaderRenderer.channelHandleText) === null || _k === void 0 ? void 0 : _k.runs[0]) === null || _l === void 0 ? void 0 : _l.text) || null;
        }
        else {
            channelId =
                data.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.endpoint
                    .browseEndpoint.browseId;
            title = pageHeaderRenderer.pageTitle;
            const { metadata, image: imageModel, banner: bannerModel, } = pageHeaderRenderer.content.pageHeaderViewModel;
            subscriberCountText =
                metadata.contentMetadataViewModel.metadataRows[1].metadataParts[0].text.content;
            avatar = imageModel.decoratedAvatarViewModel.avatar.avatarViewModel.image.sources;
            banner = bannerModel.imageBannerViewModel.image.sources;
        }
        target.id = channelId;
        target.name = title;
        target.thumbnails = new common_1.Thumbnails().load(avatar);
        target.videoCount = videoCount || 0;
        target.subscriberCount = subscriberCountText;
        target.channelLink = metadata ? metadata.ownerUrls[0] : null;
        target.channelTags = microformat ? microformat.tags : [];
        target.description = metadata ? metadata.description : microformat.description;
        target.banner = new common_1.Thumbnails().load(banner || []);
        target.tvBanner = new common_1.Thumbnails().load(tvBanner || []);
        target.mobileBanner = new common_1.Thumbnails().load(mobileBanner || []);
        target.shelves = ChannelParser.parseShelves(target, data);
        if (!target.channelLink && target.channelHandle) {
            target.channelLink = 'http://www.youtube.com/' + target.channelHandle;
        }
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
