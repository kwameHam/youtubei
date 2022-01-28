"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ChannelCompact_1 = __importDefault(require("./ChannelCompact"));
const PlaylistCompact_1 = __importDefault(require("./PlaylistCompact"));
const Thumbnails_1 = __importDefault(require("./Thumbnails"));
const VideoCompact_1 = __importDefault(require("./VideoCompact"));
/**  Represents a Youtube Channel */
class Channel extends ChannelCompact_1.default {
    /** @hidden */
    constructor(channel = {}) {
        super();
        this.shelves = [];
        this.videos = [];
        this.playlists = [];
        Object.assign(this, channel);
    }
    /**
     * Load this instance with raw data from Youtube
     *
     * @hidden
     */
    load(data) {
        var _a, _b, _c, _d;
        const { channelId, title, avatar, subscriberCountText, } = data.header.c4TabbedHeaderRenderer;
        this.id = channelId;
        this.name = title;
        this.thumbnails = new Thumbnails_1.default().load(avatar.thumbnails);
        this.videoCount = 0; // data not available
        this.channelDescription = ((_b = (_a = data.metadata) === null || _a === void 0 ? void 0 : _a.channelMetadataRenderer) === null || _b === void 0 ? void 0 : _b.description) || null;
        this.subscriberCount = subscriberCountText && subscriberCountText.simpleText ? subscriberCountText.simpleText : 0;
        this.channelLink = ((_d = (_c = data.microformat) === null || _c === void 0 ? void 0 : _c.microformatDataRenderer) === null || _d === void 0 ? void 0 : _d.urlCanonical) || null;
        this.videos = [];
        this.playlists = [];
        // shelves
        const rawShelves = data.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content
            .sectionListRenderer.contents;
        for (const rawShelf of rawShelves) {
            const shelfRenderer = rawShelf.itemSectionRenderer.contents[0].shelfRenderer;
            if (!shelfRenderer)
                continue;
            const { title, content, subtitle } = shelfRenderer;
            if (!content.horizontalListRenderer)
                continue;
            const items = content.horizontalListRenderer.items
                .map((i) => {
                if (i.gridVideoRenderer)
                    return new VideoCompact_1.default({ client: this.client }).load(i.gridVideoRenderer);
                if (i.gridPlaylistRenderer)
                    return new PlaylistCompact_1.default({ client: this.client }).load(i.gridPlaylistRenderer);
                if (i.gridChannelRenderer)
                    return new ChannelCompact_1.default({ client: this.client }).load(i.gridChannelRenderer);
                return undefined;
            })
                .filter((i) => i !== undefined);
            const shelf = {
                title: title.runs[0].text,
                subtitle: subtitle === null || subtitle === void 0 ? void 0 : subtitle.simpleText,
                items,
            };
            this.shelves.push(shelf);
        }
        return this;
    }
}
exports.default = Channel;
