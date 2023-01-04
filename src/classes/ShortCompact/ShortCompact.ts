import { YoutubeRawData } from "../../common";
import { Base, BaseProperties } from "../Base";
import { BaseChannel } from "../BaseChannel";
import { LiveVideo } from "../LiveVideo";
import { Thumbnails } from "../Thumbnails";
import { Transcript } from "../Transcript";
import { Video } from "../Video";
import { ShortCompactParser } from "./ShortCompactParser";

/** @hidden */
interface ShortCompactProperties extends BaseProperties {
    id?: string;
    title?: string;
    thumbnails?: Thumbnails;
    channel?: BaseChannel;
    viewCount?: number | null;
}

/** Represent a compact video (e.g. from search result, playlist's videos, channel's videos) */
export class ShortCompact extends Base implements ShortCompactProperties {
    id!: string;
    /** The title of the video */
    title!: string;
    /** Thumbnails of the video with different sizes */
    thumbnails!: Thumbnails;
    channel?: BaseChannel;
    /** How many view does this video have, null if the view count is hidden */
    viewCount?: number | null;

    /** @hidden */
    constructor(attr: ShortCompactProperties) {
        super(attr.client);
        Object.assign(this, attr);
    }

    /**
     * Load this instance with raw data from Youtube
     *
     * @hidden
     */
    load(data: YoutubeRawData): ShortCompact {
        ShortCompactParser.loadVideoCompact(this, data);
        return this;
    }

    /**
     * Get {@link Video} object based on current video id
     *
     * Equivalent to
     * ```js
     * client.getVideo(videoCompact.id);
     * ```
     */
    async getVideo<T extends Video | LiveVideo>(): Promise<T> {
        return await this.client.getVideo(this.id);
    }
}
