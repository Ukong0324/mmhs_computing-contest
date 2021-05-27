const schedule = require('node-schedule');
const cheerio = require('cheerio');
const request = require('request');
const mongoose = require("mongoose")
const settings = require("./settings.js")
const chalk = require('chalk')
const moment = require("moment")
const ChartJSImage = require('chart.js-image')

mongoose.connect(settings.config.mongo.url, { useNewUrlParser: true, useUnifiedTopology: true }).then((res) => {
    const version = res.connections[0]._connectionOptions.driverInfo.version
    console.log(chalk.cyan(chalk.bold("[ DATABASE ] ")) + `Communicating with database | ${res.connections[0].host + ":" + res.connections[0].port} | Mongo Version ${version}`)
})

const db = require('mongoose').connection

function koreaUpdate() {
request(`http://ncov.mohw.go.kr/`, function (error, response, body) {
    const $ = cheerio.load(body);

    let total = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveNumOuter > div.liveNum > ul > li:nth-child(1) > span.num").text().replace("(누적)", "")
    let today = Number($("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveNumOuter > div.liveNum > ul > li:nth-child(1) > span.before").text().replace("전일대비 (+ ", "").replace(")", "")).toLocaleString()

    let domestic = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveNumOuter > div.liveNum_today_new > div > ul > li:nth-child(1) > span.data").text()
    let foreign = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveNumOuter > div.liveNum_today_new > div > ul > li:nth-child(2) > span.data").text()

    let recover = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveNumOuter > div.liveNum > ul > li:nth-child(2) > span.num").text()
    let todayRecover = Number($("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveNumOuter > div.liveNum > ul > li:nth-child(2) > span.before").text().replace("(+ ", "").replace(")", "")).toLocaleString()

    let care = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveNumOuter > div.liveNum > ul > li:nth-child(3) > span.num").text()
    let todayCare = Number($("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveNumOuter > div.liveNum > ul > li:nth-child(3) > span.before").text().replace("(+ ", "").replace(")", "")).toLocaleString()


    let death = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveNumOuter > div.liveNum > ul > li:nth-child(4) > span.num").text()
    let todayDeath = Number($("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveNumOuter > div.liveNum > ul > li:nth-child(4) > span.before").text().replace("(+ ", "").replace(")", "")).toLocaleString()

    let totalCheck = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveToggleOuter > div > div.live_left > div.liveTest.main_box_toggle > div.info_core > ul > li:nth-child(1) > span.num").text().replace("건", "").replace(" ", "")
    let totalChecked = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveToggleOuter > div > div.live_left > div.liveTest.main_box_toggle > div.info_core > ul > li:nth-child(2) > span.num").text().replace("건", "").replace(" ", "")
    let percent = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveToggleOuter > div > div.live_left > div.liveTest.main_box_toggle > div.info_core > ul > li:nth-child(3) > span.num").text().replace(" %", "")
    try {
        db.collection('coronas').findOneAndUpdate({ _id: "korea" }, {
            $set: {
                korea: {
                    total: total,
                    today: today,
                    domestic: domestic,
                    foreign: foreign,
                    recover: recover,
                    todayRecover: todayRecover,
                    care: care,
                    todayCare: todayCare,
                    death: death,
                    todayDeath: todayDeath,
                    totalCheck: totalCheck,
                    totalChecked: totalChecked,
                    average: percent,
                    updated: moment(Date.now()).format("YYYY.MM.DD A hh.mm.ss")
                }
            }
        }).then(() => {
            console.log(chalk.cyan(chalk.bold("[ DATABASE ] ")) + `Updated patient datas`)
        })

    } catch (e) {
        console.log(e)
    }

})
}

