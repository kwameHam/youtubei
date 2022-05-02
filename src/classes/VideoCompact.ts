import { getDuration, stripToInt, YoutubeRawData } from "../common";
import { Base, ChannelCompact, Thumbnails, BaseAttributes, Video, LiveVideo } from ".";

/** @hidden */
interface VideoCompactAttributes extends BaseAttributes {
	title: string;
	thumbnails: Thumbnails;
	duration: number | null;
	isLive: boolean;
	channel?: ChannelCompact;
	uploadDate?: string;
	viewCount?: number | null;
}

/** Represent a compact video (e.g. from search result, playlist's videos, channel's videos) */
export default class VideoCompact extends Base implements VideoCompactAttributes {
	/** The title of the video */
	title!: string;
	/** Thumbnails of the video with different sizes */
	thumbnails!: Thumbnails;
	/** Description of the video (not a full description, rather a preview / snippet) */
	description!: string;
	/** The duration of this video in second, null if the video is live */
	duration!: number | null;
	/** Whether this video is a live now or not */
	isLive!: boolean;
	/** The channel who uploads this video */
	channel?: ChannelCompact;
	/** The date this video is uploaded at */
	uploadDate?: string;
	/** How many view does this video have, null if the view count is hidden */
	viewCount?: number | null;

	/** @hidden */
	constructor(videoCompact: Partial<VideoCompactAttributes> = {}) {
		super();
		Object.assign(this, videoCompact);
	}

	/** Whether this video is private / deleted or not, only useful in playlist's videos */
	get isPrivateOrDeleted(): boolean {
		return !this.duration;
	}

	/**
	 * Load this instance with raw data from Youtube
	 *
	 * @hidden
	 */
	load(data: YoutubeRawData): VideoCompact {
		const {
			videoId,
			title,
			lengthText,
			thumbnail,
			ownerText,
			shortBylineText,
			publishedTimeText,
			viewCountText,
			badges,
			thumbnailOverlays,
			channelThumbnailSupportedRenderers,
			detailedMetadataSnippets,
		} = data;

		this.id = videoId;
		this.title = title.simpleText || title.runs[0]?.text;
		this.thumbnails = new Thumbnails().load(thumbnail.thumbnails);
		this.uploadDate = publishedTimeText?.simpleText;
		this.description =
			detailedMetadataSnippets?.[0].snippetText.runs
				.map((r: YoutubeRawData) => r.text)
				.join("") || "";
		this.duration =
			getDuration(
				lengthText?.simpleText ||
					thumbnailOverlays?.[0].thumbnailOverlayTimeStatusRenderer?.text.simpleText ||
					""
			) || null;

		this.isLive = !!(badges?.[0].metadataBadgeRenderer.style === "BADGE_STYLE_TYPE_LIVE_NOW");

		// Channel
		if (ownerText || shortBylineText) {
			const { browseId } = (
				ownerText || shortBylineText
			).runs[0].navigationEndpoint.browseEndpoint;

			const thumbnails =
				channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer.thumbnail
					.thumbnails;

			this.channel = new ChannelCompact({
				id: browseId,
				name: (ownerText || shortBylineText).runs[0].text,
				thumbnails: thumbnails ? new Thumbnails().load(thumbnails) : undefined,
				client: this.client,
			});
		}

		this.viewCount = stripToInt(viewCountText?.simpleText || viewCountText?.runs[0].text);

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
	async getVideo(): Promise<Video | LiveVideo> {
		return await this.client.getVideo(this.id);
	}
}
