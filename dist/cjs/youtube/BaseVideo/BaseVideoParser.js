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
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const videoInfo = BaseVideoParser.parseRawData(data);
        if (videoInfo.isDeleted) {
            target.isDeleted = true;
            return target;
        }
        else if (videoInfo.isError) {
            target.isError = true;
            return target;
        }
        // Basic information
        target.id = videoInfo.videoDetails.videoId;
        target.title = videoInfo.videoDetails.title;
        target.uploadDate = videoInfo.microformat.uploadDate || videoInfo.dateText.simpleText;
        target.publishDate = videoInfo.microformat.publishDate || null;
        target.viewCount = +videoInfo.videoDetails.viewCount || null;
        target.keywords = videoInfo.videoDetails.keywords || null;
        target.category = videoInfo.microformat.category || null;
        target.isFamilySafe = videoInfo.microformat.isFamilySafe || null;
        target.isLiveContent = videoInfo.videoDetails.isLiveContent;
        target.thumbnails = new common_1.Thumbnails().load(videoInfo.videoDetails.thumbnail.thumbnails);
        // Channel
        const { title, thumbnail, subscriberCountText } = videoInfo.owner.videoOwnerRenderer;
        target.channel = new BaseChannel_1.BaseChannel({
            client: target.client,
            id: title.runs[0].navigationEndpoint.browseEndpoint.browseId,
            name: title.runs[0].text,
            subscriberCount: subscriberCountText === null || subscriberCountText === void 0 ? void 0 : subscriberCountText.simpleText,
            thumbnails: new common_1.Thumbnails().load(thumbnail.thumbnails),
        });
        // Like Count and Dislike Count
        const topLevelButtons = videoInfo.videoActions.menuRenderer.topLevelButtons;
        target.likeCount = common_1.stripToInt(BaseVideoParser.parseButtonRenderer(topLevelButtons[0]));
        // Tags and description
        target.tags =
            ((_b = (_a = videoInfo.superTitleLink) === null || _a === void 0 ? void 0 : _a.runs) === null || _b === void 0 ? void 0 : _b.map((r) => r.text.trim()).filter((t) => t)) || [];
        target.description =
            videoInfo.videoDetails.shortDescription || ((_d = (_c = videoInfo.microformat) === null || _c === void 0 ? void 0 : _c.description) === null || _d === void 0 ? void 0 : _d.simpleText) || ((_e = videoInfo.description) === null || _e === void 0 ? void 0 : _e.runs.map((d) => d.text).join("")) || "";
        // related videos
        const secondaryContents = (_h = (_g = (_f = data.response.contents.twoColumnWatchNextResults) === null || _f === void 0 ? void 0 : _f.secondaryResults) === null || _g === void 0 ? void 0 : _g.secondaryResults) === null || _h === void 0 ? void 0 : _h.results;
        if (secondaryContents) {
            target.related.items = BaseVideoParser.parseRelatedFromSecondaryContent(secondaryContents, target.client);
            target.related.continuation = common_1.getContinuationFromItems(secondaryContents);
        }
        // captions
        if (videoInfo.captions) {
            target.captions = new VideoCaptions_1.VideoCaptions({ client: target.client, video: target }).load(videoInfo.captions.playerCaptionsTracklistRenderer);
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
        var _a, _b;
        const contents = data.response.contents.twoColumnWatchNextResults.results.results.contents;
        const videoPrimaryInfoRenderer = contents.find((c) => "videoPrimaryInfoRenderer" in c);
        if (!videoPrimaryInfoRenderer) {
            let playabilityStatus = data.playerResponse.playabilityStatus;
            if (playabilityStatus && playabilityStatus.status === "ERROR") {
                if (playabilityStatus.reason === "Video nicht verfügbar") {
                    return { isDeleted: true };
                }
                console.log('BaseVideoParser -> parseRawData error:', playabilityStatus.reason);
                return { isError: true };
            }
        }
        const primaryInfo = videoPrimaryInfoRenderer.videoPrimaryInfoRenderer;
        const secondaryInfo = contents.find((c) => "videoSecondaryInfoRenderer" in c).videoSecondaryInfoRenderer;
        const { videoDetails, captions } = data.playerResponse;
        const microformat = (_b = (_a = data.playerResponse) === null || _a === void 0 ? void 0 : _a.microformat) === null || _b === void 0 ? void 0 : _b.playerMicroformatRenderer;
        return Object.assign(Object.assign(Object.assign({}, secondaryInfo), primaryInfo), { videoDetails, captions, microformat });
        // const videoDetails = data.playerResponse.videoDetails;
        // const microformat = data.playerResponse.microformat.playerMicroformatRenderer;
        // return { ...secondaryInfo, ...primaryInfo, videoDetails, microformat };
    }
    static parseCompactRenderer(data, client) {
        if ("compactVideoRenderer" in data) {
            return new VideoCompact_1.VideoCompact({ client }).load(data.compactVideoRenderer);
        }
        else if ("compactRadioRenderer" in data) {
            return new PlaylistCompact_1.PlaylistCompact({ client }).load(data.compactRadioRenderer);
        }
    }
    static parseRelatedFromSecondaryContent(secondaryContents, client) {
        return secondaryContents
            .map((c) => BaseVideoParser.parseCompactRenderer(c, client))
            .filter((c) => c !== undefined);
    }
    static parseButtonRenderer(data) {
        var _a, _b;
        let likeCount;
        if (data.toggleButtonRenderer || data.buttonRenderer) {
            const buttonRenderer = data.toggleButtonRenderer || data.buttonRenderer;
            likeCount = (((_a = buttonRenderer.defaultText) === null || _a === void 0 ? void 0 : _a.accessibility) || buttonRenderer.accessibilityData).accessibilityData;
        }
        else if (data.segmentedLikeDislikeButtonRenderer) {
            const likeButton = data.segmentedLikeDislikeButtonRenderer.likeButton;
            const buttonRenderer = likeButton.toggleButtonRenderer || likeButton.buttonRenderer;
            likeCount = (((_b = buttonRenderer.defaultText) === null || _b === void 0 ? void 0 : _b.accessibility) || buttonRenderer.accessibilityData).accessibilityData;
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