function ageUpdate() {
    request(`http://ncov.mohw.go.kr/bdBoardList_Real.do?brdId=1&brdGubun=11&ncvContSeq=&contSeq=&board_id=&gubun=`, function (error, response, body) {
        const $ = cheerio.load(body);
    
        let zero = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(9) > td:nth-child(2) > span:nth-child(1)").text()
        let ten = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(8) > td:nth-child(2) > span:nth-child(1)").text()
        let twenty = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(7) > td:nth-child(2) > span:nth-child(1)").text()
        let thirty = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(6) > td:nth-child(2) > span:nth-child(1)").text()
        let forty = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(5) > td:nth-child(2) > span:nth-child(1)").text()
        let fifty = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(4) > td:nth-child(2) > span:nth-child(1)").text()
        let sixty = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(3) > td:nth-child(2) > span:nth-child(1)").text()
        let seventy = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(2) > td:nth-child(2) > span:nth-child(1)").text()
        let eighty = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(1) > td:nth-child(2) > span:nth-child(1)").text()
        try {
            console.log(zero, ten, twenty, thirty, forty, fifty, sixty, seventy, eighty)
            const line_chart = ChartJSImage().chart({
                "type": "line",
                "data": {
                  "labels": [
                    "0-9",
                    "10-19",
                    "20-29",
                    "30-39",
                    "40-49",
                    "50-59",
                    "60-69",
                    "70-79",
                    "80+"
                  ],
                  "datasets": [
                    {
                      "label": "감염자",
                      "borderColor": "rgb(255,+99,+132)",
                      "backgroundColor": "rgba(255,+99,+132,+.5)",
                      "data": [
                        zero.replace(",", ""),
                        ten.replace(",", ""),
                        twenty.replace(",", ""),
                        thirty.replace(",", ""),
                        forty.replace(",", ""),
                        fifty.replace(",", ""),
                        sixty.replace(",", ""),
                        seventy.replace(",", ""),
                        eighty.replace(",", ""),
                      ]
                    }
                  ]},
                "options": {
                  "title": {
                    "display": true,
                    "text": "코로나19 연령별 감염자 현황"
                  }
                }
              })
              .backgroundColor('white')
              .width(700)
              .height(450);
               
            line_chart.toFile('./example/age.png');
        } catch (e) {
            console.log(e)
        }
    
    })
}
    
function age_dead_Update() {
    request(`http://ncov.mohw.go.kr/bdBoardList_Real.do?brdId=1&brdGubun=11&ncvContSeq=&contSeq=&board_id=&gubun=`, function (error, response, body) {
        const $ = cheerio.load(body);
    
        let zero = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(9) > td:nth-child(3) > span:nth-child(1)").text()
        let ten = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(8) > td:nth-child(3) > span:nth-child(1)").text()
        let twenty = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(7) > td:nth-child(3) > span:nth-child(1)").text()
        let thirty = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(6) > td:nth-child(3) > span:nth-child(1)").text()
        let forty = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(5) > td:nth-child(3) > span:nth-child(1)").text()
        let fifty = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(4) > td:nth-child(3) > span:nth-child(1)").text()
        let sixty = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(3) > td:nth-child(3) > span:nth-child(1)").text()
        let seventy = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(2) > td:nth-child(3) > span:nth-child(1)").text()
        let eighty = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(1) > td:nth-child(3) > span:nth-child(1)").text()
        try {
            console.log(zero, ten, twenty, thirty, forty, fifty, sixty, seventy, eighty)
            const line_chart = ChartJSImage().chart({
                "type": "line",
                "data": {
                  "labels": [
                    "0-9",
                    "10-19",
                    "20-29",
                    "30-39",
                    "40-49",
                    "50-59",
                    "60-69",
                    "70-79",
                    "80+"
                  ],
                  "datasets": [
                    {
                      "label": "사망자",
                      "borderColor": "rgb(255,+99,+132)",
                      "backgroundColor": "rgba(255,+99,+132,+.5)",
                      "data": [
                        zero.replace(",", ""),
                        ten.replace(",", ""),
                        twenty.replace(",", ""),
                        thirty.replace(",", ""),
                        forty.replace(",", ""),
                        fifty.replace(",", ""),
                        sixty.replace(",", ""),
                        seventy.replace(",", ""),
                        eighty.replace(",", ""),
                      ]
                    }
                  ]},
                "options": {
                  "title": {
                    "display": true,
                    "text": "코로나19 연령별 사망자 현황"
                  }
                }
              })
              .backgroundColor('white')
              .width(700)
              .height(450);
               
            line_chart.toFile('./example/age_dead.png');
        } catch (e) {
            console.log(e)
        }
    
    })

}

