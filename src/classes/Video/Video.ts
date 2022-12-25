import { YoutubeRawData } from "../../common";
import { BaseVideo, BaseVideoProperties } from "../BaseVideo";
import { Thumbnails } from "../Thumbnails";
import { Transcript } from "../Transcript";
import { VideoComments } from "./VideoComments";
import { VideoParser } from "./VideoParser";

export type Chapter = {
	title: string;
	start: number;
	thumbnails: Thumbnails;
};

/** @hidden */
interface VideoProperties extends BaseVideoProperties {
	duration?: number;
	comments?: VideoComments;
	chapters?: Chapter[];
}

/** Represents a Video, usually returned from `client.getVideo()`  */
export class Video extends BaseVideo implements VideoProperties {
	/** The duration of this video in second */
	duration!: number;
	/** Chapters on this video if exists */
	chapters!: Chapter[];
	/** {@link Continuable} of videos inside a {@link Video} */
	comments: VideoComments;

	/** @hidden */
	constructor(attr: VideoProperties) {
		super(attr);
		Object.assign(this, attr);

		this.comments = new VideoComments({ client: attr.client, video: this });
	}

	/**
	 * Load this instance with raw data from Youtube
	 *
	 * @hidden
	 */
	load(data: YoutubeRawData): Video {
		super.load(data);
		VideoParser.loadVideo(this, data);
		return this;
	}

	/**
	 * Get Video transcript (if exists)
	 *
	 * Equivalent to
	 * ```js
	 * client.getVideoTranscript(video.id);
	 * ```
	 */
	async getTranscript(): Promise<Transcript[] | undefined> {
		return this.client.getVideoTranscript(this.id);
	}
}
