"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseChannelParser = void 0;
const common_1 = require("../../common");
class BaseChannelParser {
    static loadBaseChannel(target, data) {
        var _a, _b;
        const { channelId, title, thumbnail, videoCountText, subscriberCountText } = data;
        target.id = channelId;
        target.name = title.simpleText;
        target.thumbnails = new common_1.Thumbnails().load(thumbnail.thumbnails);
        target.videoCount = common_1.stripToInt((_a = videoCountText === null || videoCountText === void 0 ? void 0 : videoCountText.runs) === null || _a === void 0 ? void 0 : _a[0].text) || 0; // TODO this sometimes contains subscriber count for some reason
        target.subscriberCount = subscriberCountText === null || subscriberCountText === void 0 ? void 0 : subscriberCountText.simpleText;
        try {
            if (target.videoCount === 0 && ((_b = videoCountText === null || videoCountText === void 0 ? void 0 : videoCountText.simpleText) === null || _b === void 0 ? void 0 : _b.includes('subscribers'))) {
                target.videoCountWrong = videoCountText.simpleText;
            }
        }
        catch (e) {
        }
        return target;
    }
    /** Parse tab data from request, tab name is ignored if it's a continuation data */
    static parseTabData(name, data) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
        const tab = (_a = data.contents) === null || _a === void 0 ? void 0 : _a.twoColumnBrowseResultsRenderer.tabs.find((t) => {
            var _a;
            return (((_a = t.tabRenderer) === null || _a === void 0 ? void 0 : _a.endpoint.browseEndpoint.params) ===
                BaseChannelParser.TAB_TYPE_PARAMS[name]);
        });
        return (((_j = (_h = (_g = (_f = (_e = (_d = (_c = (_b = tab === null || tab === void 0 ? void 0 : tab.tabRenderer) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.sectionListRenderer) === null || _d === void 0 ? void 0 : _d.contents) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.itemSectionRenderer) === null || _g === void 0 ? void 0 : _g.contents[0]) === null || _h === void 0 ? void 0 : _h.gridRenderer) === null || _j === void 0 ? void 0 : _j.items) || ((_o = (_m = (_l = (_k = tab === null || tab === void 0 ? void 0 : tab.tabRenderer) === null || _k === void 0 ? void 0 : _k.content) === null || _l === void 0 ? void 0 : _l.richGridRenderer) === null || _m === void 0 ? void 0 : _m.contents) === null || _o === void 0 ? void 0 : _o.map((c) => { var _a; return ((_a = c === null || c === void 0 ? void 0 : c.richItemRenderer) === null || _a === void 0 ? void 0 : _a.content) || c; })) || ((_s = (_r = (_q = (_p = data.onResponseReceivedActions) === null || _p === void 0 ? void 0 : _p[0]) === null || _q === void 0 ? void 0 : _q.appendContinuationItemsAction) === null || _r === void 0 ? void 0 : _r.continuationItems) === null || _s === void 0 ? void 0 : _s.map((c) => { var _a; return ((_a = c === null || c === void 0 ? void 0 : c.richItemRenderer) === null || _a === void 0 ? void 0 : _a.content) || c; })) ||
            []);
    }
}
exports.BaseChannelParser = BaseChannelParser;
BaseChannelParser.TAB_TYPE_PARAMS = {
    videos: "EgZ2aWRlb3PyBgQKAjoA",
    shorts: "EgZzaG9ydHPyBgUKA5oBAA%3D%3D",
    live: "EgdzdHJlYW1z8gYECgJ6AA%3D%3D",
    playlists: "EglwbGF5bGlzdHPyBgQKAkIA",
};