function age_critical_Update() {
    request(`http://ncov.mohw.go.kr/bdBoardList_Real.do?brdId=1&brdGubun=11&ncvContSeq=&contSeq=&board_id=&gubun=`, function (error, response, body) {
        const $ = cheerio.load(body);
    
        let zero = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(9) > td:nth-child(4) > span:nth-child(1)").text().replace("-", 0)
        let ten = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(8) > td:nth-child(4) > span:nth-child(1)").text().replace("-", 0)
        let twenty = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(7) > td:nth-child(4) > span:nth-child(1)").text().replace("-", 0)
        let thirty = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(6) > td:nth-child(4) > span:nth-child(1)").text().replace("-", 0)
        let forty = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(5) > td:nth-child(4) > span:nth-child(1)").text().replace("-", 0)
        let fifty = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(4) > td:nth-child(4) > span:nth-child(1)").text().replace("-", 0)
        let sixty = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(3) > td:nth-child(4) > span:nth-child(1)").text().replace("-", 0)
        let seventy = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(2) > td:nth-child(4) > span:nth-child(1)").text().replace("-", 0)
        let eighty = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(1) > td:nth-child(4) > span:nth-child(1)").text().replace("-", 0)
        try {
            const line_chart = ChartJSImage().chart({
                "type": "line",
                "data": {
                  "labels": [
                    "0-9",
                    "10-19",
                    "20-29",
                    "30-39",
                    "40-49",
                    "50-59",
                    "60-69",
                    "70-79",
                    "80+"
                  ],
                  "datasets": [
                    {
                      "label": "치명률",
                      "borderColor": "rgb(255,+99,+132)",
                      "backgroundColor": "rgba(255,+99,+132,+.5)",
                      "data": [
                        zero.replace(",", ""),
                        ten.replace(",", ""),
                        twenty.replace(",", ""),
                        thirty.replace(",", ""),
                        forty.replace(",", ""),
                        fifty.replace(",", ""),
                        sixty.replace(",", ""),
                        seventy.replace(",", ""),
                        eighty.replace(",", ""),
                      ]
                    }
                  ]},
                "options": {
                  "title": {
                    "display": true,
                    "text": "코로나19 연령별 치명률 현황"
                  }
                }
              })
              .backgroundColor('white')
              .width(700)
              .height(450);
               
            line_chart.toFile('./example/age_critical.png');
        } catch (e) {
            console.log(e)
        }
    
    })
}

function gender_Update() {
    request(`http://ncov.mohw.go.kr/bdBoardList_Real.do?brdId=1&brdGubun=11&ncvContSeq=&contSeq=&board_id=&gubun=`, function (error, response, body) {
        const $ = cheerio.load(body);

        let man_total = $("#content > div > div:nth-child(22) > table > tbody > tr:nth-child(1) > td:nth-child(2) > span:nth-child(1)").text()
        let women_total = $("#content > div > div:nth-child(22) > table > tbody > tr:nth-child(2) > td:nth-child(2) > span:nth-child(1)").text()

        let man_dead = $("#content > div > div:nth-child(22) > table > tbody > tr:nth-child(1) > td:nth-child(3) > span:nth-child(1)").text()
        let women_dead = $("#content > div > div:nth-child(22) > table > tbody > tr:nth-child(2) > td:nth-child(3) > span:nth-child(1)").text()

        let man_critical = $("#content > div > div:nth-child(22) > table > tbody > tr:nth-child(1) > td:nth-child(4) > span").text()
        let women_critical = $("#content > div > div:nth-child(22) > table > tbody > tr:nth-child(2) > td:nth-child(4) > span").text()
        try {
            console.log(man_critical, women_critical)
        } catch (e) {
            console.log(e)
        }
    
    })
}
