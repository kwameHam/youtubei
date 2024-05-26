"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentReplies = void 0;
const Continuable_1 = require("../Continuable");
const constants_1 = require("../constants");
const CommentParser_1 = require("./CommentParser");
/**
 * {@link Continuable} of replies inside a {@link Comment}
 */
class CommentReplies extends Continuable_1.Continuable {
    /** @hidden */
    constructor({ client, comment }) {
        super({ client, strictContinuationCheck: true });
        this.comment = comment;
    }
    async fetch() {
        const response = await this.client.http.post(`${constants_1.I_END_POINT}/next`, {
            data: { continuation: this.continuation },
        });
        const continuation = CommentParser_1.CommentParser.parseContinuation(response.data);
        const items = CommentParser_1.CommentParser.parseReplies(response.data, this.comment);
        return { continuation, items };
    }
}
exports.CommentReplies = CommentReplies;
