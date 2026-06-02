"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoParser = void 0;
const common_1 = require("../../common");
const BaseVideo_1 = require("../BaseVideo");
const Comment_1 = require("../Comment");
class VideoParser {
    static loadVideo(target, data) {
        const videoInfo = BaseVideo_1.BaseVideoParser.parseRawData(data);
        const mutations = videoInfo.frameworkUpdates?.entityBatchUpdate?.mutations;
        const lastMarkers = mutations
            ?.find((m) => m.payload?.macroMarkersListEntity)
            ?.payload.macroMarkersListEntity.markersList.markers.at(-1);
        if (videoInfo.isDeleted) {
            target.isDeleted = true;
            return target;
        }
        else if (videoInfo.isError) {
            target.isError = true;
            return target;
        }
        if (videoInfo.videoDetails)
            target.duration = +videoInfo.videoDetails.lengthSeconds;
        target.duration =
            +videoInfo.videoDetails?.lengthSeconds ||
                (lastMarkers ? (+lastMarkers.startMillis + +lastMarkers.durationMillis) / 1000 : 0);
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
        if (!target.commentCount && videoInfo.engagementPanelSectionListRenderer) {
            const header = videoInfo.engagementPanelSectionListRenderer.engagementPanelSectionListRenderer
                .header?.engagementPanelTitleHeaderRenderer;
            if ((videoInfo.engagementPanelSectionListRenderer.engagementPanelSectionListRenderer.panelIdentifier =
                "engagement-panel-comments-section" && header)) {
                target.commentCount =
                    header.contextualInfo?.runs && header.contextualInfo.runs.length > 0
                        ? header.contextualInfo.runs[0].text
                        : null;
            }
        }
        target.comments.continuation = common_1.getContinuationFromItems(itemSectionRenderer?.contents || []);
        const chapters = data.response.playerOverlays.playerOverlayRenderer.decoratedPlayerBarRenderer
            ?.decoratedPlayerBarRenderer.playerBar?.multiMarkersPlayerBarRenderer
            .markersMap?.[0].value.chapters;
        target.chapters =
            chapters?.map(({ chapterRenderer: c }) => ({
                title: c.title.simpleText,
                start: c.timeRangeStartMillis,
                thumbnails: new common_1.Thumbnails().load(c.thumbnail.thumbnails),
            })) || [];
        const musicPanel = data.response.engagementPanels?.find((e) => e.engagementPanelSectionListRenderer.content?.structuredDescriptionContentRenderer?.items.find((i) => i.horizontalCardListRenderer?.footerButton?.buttonViewModel.iconName === "MUSIC"));
        if (!musicPanel) {
            target.music = null;
        }
        else {
            const cards = musicPanel.engagementPanelSectionListRenderer.content.structuredDescriptionContentRenderer.items.find((i) => i.horizontalCardListRenderer?.footerButton?.buttonViewModel.iconName === "MUSIC").horizontalCardListRenderer.cards;
            const music = cards.find((i) => i.videoAttributeViewModel)
                .videoAttributeViewModel;
            target.music = {
                imageUrl: music.image.sources[0].url,
                title: music.title,
                artist: music.subtitle,
                album: music.secondarySubtitle?.content || null,
            };
        }
        // target.music =
        return target;
    }
    static parseComments(data, video) {
        // Videos with comments disabled / zero comments return a response without
        // the comment structures below, so guard every access and return [] instead
        // of throwing (a throw would abort comment collection for the whole video).
        const endpoints = data?.onResponseReceivedEndpoints?.find((c) => {
            return (c.appendContinuationItemsAction ||
                c.reloadContinuationItemsCommand?.slot === "RELOAD_CONTINUATION_SLOT_BODY");
        });
        const repliesContinuationItems = (endpoints?.reloadContinuationItemsCommand || endpoints?.appendContinuationItemsAction)?.continuationItems;
        const mutations = data?.frameworkUpdates?.entityBatchUpdate?.mutations;
        if (!Array.isArray(mutations))
            return [];
        const comments = mutations
            .filter((m) => m.payload?.commentEntityPayload)
            .map((m) => {
            const repliesItems = repliesContinuationItems?.find((r) => r.commentThreadRenderer?.commentViewModel?.commentKey === m.key)?.commentThreadRenderer;
            return {
                ...m.payload.commentEntityPayload,
                ...repliesItems,
            };
        });
        return comments.map((c) => new Comment_1.Comment({ video, client: video.client }).load(c));
    }
    static parseCommentContinuation(data) {
        const endpoints = data?.onResponseReceivedEndpoints?.at(-1);
        const continuationItems = (endpoints?.reloadContinuationItemsCommand || endpoints?.appendContinuationItemsAction)?.continuationItems;
        return common_1.getContinuationFromItems(continuationItems);
    }
}
exports.VideoParser = VideoParser;
