"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoParser = void 0;
const common_1 = require("../../common");
const BaseVideo_1 = require("../BaseVideo");
const Comment_1 = require("../Comment");
class VideoParser {
    static loadVideo(target, data) {
        var _a, _b, _c, _d;
        const videoInfo = BaseVideo_1.BaseVideoParser.parseRawData(data);
        if (videoInfo.isDeleted) {
            target.isDeleted = true;
            return target;
        }
        else if (videoInfo.isError) {
            target.isError = true;
            return target;
        }
        target.duration = +videoInfo.videoDetails.lengthSeconds;
        const itemSectionRenderer = (_a = data.response.contents.twoColumnWatchNextResults.results.results.contents
            .reverse()
            .find((c) => c.itemSectionRenderer)) === null || _a === void 0 ? void 0 : _a.itemSectionRenderer;
        for (const content of data.response.contents.twoColumnWatchNextResults.results.results.contents) {
            if (content.itemSectionRenderer && content.itemSectionRenderer.contents) {
                for (const c of content.itemSectionRenderer.contents) {
                    if (c.commentsEntryPointHeaderRenderer) {
                        target.commentCount = ((_b = c.commentsEntryPointHeaderRenderer.commentCount) === null || _b === void 0 ? void 0 : _b.simpleText) || null;
                    }
                }
            }
        }
        target.comments.continuation = common_1.getContinuationFromItems((itemSectionRenderer === null || itemSectionRenderer === void 0 ? void 0 : itemSectionRenderer.contents) || []);
        const chapters = (_d = (_c = data[3].response.playerOverlays.playerOverlayRenderer.decoratedPlayerBarRenderer) === null || _c === void 0 ? void 0 : _c.decoratedPlayerBarRenderer.playerBar.multiMarkersPlayerBarRenderer.markersMap) === null || _d === void 0 ? void 0 : _d[0].value.chapters;
        target.chapters =
            (chapters === null || chapters === void 0 ? void 0 : chapters.map(({ chapterRenderer: c }) => ({
                title: c.title.simpleText,
                start: c.timeRangeStartMillis,
                thumbnails: new common_1.Thumbnails().load(c.thumbnail.thumbnails),
            }))) || [];
        return target;
    }
    static parseComments(data, video) {
        const endpoints = data.onResponseReceivedEndpoints.at(-1);
        const continuationItems = (endpoints.reloadContinuationItemsCommand || endpoints.appendContinuationItemsAction).continuationItems;
        const comments = common_1.mapFilter(continuationItems, "commentThreadRenderer");
        return comments.map((c) => new Comment_1.Comment({ video, client: video.client }).load(c));
    }
    static parseCommentContinuation(data) {
        const endpoints = data.onResponseReceivedEndpoints.at(-1);
        const continuationItems = (endpoints.reloadContinuationItemsCommand || endpoints.appendContinuationItemsAction).continuationItems;
        return common_1.getContinuationFromItems(continuationItems);
    }
}
exports.VideoParser = VideoParser;
