import { stripToInt, YoutubeRawData } from "../../common";
import { Thumbnails } from "../Thumbnails";
import { ShortCompact } from "./ShortCompact";

export class ShortCompactParser {
    static loadVideoCompact(target: ShortCompact, data: YoutubeRawData): ShortCompact {
        const {
            videoId,
            headline,
            thumbnail,
            viewCountText,
        } = data;

        target.id = videoId;
        target.title = headline.simpleText || headline.runs[0]?.text;
        target.thumbnails = new Thumbnails().load(thumbnail.thumbnails);

        target.viewCount = stripToInt(viewCountText?.simpleText || viewCountText?.runs[0].text);

        return target;
    }
}
