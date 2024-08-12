"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelParser = void 0;
const common_1 = require("../../common");
const BaseChannel_1 = require("../BaseChannel");
const PlaylistCompact_1 = require("../PlaylistCompact");
const VideoCompact_1 = require("../VideoCompact");
class ChannelParser {
    static loadChannel(target, data) {
        let channelId, title, avatar, subscriberCountText, videoCountText, tvBanner, mobileBanner, banner;
        const { c4TabbedHeaderRenderer, pageHeaderRenderer } = data.header;
        const metadata = data.metadata?.channelMetadataRenderer;
        const microformat = data.microformat?.microformatDataRenderer;
        if (c4TabbedHeaderRenderer) {
            channelId = c4TabbedHeaderRenderer.channelId;
            title = c4TabbedHeaderRenderer.title;
            subscriberCountText = c4TabbedHeaderRenderer.subscriberCountText?.simpleText;
            videoCountText = c4TabbedHeaderRenderer?.videosCountText?.runs?.[0]?.text;
            avatar = c4TabbedHeaderRenderer.avatar?.thumbnails;
            tvBanner = c4TabbedHeaderRenderer?.tvBanner?.thumbnails;
            mobileBanner = c4TabbedHeaderRenderer?.mobileBanner?.thumbnails;
            banner = c4TabbedHeaderRenderer?.banner?.thumbnails;
            target.channelHandle = c4TabbedHeaderRenderer.channelHandleText?.runs[0]?.text || null;
        }
        else {
            channelId =
                data.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.endpoint
                    .browseEndpoint?.browseId;
            title = pageHeaderRenderer.pageTitle;
            const { metadata, image: imageModel, banner: bannerModel, } = pageHeaderRenderer?.content?.pageHeaderViewModel;
            const metadataRow = metadata.contentMetadataViewModel.metadataRows[1];
            subscriberCountText = metadataRow.metadataParts.find((m) => !m.text.styeRuns).text.content;
            videoCountText = metadataRow.metadataParts.find((m) => m.text.styeRuns)
                ?.text.content;
            avatar = imageModel.decoratedAvatarViewModel.avatar.avatarViewModel.image.sources;
            banner = bannerModel?.imageBannerViewModel.image.sources;
            const channelHandle = metadata.contentMetadataViewModel.metadataRows[0]?.text?.content;
            if (channelHandle && channelHandle?.includes('@')) {
                target.channelHandle = channelHandle;
            }
        }
        target.id = channelId;
        target.name = title;
        target.thumbnails = new common_1.Thumbnails().load(avatar);
        target.videoCount = videoCountText;
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
            const shelfRenderer = rawShelf.itemSectionRenderer?.contents[0].shelfRenderer;
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
                subtitle: subtitle?.simpleText,
                items,
            };
            shelves.push(shelf);
        }
        return shelves;
    }
}
exports.ChannelParser = ChannelParser;
