import { Thumbnails, YoutubeRawData } from "../../common";
import { BaseChannel } from "../BaseChannel";
import { PlaylistCompact } from "../PlaylistCompact";
import { VideoCompact } from "../VideoCompact";
import { Channel, ChannelShelf } from "./Channel";

export class ChannelParser {
	static loadChannel(target: Channel, data: YoutubeRawData): Channel {
		const {
			channelId,
			title,
			avatar,
			subscriberCountText,
			badges,
			headerLinks,
			videosCountText,
			channelHandleText,
			tagline,
		} = data.header.c4TabbedHeaderRenderer;
		
		target.id = channelId;
		target.name = title;
		target.thumbnails = new Thumbnails().load(avatar.thumbnails);
		target.videoCount = videosCountText?.runs[0]?.text || 0;
		target.channelHandle = channelHandleText?.runs[0]?.text || null;
		target.badge = badges[0]?.metadataBadgeRenderer?.tooltip;
		target.channelLink = data?.metadata?.channelMetadataRenderer?.ownerUrls[0] || null;
		if (!target.channelLink && target.channelHandle) {
			target.channelLink = 'http://www.youtube.com/'+target.channelHandle;
		}
		target.description = data?.metadata?.channelMetadataRenderer?.description || tagline?.channelTaglineRenderer?.content || null;
		
		target.channelTags = data?.microformat?.microformatDataRenderer?.tags || []
		target.subscriberCount = subscriberCountText?.simpleText;

		const { tvBanner, mobileBanner, banner } = data.header.c4TabbedHeaderRenderer;

		target.banner = new Thumbnails().load(banner?.thumbnails || []);
		target.tvBanner = new Thumbnails().load(tvBanner?.thumbnails || []);
		target.mobileBanner = new Thumbnails().load(mobileBanner?.thumbnails || []);
		target.shelves = ChannelParser.parseShelves(target, data);

		return target;
	}

	static parseShelves(target: Channel, data: YoutubeRawData): ChannelShelf[] {
		const shelves: ChannelShelf[] = [];

		const rawShelves =
			data.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content
				.sectionListRenderer.contents;

		for (const rawShelf of rawShelves) {
			const shelfRenderer = rawShelf.itemSectionRenderer.contents[0].shelfRenderer;
			if (!shelfRenderer) continue;

			const { title, content, subtitle } = shelfRenderer;
			if (!content.horizontalListRenderer) continue;

			const items:
				| BaseChannel[]
				| VideoCompact[]
				| PlaylistCompact[] = content.horizontalListRenderer.items
				.map((i: YoutubeRawData) => {
					if (i.gridVideoRenderer)
						return new VideoCompact({ client: target.client }).load(
							i.gridVideoRenderer
						);
					if (i.gridPlaylistRenderer)
						return new PlaylistCompact({ client: target.client }).load(
							i.gridPlaylistRenderer
						);
					if (i.gridChannelRenderer)
						return new BaseChannel({ client: target.client }).load(
							i.gridChannelRenderer
						);
					return undefined;
				})
				.filter((i: YoutubeRawData) => i !== undefined);

			const shelf: ChannelShelf = {
				title: title.runs[0].text,
				subtitle: subtitle?.simpleText,
				items,
			};

			shelves.push(shelf);
		}

		return shelves;
	}
}
