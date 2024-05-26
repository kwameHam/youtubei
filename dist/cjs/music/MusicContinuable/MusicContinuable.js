"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicContinuable = void 0;
const MusicBase_1 = require("../MusicBase");
/** Represents a continuable list of items `T` (like pagination) */
class MusicContinuable extends MusicBase_1.MusicBase {
    /** @hidden */
    constructor({ client, strictContinuationCheck }) {
        super(client);
        this.items = [];
        this.strictContinuationCheck = !!strictContinuationCheck;
        if (this.strictContinuationCheck)
            this.continuation = null;
    }
    /** Fetch next items using continuation token */
    async next(count = 1) {
        const newItems = [];
        for (let i = 0; i < count || count == 0; i++) {
            if (!this.hasContinuation)
                break;
            const { items, continuation } = await this.fetch();
            this.continuation = continuation;
            newItems.push(...items);
        }
        this.items.push(...newItems);
        return newItems;
    }
    get hasContinuation() {
        return this.strictContinuationCheck ? this.continuation !== undefined : !!this.continuation;
    }
}
exports.MusicContinuable = MusicContinuable;
