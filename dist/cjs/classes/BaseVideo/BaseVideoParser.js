"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseVideoParser = void 0;
const common_1 = require("../../common");
const BaseChannel_1 = require("../BaseChannel");
const PlaylistCompact_1 = require("../PlaylistCompact");
const Thumbnails_1 = require("../Thumbnails");
const VideoCompact_1 = require("../VideoCompact");
class BaseVideoParser {
    static loadBaseVideo(target, data) {
        var _a, _b, _c;
        const videoInfo = BaseVideoParser.parseRawData(data);
        // Basic information
        target.id = videoInfo.videoDetails.videoId;
        target.title = videoInfo.videoDetails.title;
        target.uploadDate = videoInfo.dateText.simpleText;
        target.viewCount = +videoInfo.videoDetails.viewCount || null;
        target.isLiveContent = videoInfo.videoDetails.isLiveContent;
        target.thumbnails = new Thumbnails_1.Thumbnails().load(videoInfo.videoDetails.thumbnail.thumbnails);
        // Channel
        const { title, thumbnail, subscriberCountText } = videoInfo.owner.videoOwnerRenderer;
        target.channel = new BaseChannel_1.BaseChannel({
            client: target.client,
            id: title.runs[0].navigationEndpoint.browseEndpoint.browseId,
            name: title.runs[0].text,
            subscriberCount: subscriberCountText === null || subscriberCountText === void 0 ? void 0 : subscriberCountText.simpleText,
            thumbnails: new Thumbnails_1.Thumbnails().load(thumbnail.thumbnails),
        });
        // Like Count and Dislike Count
        const topLevelButtons = videoInfo.videoActions.menuRenderer.topLevelButtons;
        target.likeCount = common_1.stripToInt(BaseVideoParser.parseButtonRenderer(topLevelButtons[0]));
        // Tags and description
        target.tags =
            ((_b = (_a = videoInfo.superTitleLink) === null || _a === void 0 ? void 0 : _a.runs) === null || _b === void 0 ? void 0 : _b.map((r) => r.text.trim()).filter((t) => t)) || [];
        target.description =
            ((_c = videoInfo.description) === null || _c === void 0 ? void 0 : _c.runs.map((d) => d.text).join("")) || "";
        // related videos
        const secondaryContents = data[3].response.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults
            .results;
        if (secondaryContents) {
            target.related.items = BaseVideoParser.parseRelatedFromSecondaryContent(secondaryContents, target.client);
            target.related.continuation = common_1.getContinuationFromItems(secondaryContents);
        }
        target.isShorts = (parseInt(videoInfo.videoDetails.lengthSeconds) <= 61 && videoInfo.formats && videoInfo.formats.height / videoInfo.formats.width > 1.1);
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
        const contents = data[3].response.contents.twoColumnWatchNextResults.results.results.contents;
        const primaryInfo = contents.find((c) => "videoPrimaryInfoRenderer" in c)
            .videoPrimaryInfoRenderer;
        const secondaryInfo = contents.find((c) => "videoSecondaryInfoRenderer" in c).videoSecondaryInfoRenderer;
        const videoDetails = data[2].playerResponse.videoDetails;
        const formats = (_b = (_a = data[2].playerResponse) === null || _a === void 0 ? void 0 : _a.streamingData) === null || _b === void 0 ? void 0 : _b.formats[0];
        return Object.assign(Object.assign(Object.assign({}, secondaryInfo), primaryInfo), { videoDetails, formats });
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
        var _a;
        const buttonRenderer = data.toggleButtonRenderer || data.buttonRenderer;
        const accessibilityData = (((_a = buttonRenderer.defaultText) === null || _a === void 0 ? void 0 : _a.accessibility) || buttonRenderer.accessibilityData).accessibilityData;
        return accessibilityData === null || accessibilityData === void 0 ? void 0 : accessibilityData.label;
    }
}
exports.BaseVideoParser = BaseVideoParser;
