"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShortCompactParser = void 0;
const common_1 = require("../../common");
const Thumbnails_1 = require("../Thumbnails");
class ShortCompactParser {
    static loadVideoCompact(target, data) {
        var _a;
        const { videoId, headline, thumbnail, viewCountText, } = data;
        target.id = videoId;
        target.title = headline.simpleText || ((_a = headline.runs[0]) === null || _a === void 0 ? void 0 : _a.text);
        target.thumbnails = new Thumbnails_1.Thumbnails().load(thumbnail.thumbnails);
        target.viewCount = common_1.stripToInt((viewCountText === null || viewCountText === void 0 ? void 0 : viewCountText.simpleText) || (viewCountText === null || viewCountText === void 0 ? void 0 : viewCountText.runs[0].text));
        return target;
    }
}
exports.ShortCompactParser = ShortCompactParser;
