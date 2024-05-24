// const yt = require('./dist/cjs/index')
const { Client }  = require('./dist/cjs/index')
const {delay} = require('./helperFunctions')

const proxy = 'string'


const youtube = new Client({proxy: `http://${proxy}`});

const util = require('util')

let channelData = [
    {name:'RC LIVE ACTION',id:'UCT4l7A9S4ziruX6Y8cVQRMw',myName:null},
    {name:'Linus Tech Tips',id:'UCXuqSBlHAE6Xw-yeJA0Tunw',myName:'LTT'},
    {name:'ShortCircuit',id:'UCdBK94H6oZT2Q7l0-b0xmMg',myName:'ShortCircuit'},
    {name:'Joe Scott',id:'UC-2YHgc363EdcusLIBbgxzg',myName:'answers with joe'},
    {name:'Herr Anwalt',id:'UCOfQ0nZG7YClwNSaL-xULKQ',myName:'Herr Anwalt'},
    // {name:null,id:null,myName:null},
]

let videoIds = [
    {id:'s287FRTyTCQ',myName:'our ludacris future'},
    {id:'HcMhh7-0jqk',myName:'LTT'},
    {id:'eQ_8F4nzyiw',myName:'LTT'},// views over 22m
    {id:'7a_GtR9wt4I',myName:'Joe Scott'},
    // {id:null,myName:null},
]

const runOld = async () => {
    await delay(Math.random() * 5000)
    console.log('start')
    // const fakeAccountArray = await fakeAccounts.aggregate([{
    //     $match: {
    //         status: {$in: ['ok', 'ok00']},
    //         proxy: {$not: /webshare/}
    //     }
    // }, {$sample: {size: 1}}])
    // let fakeAccountUsed = fakeAccountArray[0]
    // let proxy2 = fakeAccountUsed.proxy
    // const searchChannel = await youtube.search("RC LIVE ACTION", {
    //     type: "channel", // video | playlist | channel | all
    // });
    // console.log('searchChannel:',searchChannel.items[0])
    // console.log(videos.items.length); // 20
    // console.log(videos.items[0].channel.videos); // 20
    // console.log(util.inspect(videos.items[0], false, null, true /* enable colors */));
    // const nextVideos = await videos.next(); // load next page
    // console.log(nextVideos.length); // 18-20, inconsistent next videos count from youtube
    // console.log(videos.items.length); // 38 - 40
    //
    // // you can also pass the video URL
    // const video = await youtube.getVideo("dQw4w9WgXcQ");

    // const video = await youtube.getVideo("HcMhh7-0jqk"); // LTT
    // const video = await youtube.getVideo("s287FRTyTCQ"); // our ludacris future

    // console.log('GetVideo: -> related videos', [video.related.items]);
    // console.log('GetVideo:', [video])
    // console.log('GetVideo:', [[video]])
    //
    // let comments = await video.comments.next()
    // console.log('\ncomments:',[comments])
    // console.log('\nauthor:',comments[0].author)
    // console.log('\nauthor.videos.channel:',comments[0].author.videos.channel)
    //
    // const channelVideos = await video.channel.videos.next();
    // const channelPlaylists = await video.channel.playlists.next();
    //
    // // you can also pass the playlist URL
    // const playlist = await youtube.getPlaylist("UUHnyfMqiRRG1u-2MsSQLbXA");
    // console.log(playlist.videos.items.length); // first 100 videos;
    // let newVideos = await playlist.videos.next(); // load next 100 videos
    // console.log(playlist.videos.items.length); // 200 videos;
    // await playlist.videos.next(0); // load the rest videos in the playlist

    let channel = await youtube.getChannel(channelData[1].id)
    // console.log('channel:',channel)
    // console.log('channel shelves:',channel.shelves)
    // let vids = await channel.videos.next()
    console.log('channel:',channel)
    // console.log('channel:',channel.shelves)
    // console.log('channel:',channel.videos.items)
    let video = await youtube.getVideo(channel.videos.items[0].id)
    // let comments = await video.comments.next()
    // console.log('\n\n-------------------')
    // console.log('video:',video)
    // console.log('\n\n-------------------')
    // console.log('comments:',comments)
    // console.log('vids:',vids)
    console.log('\nDONE')
};

runOld()


