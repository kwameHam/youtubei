"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoCompactParser = void 0;
const common_1 = require("../../common");
const BaseChannel_1 = require("../BaseChannel");
class VideoCompactParser {
    static loadVideoCompact(target, data) {
        const { videoId, title, headline, lengthText, thumbnail, ownerText, shortBylineText, publishedTimeText, viewCountText, badges, thumbnailOverlays, channelThumbnailSupportedRenderers, detailedMetadataSnippets, } = data;
        target.id = videoId;
        target.title = headline
            ? headline.simpleText
            : title.simpleText || title.runs?.[0]?.text || "";
        target.thumbnails = new common_1.Thumbnails().load(thumbnail.thumbnails);
        target.uploadDate = publishedTimeText?.simpleText;
        target.description =
            detailedMetadataSnippets?.[0].snippetText.runs
                ?.map((r) => r.text)
                .join("") || "";
        target.duration =
            common_1.getDuration(lengthText?.simpleText ||
                thumbnailOverlays?.[0].thumbnailOverlayTimeStatusRenderer?.text.simpleText ||
                "") || null;
        target.isLive =
            !!(badges?.[0].metadataBadgeRenderer.style === "BADGE_STYLE_TYPE_LIVE_NOW") ||
                thumbnailOverlays?.[0].thumbnailOverlayTimeStatusRenderer?.style === "LIVE";
        target.isShort =
            thumbnailOverlays?.[0].thumbnailOverlayTimeStatusRenderer?.style === "SHORTS" || false;
        // Channel
        const browseEndpoint = (ownerText || shortBylineText)?.runs[0]?.navigationEndpoint
            ?.browseEndpoint;
        if (browseEndpoint) {
            const id = browseEndpoint.browseId;
            const thumbnails = channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer.thumbnail
                .thumbnails;
            target.channel = new BaseChannel_1.BaseChannel({
                id,
                name: (ownerText || shortBylineText).runs[0].text,
                thumbnails: thumbnails ? new common_1.Thumbnails().load(thumbnails) : undefined,
                client: target.client,
            });
        }
        target.viewCount = viewCountText?.simpleText || viewCountText?.runs[0].text;
        // target.viewCount = stripToInt(viewCountText?.simpleText || viewCountText?.runs[0].text);
        return target;
    }
    static loadLockupVideoCompact(target, data) {
        const lockupMetadataViewModel = data.metadata.lockupMetadataViewModel;
        const decoratedAvatarViewModel = lockupMetadataViewModel.image.decoratedAvatarViewModel;
        const thumbnailBadge = data.contentImage.thumbnailViewModel.overlays[0].thumbnailOverlayBadgeViewModel
            ?.thumbnailBadges[0].thumbnailBadgeViewModel;
        const metadataRows = lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows;
        const channel = new BaseChannel_1.BaseChannel({
            client: target.client,
            name: metadataRows[0].metadataParts[0].text.content,
            id: decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand
                .browseEndpoint.browseId,
            thumbnails: new common_1.Thumbnails().load(decoratedAvatarViewModel.avatar.avatarViewModel.image.sources),
        });
        const isLive = thumbnailBadge?.icon?.sources[0].clientResource.imageName === "LIVE";
        target.channel = channel;
        target.id = data.contentId;
        target.title = lockupMetadataViewModel.title.content;
        target.isLive = thumbnailBadge?.icon?.sources[0].clientResource.imageName === "LIVE";
        target.duration = !isLive && thumbnailBadge?.text ? common_1.getDuration(thumbnailBadge.text) : null;
        target.thumbnails = new common_1.Thumbnails().load(data.contentImage.thumbnailViewModel.image.sources);
        if (metadataRows[1])
            target.viewCount = common_1.stripToInt(metadataRows[1].metadataParts[0].text.content);
        target.uploadDate = !isLive
            ? metadataRows[1].metadataParts[metadataRows[1].metadataParts.length - 1].text.content
            : undefined;
        return target;
    }
}
exports.VideoCompactParser = VideoCompactParser;
