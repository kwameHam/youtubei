"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getThumbnailFromId = exports.mapFilter = exports.getContinuationFromItems = exports.stripToInt = exports.getDuration = void 0;
const getDuration = (s) => {
    s = s.replace(/:/g, ".");
    const spl = s.split(".");
    if (spl.length === 0)
        return +spl;
    else {
        const sumStr = spl.pop();
        let sum = +sumStr;
        if (spl.length === 1)
            sum += +spl[0] * 60;
        if (spl.length === 2) {
            sum += +spl[1] * 60;
            sum += +spl[0] * 3600;
        }
        return sum;
    }
};
exports.getDuration = getDuration;
const stripToInt = (string) => {
    if (!string)
        return null;
    return +string.replace(/[^0-9]/g, "");
};
exports.stripToInt = stripToInt;
const getContinuationFromItems = (items, accessors = ["continuationEndpoint"]) => {
    if (!Array.isArray(items) || items.length === 0)
        return;
    const continuation = items[items.length - 1];
    const renderer = continuation?.continuationItemRenderer;
    if (!renderer)
        return;
    let current = renderer;
    for (const accessor of accessors) {
        current = current[accessor];
    }
    if (current?.commandExecutorCommand?.commands?.length) {
        current = current.commandExecutorCommand.commands.find((cmd) => "continuationCommand" in cmd);
    }
    return current?.continuationCommand?.token;
};
exports.getContinuationFromItems = getContinuationFromItems;
const mapFilter = (items, key) => {
    return items
        .filter((item) => item[key])
        .map((item) => item[key]);
};
exports.mapFilter = mapFilter;
const getThumbnailFromId = (id) => {
    return [
        {
            url: `https://i.ytimg.com/vi/${id}/default.jpg`,
            width: 120,
            height: 90,
        },
        {
            url: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
            width: 320,
            height: 180,
        },
        {
            url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            width: 480,
            height: 360,
        },
    ];
};
exports.getThumbnailFromId = getThumbnailFromId;
