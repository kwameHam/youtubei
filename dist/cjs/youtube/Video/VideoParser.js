"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoParser = void 0;
const common_1 = require("../../common");
const BaseVideo_1 = require("../BaseVideo");
const Comment_1 = require("../Comment");
class VideoParser {
    static loadVideo(target, data) {
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
        const itemSectionRenderer = data.response.contents.twoColumnWatchNextResults.results.results.contents
            .reverse()
            .find((c) => c.itemSectionRenderer)?.itemSectionRenderer;
        for (const content of data.response.contents.twoColumnWatchNextResults.results.results.contents) {
            if (content.itemSectionRenderer && content.itemSectionRenderer.contents) {
                for (const c of content.itemSectionRenderer.contents) {
                    if (c.commentsEntryPointHeaderRenderer) {
                        target.commentCount = c.commentsEntryPointHeaderRenderer.commentCount?.simpleText || null;
                    }
                }
            }
        }
        target.comments.continuation = common_1.getContinuationFromItems(itemSectionRenderer?.contents || []);
        const chapters = data.response.playerOverlays.playerOverlayRenderer.decoratedPlayerBarRenderer
            ?.decoratedPlayerBarRenderer.playerBar.multiMarkersPlayerBarRenderer.markersMap?.[0]
            .value.chapters;
        target.chapters =
            chapters?.map(({ chapterRenderer: c }) => ({
                title: c.title.simpleText,
                start: c.timeRangeStartMillis,
                thumbnails: new common_1.Thumbnails().load(c.thumbnail.thumbnails),
            })) || [];
        return target;
    }
    static parseComments(data, video) {
        const comments = data.frameworkUpdates.entityBatchUpdate.mutations
            .filter((m) => m.payload.commentEntityPayload)
            .map((m) => m.payload.commentEntityPayload);
        return comments.map((c) => new Comment_1.Comment({ video, client: video.client }).load(c));
    }
    static parseCommentContinuation(data) {
        const endpoints = data.onResponseReceivedEndpoints.at(-1);
        const continuationItems = (endpoints.reloadContinuationItemsCommand || endpoints.appendContinuationItemsAction).continuationItems;
        return common_1.getContinuationFromItems(continuationItems);
    }
}
exports.VideoParser = VideoParser;
