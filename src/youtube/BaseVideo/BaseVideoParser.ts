import { getContinuationFromItems, stripToInt, Thumbnails, YoutubeRawData } from "../../common";
import { BaseChannel } from "../BaseChannel";
import { Client } from "../Client";
import { PlaylistCompact } from "../PlaylistCompact";
import { VideoCompact } from "../VideoCompact";
import { BaseVideo } from "./BaseVideo";

export class BaseVideoParser {
	static loadBaseVideo(target: BaseVideo, data: YoutubeRawData): BaseVideo {
		const videoInfo = BaseVideoParser.parseRawData(data);
		if (videoInfo.isDeleted) {
			target.isDeleted = true
			return target;
		}else if (videoInfo.isError) {
			target.isError = true
			return target;
		}
		// Basic information
		target.id = videoInfo.videoDetails.videoId;
		target.title = videoInfo.videoDetails.title;
		target.uploadDate = videoInfo.microformat.uploadDate || videoInfo.dateText.simpleText;
		target.publishDate = videoInfo.microformat.publishDate || null;
		target.viewCount = +videoInfo.videoDetails.viewCount || null;
		target.keywords = videoInfo.videoDetails.keywords || null;
		target.category = videoInfo.microformat.category || null;
		target.isFamilySafe = videoInfo.microformat.isFamilySafe || null;
		target.isLiveContent = videoInfo.videoDetails.isLiveContent;
		target.thumbnails = new Thumbnails().load(videoInfo.videoDetails.thumbnail.thumbnails);

		// Channel
		const { title, thumbnail, subscriberCountText } = videoInfo.owner.videoOwnerRenderer;

		target.channel = new BaseChannel({
			client: target.client,
			id: title.runs[0].navigationEndpoint.browseEndpoint.browseId,
			name: title.runs[0].text,
			subscriberCount: subscriberCountText?.simpleText,
			thumbnails: new Thumbnails().load(thumbnail.thumbnails),
		});

		// Like Count and Dislike Count
		const topLevelButtons = videoInfo.videoActions.menuRenderer.topLevelButtons;
		target.likeCount = stripToInt(BaseVideoParser.parseButtonRenderer(topLevelButtons[0]));

		// Tags and description
		target.tags =
			videoInfo.superTitleLink?.runs
				?.map((r: YoutubeRawData) => r.text.trim())
				.filter((t: string) => t) || [];
		target.description =
			videoInfo.videoDetails.shortDescription || videoInfo.microformat?.description?.simpleText || videoInfo.description?.runs.map((d: Record<string, string>) => d.text).join("") || "";

		// related videos
		const secondaryContents =
			data[3].response.contents.twoColumnWatchNextResults?.secondaryResults?.secondaryResults
				?.results;

		if (secondaryContents) {
			target.related.items = BaseVideoParser.parseRelatedFromSecondaryContent(
				secondaryContents,
				target.client
			);
			target.related.continuation = getContinuationFromItems(secondaryContents);
		}

		return target;
	}

	static parseRelated(data: YoutubeRawData, client: Client): (VideoCompact | PlaylistCompact)[] {
		const secondaryContents: YoutubeRawData[] =
			data.onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems;

		return BaseVideoParser.parseRelatedFromSecondaryContent(secondaryContents, client);
	}

	static parseContinuation(data: YoutubeRawData): string | undefined {
		const secondaryContents =
			data.onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems;

		return getContinuationFromItems(secondaryContents);
	}

	static parseRawData(data: YoutubeRawData): YoutubeRawData {
		const contents =
			data[3].response.contents.twoColumnWatchNextResults.results.results.contents;

		const videoPrimaryInfoRenderer = contents.find((c: YoutubeRawData) => "videoPrimaryInfoRenderer" in c)

		if (!videoPrimaryInfoRenderer) {
			let playabilityStatus = data[2].playerResponse.playabilityStatus
			if (playabilityStatus && playabilityStatus.status === "ERROR") {
				if (playabilityStatus.reason ==="Video nicht verfügbar") {
					return {isDeleted:true}
				}
				console.log('BaseVideoParser -> parseRawData error:',playabilityStatus.reason)
				return {isError:true}
			}
		}
		
		const primaryInfo = videoPrimaryInfoRenderer.videoPrimaryInfoRenderer;
		const secondaryInfo = contents.find(
			(c: YoutubeRawData) => "videoSecondaryInfoRenderer" in c
		).videoSecondaryInfoRenderer;
		const videoDetails = data[2].playerResponse.videoDetails;
		const microformat = data[2].playerResponse.microformat.playerMicroformatRenderer;
		return { ...secondaryInfo, ...primaryInfo, videoDetails, microformat };
	}

	private static parseCompactRenderer(
		data: YoutubeRawData,
		client: Client
	): VideoCompact | PlaylistCompact | undefined {
		if ("compactVideoRenderer" in data) {
			return new VideoCompact({ client }).load(data.compactVideoRenderer);
		} else if ("compactRadioRenderer" in data) {
			return new PlaylistCompact({ client }).load(data.compactRadioRenderer);
		}
	}

	private static parseRelatedFromSecondaryContent(
		secondaryContents: YoutubeRawData[],
		client: Client
	): (VideoCompact | PlaylistCompact)[] {
		return secondaryContents
			.map((c: YoutubeRawData) => BaseVideoParser.parseCompactRenderer(c, client))
			.filter((c): c is VideoCompact | PlaylistCompact => c !== undefined);
	}

	private static parseButtonRenderer(data: YoutubeRawData): string {
		let buttonRenderer;
		try {
			const likeButton = data.segmentedLikeDislikeButtonViewModel.likeButtonViewModel.likeButtonViewModel.toggleButtonViewModel.toggleButtonViewModel
			buttonRenderer = likeButton.toggledButtonViewModel.buttonViewModel.title|| likeButton.defaultButtonViewModel.buttonViewModel.title
			return buttonRenderer
		} catch (e) {
			return ''
		}
	}
}
