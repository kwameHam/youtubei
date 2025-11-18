"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostParser = void 0;
const BaseChannel_1 = require("../BaseChannel");
class PostParser {
    static loadPost(target, data) {
        const { postId, authorText, authorThumbnail, authorEndpoint, contentText, publishedTimeText, voteCount, } = data;
        // Basic information
        target.id = postId;
        target.content = contentText?.runs?.map((r) => r.text).join("");
        target.channel = new BaseChannel_1.BaseChannel({
            id: authorEndpoint?.browseEndpoint?.browseId,
            name: authorText.runs?.[0].text,
            thumbnails: authorThumbnail.thumbnails,
            client: target.client,
        });
        target.timestamp = publishedTimeText.runs[0]?.text;
        target.voteCount = voteCount.simpleText;
        return target;
    }
}
exports.PostParser = PostParser;
