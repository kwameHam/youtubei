"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaylistCompact = void 0;
const Base_1 = require("../Base");
const PlaylistCompactParser_1 = require("./PlaylistCompactParser");
/** Represents a Compact Playlist (e.g. from search result, related of a video) */
class PlaylistCompact extends Base_1.Base {
    /** @hidden */
    constructor(attr) {
        super(attr.client);
        Object.assign(this, attr);
    }
    /**
     * Load this instance with raw data from Youtube
     *
     * @hidden
     */
    load(data) {
        PlaylistCompactParser_1.PlaylistCompactParser.loadPlaylistCompact(this, data);
        return this;
    }
    /**
     * Get {@link Playlist} object based on current playlist id
     *
     * Equivalent to
     * ```js
     * client.getPlaylist(playlistCompact.id);
     * ```
     */
    async getPlaylist() {
        return await this.client.getPlaylist(this.id);
    }
}
exports.PlaylistCompact = PlaylistCompact;
