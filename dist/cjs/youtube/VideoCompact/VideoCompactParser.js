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
        // Channel
        if (ownerText || shortBylineText) {
            const browseEndpoint = (ownerText || shortBylineText).runs[0].navigationEndpoint
                .browseEndpoint;
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
        }
        target.viewCount = viewCountText?.simpleText || viewCountText?.runs[0].text;
        // target.viewCount = stripToInt(viewCountText?.simpleText || viewCountText?.runs[0].text);
        return target;
    }
}
exports.VideoCompactParser = VideoCompactParser;
