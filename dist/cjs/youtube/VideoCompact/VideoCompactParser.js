"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoCompactParser = void 0;
const common_1 = require("../../common");
const BaseChannel_1 = require("../BaseChannel");
class VideoCompactParser {
    static loadVideoCompact(target, data) {
        const { videoId, title, headline, lengthText, thumbnail, ownerText, shortBylineText, publishedTimeText, viewCountText, badges, thumbnailOverlays, channelThumbnailSupportedRenderers, detailedMetadataSnippets, upcomingEventData, } = data;
        target.id = videoId;
        target.title = headline
            ? headline.simpleText
            : title.simpleText || title.runs?.[0]?.text || "";
        target.thumbnails = new common_1.Thumbnails().load(thumbnail?.thumbnails || []);
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
        // Scheduled premieres / upcoming livestreams: viewCountText (when present at
        // all) holds schedule text rather than a count — never store it as views.
        target.isUpcoming = !!upcomingEventData;
        if (upcomingEventData) {
            const startTime = new Date(+upcomingEventData.startTime * 1000);
            if (!isNaN(startTime.getTime()))
                target.upcomingDate = startTime;
        }
        else {
            target.viewCount = viewCountText?.simpleText || viewCountText?.runs?.[0]?.text;
            // target.viewCount = stripToInt(viewCountText?.simpleText || viewCountText?.runs[0].text);
        }
        return target;
    }
    static loadLockupVideoCompact(target, data) {
        const lockupMetadataViewModel = data.metadata.lockupMetadataViewModel;
        // Channel avatar is present in search/related lockups, but NOT in channel-tab
        // video lockups (we're already on the channel page).
        const decoratedAvatarViewModel = lockupMetadataViewModel.image?.decoratedAvatarViewModel;
        const avatarStackViewModel = lockupMetadataViewModel.image?.avatarStackViewModel;
        const thumbnailViewModel = data.contentImage.thumbnailViewModel;
        // Collect EVERY badge across all overlays — members-only videos carry a
        // "Members only" badge NEXT TO the duration badge, so slot [0] alone would
        // read the wrong one and misfile an aired video as duration-less.
        const thumbnailBadges = (thumbnailViewModel.overlays || [])
            .flatMap((o) => [
            ...(o?.thumbnailBottomOverlayViewModel?.badges || []),
            ...(o?.thumbnailOverlayBadgeViewModel?.thumbnailBadges || []),
        ])
            .map((b) => b?.thumbnailBadgeViewModel)
            .filter((b) => b);
        const metadataRows = lockupMetadataViewModel.metadata?.contentMetadataViewModel?.metadataRows || [];
        // With an avatar the first row is the channel name, and views/date live in row 2.
        // Without an avatar (channel tab) the first row already holds views/date.
        if (decoratedAvatarViewModel) {
            target.channel = new BaseChannel_1.BaseChannel({
                client: target.client,
                name: metadataRows[0]?.metadataParts?.[0]?.text?.content,
                id: decoratedAvatarViewModel.rendererContext?.commandContext?.onTap
                    ?.innertubeCommand?.browseEndpoint?.browseId,
                thumbnails: new common_1.Thumbnails().load(decoratedAvatarViewModel.avatar?.avatarViewModel?.image?.sources || []),
            });
        }
        else if (avatarStackViewModel) {
            // Collaboration video with multiple channels (upstream 1.8.16)
            const listItems = avatarStackViewModel.rendererContext?.commandContext?.onTap?.innertubeCommand
                ?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel
                ?.customContent?.listViewModel?.listItems;
            if (listItems?.length) {
                const channels = listItems.map((item) => {
                    const listItem = item.listItemViewModel;
                    return new BaseChannel_1.BaseChannel({
                        client: target.client,
                        id: listItem?.rendererContext?.commandContext?.onTap?.innertubeCommand
                            ?.browseEndpoint?.browseId,
                        name: listItem?.title?.content,
                        thumbnails: new common_1.Thumbnails().load(listItem?.leadingAccessory?.avatarViewModel?.image?.sources || []),
                    });
                });
                target.channel = channels[0];
                target.channels = channels.slice(1);
            }
        }
        const isLive = thumbnailBadges.some((b) => b?.icon?.sources?.[0]?.clientResource?.imageName === "LIVE" ||
            b?.badgeStyle?.includes?.("LIVE") ||
            b?.text === "LIVE");
        target.id = data.contentId;
        target.title = lockupMetadataViewModel.title?.content;
        target.isLive = isLive;
        // Lockups don't distinguish shorts (shorts tabs use their own view model);
        // set the boolean anyway so both parse paths honor the field's type.
        target.isShort = false;
        // An aired video's duration badge is a timestamp ("4:37", "1:00:08"); a
        // scheduled premiere or upcoming livestream has none — only a localized word
        // badge ("Upcoming"/"Anstehend") that must never parse as a duration.
        const durationBadge = !isLive
            ? thumbnailBadges.find((b) => /^\d+(:\d+)+$/.test((b?.text || "").trim()))
            : undefined;
        target.duration = durationBadge ? common_1.getDuration(durationBadge.text.trim()) : null;
        target.thumbnails = new common_1.Thumbnails().load(thumbnailViewModel.image?.sources || []);
        // An ENGLISH view-count part, anchored so channel names like "Tech Reviews" or
        // "Interview Highlights" can never match ("view" is a substring of both).
        // Other locales ("Aufrufe", "visualizações") are handled positionally below.
        const isViewCountText = (text) => /^(?:no|\d[\d.,\s]*[kmb]?)\s+views?$/i.test(text.trim());
        // The views/date (or schedule) row: prefer a row with an explicit view-count
        // part — searched from the END, since channel-name rows (search avatars,
        // collab videos, which on channel tabs carry an EMPTY image object) always
        // precede it — otherwise fall back to the last row.
        const infoRow = [...metadataRows]
            .reverse()
            .find((r) => r?.metadataParts?.some((p) => isViewCountText(p?.text?.content || ""))) || metadataRows[metadataRows.length - 1];
        const infoParts = infoRow?.metadataParts || [];
        const viewPart = infoParts.find((p) => isViewCountText(p?.text?.content || ""));
        // Unaired premieres/upcoming livestreams show their scheduled start where an
        // aired video shows views + upload date: a single metadata part like
        // "Premieres 8/31/26, 4:00 PM" / "Premiere am 31.08.26, 16:00" and no duration
        // badge. Stripping that part to digits (823161600...) is NOT a view count.
        target.isUpcoming =
            !isLive && target.duration === null && !viewPart && infoParts.length === 1;
        if (target.isUpcoming) {
            // No views exist yet; expose the raw localized schedule text instead.
            target.upcomingText = infoParts[0]?.text?.content;
            target.uploadDate = undefined;
        }
        else {
            // With both views and date present the views come first (positional rule
            // for non-English locales). Keep the RAW STRING like loadVideoCompact does —
            // stripToInt collapses abbreviated counts ("1.2M views" -> 12); the
            // consumer parses the text.
            const countPart = viewPart || (infoParts.length >= 2 ? infoParts[0] : undefined);
            if (countPart?.text?.content)
                target.viewCount = countPart.text.content;
            // The date is the last part, but never reuse the part already taken as the
            // count (a views-only single-part row must not masquerade as a date).
            const datePart = infoParts[infoParts.length - 1];
            target.uploadDate =
                !isLive && datePart && datePart !== countPart
                    ? datePart?.text?.content
                    : undefined;
        }
        return target;
    }
}
exports.VideoCompactParser = VideoCompactParser;
