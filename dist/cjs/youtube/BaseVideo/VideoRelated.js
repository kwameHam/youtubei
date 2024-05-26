"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoRelated = void 0;
const Continuable_1 = require("../Continuable");
const constants_1 = require("../constants");
const BaseVideoParser_1 = require("./BaseVideoParser");
/**
 * {@link Continuable} of related videos inside a Video
 */
class VideoRelated extends Continuable_1.Continuable {
    /** @hidden */
    constructor({ video, client }) {
        super({ client });
        this.video = video;
    }
    async fetch() {
        const response = await this.client.http.post(`${constants_1.I_END_POINT}/next`, {
            data: { continuation: this.continuation },
        });
        const items = BaseVideoParser_1.BaseVideoParser.parseRelated(response.data, this.client);
        const continuation = BaseVideoParser_1.BaseVideoParser.parseContinuation(response.data);
        return {
            continuation,
            items,
        };
    }
}
exports.VideoRelated = VideoRelated;
