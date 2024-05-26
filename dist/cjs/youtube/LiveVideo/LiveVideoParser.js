"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveVideoParser = void 0;
const BaseVideo_1 = require("../BaseVideo");
class LiveVideoParser {
    static loadLiveVideo(target, data) {
        const videoInfo = BaseVideo_1.BaseVideoParser.parseRawData(data);
        target.watchingCount = +videoInfo.viewCount.videoViewCountRenderer.viewCount.runs
            .map((r) => r.text)
            .join(" ")
            .replace(/[^0-9]/g, "");
        target.chatContinuation =
            data.response.contents.twoColumnWatchNextResults.conversationBar.liveChatRenderer?.continuations[0].reloadContinuationData.continuation;
        return target;
    }
    static parseChats(data) {
        return (data.continuationContents.liveChatContinuation.actions?.flatMap((a) => a.addChatItemAction?.item.liveChatTextMessageRenderer || []) || []);
    }
    static parseContinuation(data) {
        const continuation = data.continuationContents.liveChatContinuation.continuations[0];
        const continuationData = continuation.timedContinuationData || continuation.invalidationContinuationData;
        return {
            timeout: continuationData.timeoutMs,
            continuation: continuationData.continuation,
        };
    }
}
exports.LiveVideoParser = LiveVideoParser;
