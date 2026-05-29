"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelParser = void 0;
const common_1 = require("../../common");
const BaseChannel_1 = require("../BaseChannel");
const PlaylistCompact_1 = require("../PlaylistCompact");
const VideoCompact_1 = require("../VideoCompact");
class ChannelParser {
    static loadChannel(target, data) {
        // Request-level error (e.g. malformed channel id -> HTTP 400)
        if (data.error) {
            target.apiDataQuality = "error";
            target.unavailableReason = data.error.message || "request error";
            target.unavailableType = "error";
            return target;
        }
        // Channel does not exist / terminated -> surfaced as an ERROR alert
        const alert = data.alerts?.find((a) => a.alertRenderer || a.alertWithButtonRenderer);
        const alertRenderer = alert?.alertRenderer || alert?.alertWithButtonRenderer;
        if (alertRenderer?.type === "ERROR") {
            const reason = alertRenderer.text?.simpleText ||
                alertRenderer.text?.runs?.map((r) => r.text).join("") ||
                "channel unavailable";
            target.apiDataQuality = "unavailable";
            target.unavailableReason = reason;
            target.unavailableType = ChannelParser.classifyUnavailable(reason);
            return target;
        }
        let channelId, title, handle, description, avatar, subscriberCountText, videoCountText, tvBanner, mobileBanner, banner;
        const { c4TabbedHeaderRenderer, pageHeaderRenderer, carouselHeaderRenderer } = data.header || {};
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
        else if (pageHeaderRenderer) {
            channelId =
                data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.endpoint
                    ?.browseEndpoint?.browseId;
            title = pageHeaderRenderer?.pageTitle;
            // Auto-generated / topic / music channels have neither c4TabbedHeaderRenderer
            // nor a standard pageHeaderViewModel. Guard so parsing never throws.
            const pageHeaderViewModel = pageHeaderRenderer?.content?.pageHeaderViewModel;
            const vmMetadata = pageHeaderViewModel?.metadata;
            const imageModel = pageHeaderViewModel?.image;
            const bannerModel = pageHeaderViewModel?.banner;
            const descriptionModel = pageHeaderViewModel?.description;
            const metadataParts = (vmMetadata?.contentMetadataViewModel?.metadataRows || [])
                .map((m) => m.metadataParts)
                .flat()
                .filter((m) => m);
            const handlePart = metadataParts.find((m) => m.text?.styleRuns?.some((s) => "weightLabel" in s));
            const subscriberCountPart = metadataParts.find((m) => m.accessibilityLabel);
            const videoCountPart = metadataParts.find((m) => m.text?.styleRuns?.some((s) => "startIndex" in s));
            handle = handlePart?.text?.content;
            videoCountText = videoCountPart?.text?.content;
            subscriberCountText = subscriberCountPart?.text?.content;
            avatar = imageModel?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources;
            banner = bannerModel?.imageBannerViewModel?.image?.sources;
            description = descriptionModel?.descriptionPreviewViewModel?.description?.content;
            const channelHandle = vmMetadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts?.[0]?.text?.content;
            if (channelHandle && channelHandle?.includes('@')) {
                target.channelHandle = channelHandle;
            }
        }
        else if (carouselHeaderRenderer) {
            // Topic / auto-generated channels (e.g. "Sports", "Music") expose their
            // data under a carouselHeaderRenderer -> topicChannelDetailsRenderer.
            const details = carouselHeaderRenderer.contents?.find((c) => c.topicChannelDetailsRenderer)?.topicChannelDetailsRenderer;
            const subBtn = details?.subscribeButton?.subscribeButtonRenderer;
            channelId = subBtn?.channelId;
            title = details?.title?.simpleText || details?.title?.runs?.[0]?.text;
            subscriberCountText =
                details?.subtitle?.simpleText || subBtn?.subscriberCountText?.simpleText;
            avatar = details?.avatar?.thumbnails;
        }
        target.id = channelId || metadata?.externalId;
        target.name = title || metadata?.title;
        target.handle = handle;
        target.description = description;
        target.thumbnails = new common_1.Thumbnails().load(avatar || metadata?.avatar?.thumbnails || []);
        target.videoCount = videoCountText;
        target.subscriberCount = subscriberCountText;
        target.channelLink = metadata?.ownerUrls?.[0] || null;
        target.channelTags = microformat?.tags || [];
        target.description = metadata?.description || microformat?.description || description || null;
        target.banner = new common_1.Thumbnails().load(banner || []);
        target.tvBanner = new common_1.Thumbnails().load(tvBanner || []);
        target.mobileBanner = new common_1.Thumbnails().load(mobileBanner || []);
        target.shelves = ChannelParser.parseShelves(target, data);
        if (!target.channelLink && target.channelHandle) {
            target.channelLink = 'http://www.youtube.com/' + target.channelHandle;
        }
        // Classify the kind of channel page YouTube returned so consumers can
        // distinguish a regular creator from auto-generated/topic/storefront pages.
        if (carouselHeaderRenderer) {
            // Topic / auto-generated channels (e.g. "Music", "Sports", "Gaming").
            target.channelType = "topic";
        }
        else if (typeof target.id === "string" && target.id.startsWith("FE")) {
            // Feed/storefront pages (e.g. "Movies & TV" -> FEstorefront).
            target.channelType = "storefront";
        }
        else if (c4TabbedHeaderRenderer || pageHeaderRenderer) {
            target.channelType = "standard";
        }
        else {
            target.channelType = "unknown";
        }
        // Classify data completeness so consumers can decide how to handle it.
        if (target.subscriberCount || target.videoCount) {
            target.apiDataQuality = "full";
        }
        else if (target.id || target.name) {
            // Channel exists (auto-generated / topic / music) but lacks standard metadata.
            target.apiDataQuality = "partial";
        }
        // Otherwise leave undefined: a scenario we haven't classified yet.
        return target;
    }
    /** Map a YouTube ERROR alert message to a structured unavailable reason. */
    static classifyUnavailable(reason) {
        const text = (reason || "").toLowerCase();
        if (text.includes("does not exist") || text.includes("not exist") || text.includes("isn't available")) {
            return "nonexistent";
        }
        if (text.includes("terminated") || text.includes("violation") || text.includes("policy")) {
            return "terminated";
        }
        if (text.includes("removed") || text.includes("no longer available")) {
            return "removed";
        }
        return "unavailable";
    }
    static parseShelves(target, data) {
        const shelves = [];
        const rawShelves = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content
            ?.sectionListRenderer?.contents;
        if (!rawShelves)
            return shelves;
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
                title: title.simpleText || title.runs[0].text,
                subtitle: subtitle?.simpleText,
                items,
            };
            shelves.push(shelf);
        }
        return shelves;
    }
}
exports.ChannelParser = ChannelParser;
