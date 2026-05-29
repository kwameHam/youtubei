"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseVideoParser = void 0;
const common_1 = require("../../common");
const BaseChannel_1 = require("../BaseChannel");
const PlaylistCompact_1 = require("../PlaylistCompact");
const VideoCompact_1 = require("../VideoCompact");
const VideoCaptions_1 = require("./VideoCaptions");
class BaseVideoParser {
    static loadBaseVideo(target, data) {
        const videoInfo = BaseVideoParser.parseRawData(data);
        if (videoInfo?.isDeleted) {
            target.isDeleted = true;
            return target;
        }
        else if (videoInfo?.isError) {
            target.isError = true;
            return target;
        }
        // Basic information
        target.id = videoInfo.currentVideoEndpoint?.watchEndpoint?.videoId;
        target.title =
            videoInfo.playerOverlays?.playerOverlayRenderer?.videoDetails?.playerOverlayVideoDetailsRenderer?.title?.simpleText;
        target.viewCount =
            common_1.stripToInt(videoInfo.viewCount?.videoViewCountRenderer?.viewCount?.simpleText) || null;
        target.isLiveContent = !!videoInfo.videoDetails?.isLiveContent; // TODO remove dependence on player data
        target.uploadDate = videoInfo.dateText?.simpleText;
        target.formats = videoInfo.streamingData?.formats || [];
        target.adaptiveFormats = videoInfo.streamingData?.adaptiveFormats || [];
        if (videoInfo?.videoDetails) {
            target.id = videoInfo?.videoDetails?.videoId;
            target.title = videoInfo?.videoDetails?.title;
            target.viewCount = +videoInfo?.videoDetails?.viewCount || null;
            target.keywords = videoInfo?.videoDetails?.keywords || null;
            target.isLiveContent = videoInfo?.videoDetails?.isLiveContent;
        }
        else {
            try {
                target.title = videoInfo?.title?.runs[0]?.text;
                target.viewCount = videoInfo.viewCount?.videoViewCountRenderer?.viewCount?.simpleText || null;
            }
            catch (err) {
                //
            }
        }
        target.thumbnails = new common_1.Thumbnails().load(videoInfo?.videoDetails?.thumbnail?.thumbnails || common_1.getThumbnailFromId(target.id));
        if (videoInfo?.microformat) {
            target.uploadDate = videoInfo?.microformat?.uploadDate || videoInfo?.dateText?.simpleText;
            target.publishDate = videoInfo?.microformat?.publishDate || null;
            target.category = videoInfo?.microformat?.category || null;
            target.isFamilySafe = videoInfo?.microformat?.isFamilySafe || null;
        }
        else {
            target.publishDate = videoInfo?.dateText?.simpleText || videoInfo?.relativeDateText?.simpleText || null;
        }
        // Channel
        const { title, thumbnail, subscriberCountText } = videoInfo?.owner?.videoOwnerRenderer || {};
        if (title) {
            target.channel = new BaseChannel_1.BaseChannel({
                client: target.client,
                id: title.runs[0].navigationEndpoint.browseEndpoint.browseId,
                name: title.runs[0].text,
                subscriberCount: subscriberCountText?.simpleText,
                thumbnails: new common_1.Thumbnails().load(thumbnail.thumbnails),
            });
        }
        if (videoInfo?.owner?.videoOwnerRenderer?.attributedTitle) {
            const channelsData = videoInfo.owner.videoOwnerRenderer.attributedTitle.commandRuns[0].onTap
                .innertubeCommand.showDialogCommand.panelLoadingStrategy.inlineContent
                .dialogViewModel.customContent.listViewModel.listItems;
            const avatarsData = videoInfo.owner.videoOwnerRenderer.avatarStack.avatarStackViewModel.avatars;
            target.channels = channelsData.map((c, i) => {
                const viewModel = c.listItemViewModel;
                const thumbnail = avatarsData[i].avatarViewModel.image.sources;
                return new BaseChannel_1.BaseChannel({
                    client: target.client,
                    id: viewModel.title.commandRuns[0].onTap.innertubeCommand.browseEndpoint
                        .browseId,
                    name: viewModel.title.content,
                    subscriberCount: viewModel.subtitle.content,
                    thumbnails: new common_1.Thumbnails().load(thumbnail),
                });
            });
        }
        // Like Count and Dislike Count
        const topLevelButtons = videoInfo.videoActions.menuRenderer.topLevelButtons;
        target.likeCount = topLevelButtons
            ? common_1.stripToInt(BaseVideoParser.parseButtonRenderer(topLevelButtons[0]))
            : null;
        // Tags and description
        target.tags =
            videoInfo?.superTitleLink?.runs
                ?.map((r) => r.text.trim())
                .filter((t) => t) || [];
        target.description =
            videoInfo?.videoDetails?.shortDescription ||
                videoInfo?.attributedDescription?.content ||
                videoInfo?.microformat?.description?.simpleText ||
                videoInfo?.description?.runs?.map((d) => d.text).join("") ||
                "";
        // related videos
        // const secondaryContents = data.response.contents.twoColumnWatchNextResults.secondaryResults?.secondaryResults.results.find(
        // 	(s: YoutubeRawData) => s.itemSectionRenderer
        // ).itemSectionRenderer.contents;
        let secondaryContents = data.response.contents.twoColumnWatchNextResults?.secondaryResults?.secondaryResults
            ?.results;
        const itemSectionRenderer = secondaryContents?.find((c) => {
            return c.itemSectionRenderer;
        })?.itemSectionRenderer;
        if (itemSectionRenderer)
            secondaryContents = itemSectionRenderer.contents;
        if (secondaryContents) {
            target.related.items = BaseVideoParser.parseRelatedFromSecondaryContent(secondaryContents, target.client);
            target.related.continuation = common_1.getContinuationFromItems(secondaryContents);
        }
        // captions
        if (videoInfo?.captions) {
            target.captions = new VideoCaptions_1.VideoCaptions({ client: target.client, video: target }).load(videoInfo?.captions.playerCaptionsTracklistRenderer);
        }
        return target;
    }
    static parseRelated(data, client) {
        const secondaryContents = data.onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems;
        return BaseVideoParser.parseRelatedFromSecondaryContent(secondaryContents, client);
    }
    static parseContinuation(data) {
        const secondaryContents = data.onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems;
        return common_1.getContinuationFromItems(secondaryContents);
    }
    static parseRawData(data) {
        // Deleted / errored videos may have no watch-next contents at all, so guard
        // every access and classify from playabilityStatus instead of throwing.
        const contents = data.response?.contents?.twoColumnWatchNextResults?.results?.results?.contents;
        const engagementPanelSectionListRenderer = data.response?.engagementPanels?.find((c) => "engagementPanelSectionListRenderer" in c);
        const videoPrimaryInfoRenderer = contents?.find((c) => "videoPrimaryInfoRenderer" in c);
        if (!videoPrimaryInfoRenderer) {
            const playabilityStatus = data.playerResponse?.playabilityStatus;
            if (playabilityStatus && playabilityStatus.status === "ERROR") {
                if (playabilityStatus.reason === "Video nicht verfügbar") {
                    return { isDeleted: true };
                }
                console.log('BaseVideoParser -> parseRawData error:', playabilityStatus.reason);
                return { isError: true };
            }
            // No primary info and no explicit error -> nothing parseable; mark as error
            // so callers can detect it rather than crashing on missing fields.
            return { isError: true };
        }
        const primaryInfo = videoPrimaryInfoRenderer.videoPrimaryInfoRenderer;
        const secondaryInfo = contents.find((c) => "videoSecondaryInfoRenderer" in c).videoSecondaryInfoRenderer;
        const { videoDetails, captions, streamingData } = data.playerResponse;
        const microformat = data.playerResponse?.microformat?.playerMicroformatRenderer;
        return {
            ...data.response,
            ...secondaryInfo,
            ...primaryInfo,
            videoDetails,
            captions,
            microformat,
            streamingData,
            engagementPanelSectionListRenderer,
        };
    }
    static parseCompactRenderer(data, client) {
        if ("compactVideoRenderer" in data) {
            return new VideoCompact_1.VideoCompact({ client }).load(data.compactVideoRenderer);
        }
        else if ("compactRadioRenderer" in data) {
            return new PlaylistCompact_1.PlaylistCompact({ client }).load(data.compactRadioRenderer);
        }
        else if ("lockupViewModel" in data) {
            // new data structure for related contents
            const type = data.lockupViewModel.contentType;
            if (type === "LOCKUP_CONTENT_TYPE_VIDEO") {
                return new VideoCompact_1.VideoCompact({ client }).loadLockup(data.lockupViewModel);
            }
            else if (type === "LOCKUP_CONTENT_TYPE_PLAYLIST") {
                return new PlaylistCompact_1.PlaylistCompact({ client }).loadLockup(data.lockupViewModel);
            }
        }
    }
    static parseRelatedFromSecondaryContent(secondaryContents, client) {
        return secondaryContents
            .map((c) => BaseVideoParser.parseCompactRenderer(c, client))
            .filter((c) => c !== undefined);
    }
    static parseButtonRenderer(data) {
        let likeCount;
        if (data.toggleButtonRenderer || data.buttonRenderer) {
            const buttonRenderer = data.toggleButtonRenderer || data.buttonRenderer;
            likeCount = (buttonRenderer.defaultText?.accessibility || buttonRenderer.accessibilityData).accessibilityData;
        }
        else if (data.segmentedLikeDislikeButtonRenderer) {
            const likeButton = data.segmentedLikeDislikeButtonRenderer.likeButton;
            const buttonRenderer = likeButton.toggleButtonRenderer || likeButton.buttonRenderer;
            likeCount = (buttonRenderer.defaultText?.accessibility || buttonRenderer.accessibilityData).accessibilityData;
        }
        else if (data.segmentedLikeDislikeButtonViewModel) {
            likeCount =
                data.segmentedLikeDislikeButtonViewModel.likeButtonViewModel.likeButtonViewModel
                    .toggleButtonViewModel.toggleButtonViewModel.defaultButtonViewModel
                    .buttonViewModel.accessibilityText;
        }
        return likeCount;
    }
}
exports.BaseVideoParser = BaseVideoParser;
