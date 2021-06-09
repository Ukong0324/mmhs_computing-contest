const schedule = require('node-schedule');
const settings = require("../config.js")
const cheerio = require('cheerio');
const mongoose = require("mongoose")
const chalk = require('chalk')
const moment = require("moment")
const ChartJSImage = require('chart.js-image')
const axios = require("axios")
const webhook = require("webhook-discord")

mongoose.connect(settings.config.mongo.url, { useNewUrlParser: true, useUnifiedTopology: true }).then((res) => {
  const version = res.connections[0]._connectionOptions.driverInfo.version
  console.log(chalk.cyan(chalk.bold("[ DATABASE ] ")) + `Communicating with database | ${res.connections[0].host + ":" + res.connections[0].port} | Mongo Version ${version}`)
})

const db = require('mongoose').connection
/**
 * 코로나19 국내 현황
 */
function koreaUpdate() {
  axios.get("http://ncov.mohw.go.kr/").then((res) => {
    const $ = cheerio.load(res.data);

    let total = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveNumOuter > div.liveNum > ul > li:nth-child(1) > span.num").text().replace("(누적)", "")
    let today = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveNumOuter > div.liveNum > ul > li:nth-child(1) > span.before").text().replace("전일대비 (+ ", "").replace(")", "").toLocaleString()

    let domestic = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveNumOuter > div.liveNum_today_new > div > ul > li:nth-child(1) > span.data").text()
    let foreign = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveNumOuter > div.liveNum_today_new > div > ul > li:nth-child(2) > span.data").text()

    let recover = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveNumOuter > div.liveNum > ul > li:nth-child(2) > span.num").text()
    let todayRecover = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveNumOuter > div.liveNum > ul > li:nth-child(2) > span.before").text().replace("(+ ", "").replace(")", "").toLocaleString()

    let care = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveNumOuter > div.liveNum > ul > li:nth-child(3) > span.num").text()
    let todayCare = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveNumOuter > div.liveNum > ul > li:nth-child(3) > span.before").text().replace("(+ ", "").replace(")", "").replace("(", "").replace(" ", "").toLocaleString()


    let death = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveNumOuter > div.liveNum > ul > li:nth-child(4) > span.num").text()
    let todayDeath = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveNumOuter > div.liveNum > ul > li:nth-child(4) > span.before").text().replace("(+ ", "").replace(")", "").toLocaleString()

    let totalCheck = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveToggleOuter > div > div.live_left > div.liveTest.main_box_toggle > div.info_core > ul > li:nth-child(1) > span.num").text().replace("건", "").replace(" ", "")
    let totalChecked = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveToggleOuter > div > div.live_left > div.liveTest.main_box_toggle > div.info_core > ul > li:nth-child(2) > span.num").text().replace("건", "").replace(" ", "")
    let percent = $("body > div > div.mainlive_container > div.container > div > div.liveboard_layout > div.liveToggleOuter > div > div.live_left > div.liveTest.main_box_toggle > div.info_core > ul > li:nth-child(3) > span.num").text().replace(" %", "")

    try {
      db.collection('coronas').findOne({ _id: "korea" }, async (err, res) => {
        const week = res.korea.week
        week.shift()
        week.push(today)
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
              percent: percent,
              week: week,
              updated: moment(Date.now()).format("YYYY.MM.DD A hh.mm.ss")
            }
          }
        }).then(() => {
          const line_chart = ChartJSImage().chart({
            "type": "line",
            "data": {
              "labels": [
                moment(Date.now() - 604800000).format("MM.DD"),
                moment(Date.now() - 518400000).format("MM.DD"),
                moment(Date.now() - 432000000).format("MM.DD"),
                moment(Date.now() - 345600000).format("MM.DD"),
                moment(Date.now() - 259200000).format("MM.DD"),
                moment(Date.now() - 172800000).format("MM.DD"),
                moment(Date.now() - 86400000).format("MM.DD"),
              ],
              "datasets": [
                {
                  "label": "확진자수",
                  "borderColor": "rgb(255,+99,+132)",
                  "backgroundColor": "rgba(255,+99,+132,+.5)",
                  "data": [
                    week[0],
                    week[1],
                    week[2],
                    week[3],
                    week[4],
                    week[5],
                    week[6]
                  ]
                }
              ]
            },
            "options": {
              "title": {
                "display": true,
                "text": "코로나19 일별 신규 확진자수"
              }
            }
          })
            .backgroundColor('white')
            .width(700)
            .height(450);

          line_chart.toFile('../example/covid-19.png');
        })
      })

    } catch (e) {
      console.log(e)
    }

  })
}

function ageUpdate() {
  axios.get("http://ncov.mohw.go.kr/bdBoardList_Real.do?brdId=1&brdGubun=11&ncvContSeq=&contSeq=&board_id=&gubun=").then((res) => {
    const $ = cheerio.load(res.data);

    let zero_total = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(9) > td:nth-child(2) > span:nth-child(1)").text()
    let ten_total = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(8) > td:nth-child(2) > span:nth-child(1)").text()
    let twenty_total = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(7) > td:nth-child(2) > span:nth-child(1)").text()
    let thirty_total = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(6) > td:nth-child(2) > span:nth-child(1)").text()
    let forty_total = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(5) > td:nth-child(2) > span:nth-child(1)").text()
    let fifty_total = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(4) > td:nth-child(2) > span:nth-child(1)").text()
    let sixty_total = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(3) > td:nth-child(2) > span:nth-child(1)").text()
    let seventy_total = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(2) > td:nth-child(2) > span:nth-child(1)").text()
    let eighty_total = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(1) > td:nth-child(2) > span:nth-child(1)").text()

    let zero_dead = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(9) > td:nth-child(3) > span:nth-child(1)").text()
    let ten_dead = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(8) > td:nth-child(3) > span:nth-child(1)").text()
    let twenty_dead = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(7) > td:nth-child(3) > span:nth-child(1)").text()
    let thirty_dead = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(6) > td:nth-child(3) > span:nth-child(1)").text()
    let forty_dead = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(5) > td:nth-child(3) > span:nth-child(1)").text()
    let fifty_dead = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(4) > td:nth-child(3) > span:nth-child(1)").text()
    let sixty_dead = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(3) > td:nth-child(3) > span:nth-child(1)").text()
    let seventy_dead = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(2) > td:nth-child(3) > span:nth-child(1)").text()
    let eighty_dead = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(1) > td:nth-child(3) > span:nth-child(1)").text()

    let zero_critical = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(9) > td:nth-child(4) > span:nth-child(1)").text().replace("-", 0)
    let ten_critical = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(8) > td:nth-child(4) > span:nth-child(1)").text().replace("-", 0)
    let twenty_critical = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(7) > td:nth-child(4) > span:nth-child(1)").text().replace("-", 0)
    let thirty_critical = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(6) > td:nth-child(4) > span:nth-child(1)").text().replace("-", 0)
    let forty_critical = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(5) > td:nth-child(4) > span:nth-child(1)").text().replace("-", 0)
    let fifty_critical = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(4) > td:nth-child(4) > span:nth-child(1)").text().replace("-", 0)
    let sixty_critical = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(3) > td:nth-child(4) > span:nth-child(1)").text().replace("-", 0)
    let seventy_critical = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(2) > td:nth-child(4) > span:nth-child(1)").text().replace("-", 0)
    let eighty_critical = $("#content > div > div:nth-child(25) > table > tbody > tr:nth-child(1) > td:nth-child(4) > span:nth-child(1)").text().replace("-", 0)

    const zero = {
      total: zero_total,
      dead: zero_dead,
      critical: zero_critical
    }
    const ten = {
      total: ten_total,
      dead: ten_dead,
      critical: ten_critical
    }
    const twenty = {
      total: twenty_total,
      dead: twenty_dead,
      critical: twenty_critical
    }
    const thirty = {
      total: thirty_total,
      dead: thirty_dead,
      critical: thirty_critical
    }
    const forty = {
      total: forty_total,
      dead: forty_dead,
      critical: forty_critical
    }
    const fifty = {
      total: fifty_total,
      dead: fifty_dead,
      critical: fifty_critical
    }
    const sixty = {
      total: sixty_total,
      dead: sixty_dead,
      critical: sixty_critical
    }
    const seventy = {
      total: seventy_total,
      dead: seventy_dead,
      critical: seventy_critical
    }
    const eighty = {
      total: eighty_total,
      dead: eighty_dead,
      critical: eighty_critical
    }

    try {
      db.collection('coronas').findOneAndUpdate({ _id: "korea" }, {
        $set: {
          age: {
            zero: zero,
            ten: ten,
            twenty: twenty,
            thirty: thirty,
            forty: forty,
            fifty: fifty,
            sixty: sixty,
            seventy: seventy,
            eighty: eighty,
            updated: moment(Date.now()).format("YYYY.MM.DD A hh.mm.ss")
          }
        }
      })
    } catch (e) {
      console.log(e)
    }

  })
}

/**
 * 코로나19 확진자 성별 현황
 */
function gender_Update() {
  axios.get("http://ncov.mohw.go.kr/bdBoardList_Real.do?brdId=1&brdGubun=11&ncvContSeq=&contSeq=&board_id=&gubun=").then((res) => {
    const $ = cheerio.load(res.data);

    let man_total = $("#content > div > div:nth-child(22) > table > tbody > tr:nth-child(1) > td:nth-child(2) > span:nth-child(1)").text()
    let women_total = $("#content > div > div:nth-child(22) > table > tbody > tr:nth-child(2) > td:nth-child(2) > span:nth-child(1)").text()

    let man_dead = $("#content > div > div:nth-child(22) > table > tbody > tr:nth-child(1) > td:nth-child(3) > span:nth-child(1)").text()
    let women_dead = $("#content > div > div:nth-child(22) > table > tbody > tr:nth-child(2) > td:nth-child(3) > span:nth-child(1)").text()

    let man_critical = $("#content > div > div:nth-child(22) > table > tbody > tr:nth-child(1) > td:nth-child(4) > span").text()
    let women_critical = $("#content > div > div:nth-child(22) > table > tbody > tr:nth-child(2) > td:nth-child(4) > span").text()

    const man ={
      total: man_total,
      dead: man_dead,
      critical: man_critical
    }
    const women ={
      total: women_total,
      dead: women_dead,
      critical: women_critical
    }
    try {
      db.collection('coronas').findOneAndUpdate({ _id: "korea" }, {
        $set: {
          gender: {
            man: man,
            women: women,
            updated: moment(Date.now()).format("YYYY.MM.DD A hh.mm.ss")
          }
        }
      })
    } catch (e) {
      console.log(e)
    }

  })
}


/**
 * 코로나19 시도별 접종 현황 
 */
function vaccine_Update() {
  axios.get("https://ncv.kdca.go.kr/mainStatus.es?mid=a11702000000").then((res) => {
    const $ = cheerio.load(res.data);

    /**
     * 접종실적 총괄
     */
    let first_today_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(3) > table > tbody > tr:nth-child(2) > td:nth-child(2)").text()
    let first_today_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(3) > table > tbody > tr:nth-child(1) > td:nth-child(2)").text()
    let second_today_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(3) > table > tbody > tr:nth-child(2) > td:nth-child(3)").text()
    let second_today_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(3) > table > tbody > tr:nth-child(1) > td:nth-child(3)").text()

    /**
     * 시도별 접종 현황
     */
    let first_today_seoul_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(2) > td:nth-child(2)").text()
    let first_today_seoul_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(2) > td:nth-child(3)").text()
    let second_today_seoul_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(2) > td:nth-child(4)").text()
    let second_today_seoul_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(2) > td:nth-child(5)").text()

    let first_today_busan_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(3) > td:nth-child(2)").text()
    let first_today_busan_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(3) > td:nth-child(3)").text()
    let second_today_busan_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(3) > td:nth-child(4)").text()
    let second_today_busan_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(3) > td:nth-child(5)").text()

    let first_today_daegu_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(4) > td:nth-child(2)").text()
    let first_today_daegu_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(4) > td:nth-child(3)").text()
    let second_today_daegu_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(4) > td:nth-child(4)").text()
    let second_today_daegu_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(4) > td:nth-child(5)").text()

    let first_today_incheon_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(5) > td:nth-child(2)").text()
    let first_today_incheon_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(5) > td:nth-child(3)").text()
    let second_today_incheon_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(5) > td:nth-child(4)").text()
    let second_today_incheon_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(5) > td:nth-child(5)").text()

    let first_today_gwangju_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(6) > td:nth-child(2)").text()
    let first_today_gwangju_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(6) > td:nth-child(3)").text()
    let second_today_gwangju_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(6) > td:nth-child(4)").text()
    let second_today_gwangju_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(6) > td:nth-child(5)").text()

    let first_today_daejeon_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(7) > td:nth-child(2)").text()
    let first_today_daejeon_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(7) > td:nth-child(3)").text()
    let second_today_daejeon_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(7) > td:nth-child(4)").text()
    let second_today_daejeon_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(7) > td:nth-child(5)").text()

    let first_today_ulsan_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(8) > td:nth-child(2)").text()
    let first_today_ulsan_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(8) > td:nth-child(3)").text()
    let second_today_ulsan_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(8) > td:nth-child(4)").text()
    let second_today_ulsan_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(8) > td:nth-child(5)").text()

    let first_today_sejong_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(9) > td:nth-child(2)").text()
    let first_today_sejong_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(9) > td:nth-child(3)").text()
    let second_today_sejong_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(9) > td:nth-child(4)").text()
    let second_today_sejong_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(9) > td:nth-child(5)").text()

    let first_today_gyeonggi_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(10) > td:nth-child(2)").text()
    let first_today_gyeonggi_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(10) > td:nth-child(3)").text()
    let second_today_gyeonggi_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(10) > td:nth-child(4)").text()
    let second_today_gyeonggi_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(10) > td:nth-child(5)").text()

    let first_today_gangwon_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(11) > td:nth-child(2)").text()
    let first_today_gangwon_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(11) > td:nth-child(3)").text()
    let second_today_gangwon_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(11) > td:nth-child(4)").text()
    let second_today_gangwon_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(11) > td:nth-child(5)").text()

    let first_today_chungbuk_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(12) > td:nth-child(2)").text()
    let first_today_chungbuk_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(12) > td:nth-child(3)").text()
    let second_today_chungbuk_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(12) > td:nth-child(4)").text()
    let second_today_chungbuk_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(12) > td:nth-child(5)").text()

    let first_today_chungnam_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(13) > td:nth-child(2)").text()
    let first_today_chungnam_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(13) > td:nth-child(3)").text()
    let second_today_chungnam_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(13) > td:nth-child(4)").text()
    let second_today_chungnam_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(13) > td:nth-child(5)").text()

    let first_today_jeollabuk_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(14) > td:nth-child(2)").text()
    let first_today_jeollabuk_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(14) > td:nth-child(3)").text()
    let second_today_jeollabuk_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(14) > td:nth-child(4)").text()
    let second_today_jeollabuk_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(14) > td:nth-child(5)").text()

    let first_today_jeollanam_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(15) > td:nth-child(2)").text()
    let first_today_jeollanam_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(15) > td:nth-child(3)").text()
    let second_today_jeollanam_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(15) > td:nth-child(4)").text()
    let second_today_jeollanam_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(15) > td:nth-child(5)").text()

    let first_today_gyeongbuk_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(16) > td:nth-child(2)").text()
    let first_today_gyeongbuk_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(16) > td:nth-child(3)").text()
    let second_today_gyeongbuk_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(16) > td:nth-child(4)").text()
    let second_today_gyeongbuk_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(16) > td:nth-child(5)").text()

    let first_today_gyeongnam_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(17) > td:nth-child(2)").text()
    let first_today_gyeongnam_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(17) > td:nth-child(3)").text()
    let second_today_gyeongnam_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(17) > td:nth-child(4)").text()
    let second_today_gyeongnam_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(17) > td:nth-child(5)").text()

    let first_today_jeju_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(18) > td:nth-child(2)").text()
    let first_today_jeju_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(18) > td:nth-child(3)").text()
    let second_today_jeju_result = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(18) > td:nth-child(4)").text()
    let second_today_jeju_total = $("#wrap > div.container > div:nth-child(1) > div:nth-child(5) > table > tbody > tr:nth-child(18) > td:nth-child(5)").text()

    const seoul = {
      first: {
        today_result: first_today_seoul_result,
        today_total: first_today_seoul_total
      },
      second: {
        today_result: second_today_seoul_result,
        today_total: second_today_seoul_total
      }
    }
    const busan = {
      first: {
        today_result: first_today_busan_result,
        today_total: first_today_busan_total
      },
      second: {
        today_result: second_today_busan_result,
        today_total: second_today_busan_total
      }
    }
    const daegu = {
      first: {
        today_result: first_today_daegu_result,
        today_total: first_today_daegu_total
      },
      second: {
        today_result: second_today_daegu_result,
        today_total: second_today_daegu_total
      }
    }
    const incheon = {
      first: {
        today_result: first_today_incheon_result,
        today_total: first_today_incheon_total
      },
      second: {
        today_result: second_today_incheon_result,
        today_total: second_today_incheon_total
      }
    }
    const gwangju = {
      first: {
        today_result: first_today_gwangju_result,
        today_total: first_today_gwangju_total
      },
      second: {
        today_result: second_today_gwangju_result,
        today_total: second_today_gwangju_total
      }
    }
    const daejeon = {
      first: {
        today_result: first_today_daejeon_result,
        today_total: first_today_daejeon_total
      },
      second: {
        today_result: second_today_daejeon_result,
        today_total: second_today_daejeon_total
      }
    }
    const ulsan = {
      first: {
        today_result: first_today_ulsan_result,
        today_total: first_today_ulsan_total
      },
      second: {
        today_result: second_today_ulsan_result,
        today_total: second_today_ulsan_total
      }
    }
    const sejong = {
      first: {
        today_result: first_today_sejong_result,
        today_total: first_today_sejong_total
      },
      second: {
        today_result: second_today_sejong_result,
        today_total: second_today_sejong_total
      }
    }
    const gyeonggi = {
      first: {
        today_result: first_today_gyeonggi_result,
        today_total: first_today_gyeonggi_total
      },
      second: {
        today_result: second_today_gyeonggi_result,
        today_total: second_today_gyeonggi_total
      }
    }
    const gangwon = {
      first: {
        today_result: first_today_gangwon_result,
        today_total: first_today_gangwon_total
      },
      second: {
        today_result: second_today_gangwon_result,
        today_total: second_today_gangwon_total
      }
    }
    const chungbuk = {
      first: {
        today_result: first_today_chungbuk_result,
        today_total: first_today_chungbuk_total
      },
      second: {
        today_result: second_today_chungbuk_result,
        today_total: second_today_chungbuk_total
      }
    }
    const chungnam = {
      first: {
        today_result: first_today_chungnam_result,
        today_total: first_today_chungnam_total
      },
      second: {
        today_result: second_today_chungnam_result,
        today_total: second_today_chungnam_total
      }
    }
    const jeollabuk = {
      first: {
        today_result: first_today_jeollabuk_result,
        today_total: first_today_jeollabuk_total
      },
      second: {
        today_result: second_today_jeollabuk_result,
        today_total: second_today_jeollabuk_total
      }
    }
    const jeollanam = {
      first: {
        today_result: first_today_jeollanam_result,
        today_total: first_today_jeollanam_total
      },
      second: {
        today_result: second_today_jeollanam_result,
        today_total: second_today_jeollanam_total
      }
    }
    const gyeongbuk = {
      first: {
        today_result: first_today_gyeongbuk_result,
        today_total: first_today_gyeongbuk_total
      },
      second: {
        today_result: second_today_gyeongbuk_result,
        today_total: second_today_gyeongbuk_total
      }
    }
    const gyeongnam = {
      first: {
        today_result: first_today_gyeongnam_result,
        today_total: first_today_gyeongnam_total
      },
      second: {
        today_result: second_today_gyeongnam_result,
        today_total: second_today_gyeongnam_total
      }
    }
    const jeju = {
      first: {
        today_result: first_today_jeju_result,
        today_total: first_today_jeju_total
      },
      second: {
        today_result: second_today_jeju_result,
        today_total: second_today_jeju_total
      }
    }
    db.collection('coronas').findOneAndUpdate({ _id: "korea" }, {
      $set: {
        vaccine: {
          seoul: seoul,
          busan: busan,
          daegu: daegu,
          incheon: incheon,
          gwangju: gwangju,
          daejeon: daejeon,
          ulsan: ulsan,
          sejong: sejong,
          gyeonggi: gyeonggi,
          gangwon: gangwon,
          chungbuk: chungbuk,
          chungnam: chungnam,
          jeollabuk: jeollabuk,
          jeollanam: jeollanam,
          gyeongbuk: gyeongbuk,
          gyeongnam: gyeongnam,
          jeju: jeju,
          updated: moment(Date.now()).format("YYYY.MM.DD A hh.mm.ss")
        }
      }
    })
  })
}

/**
 * 코로나19 사회적 거리두기 단계
 */
function social_distancing_Update() {
  axios.get("http://ncov.mohw.go.kr/").then((res) => {
    const $ = cheerio.load(res.data);
    let seoul = $("#main_maplayout > button:nth-child(1) > span.num").text()
    let busan = $("#main_maplayout > button:nth-child(2) > span.num").text()
    let daegu = $("#main_maplayout > button:nth-child(3) > span.num").text()
    let incheon = $("#main_maplayout > button:nth-child(4) > span.num").text() // [0]
    let gwangju = $("#main_maplayout > button:nth-child(5) > span.num").text()
    let daejeon = $("#main_maplayout > button:nth-child(6) > span.num").text()
    let ulsan = $("#main_maplayout > button:nth-child(7) > span.num").text() // [0]
    let sejong = $("#main_maplayout > button:nth-child(8) > span.num").text()
    let gyeonggi = $("#main_maplayout > button:nth-child(9) > span.num").text() // [0]
    let gangwon = $("#main_maplayout > button:nth-child(10) > span.num").text()
    let chungbuk = $("#main_maplayout > button:nth-child(11) > span.num").text()
    let chungnam = $("#main_maplayout > button:nth-child(12) > span.num").text()
    let jeollabuk = $("#main_maplayout > button:nth-child(13) > span.num").text()
    let jeollanam = $("#main_maplayout > button:nth-child(14) > span.num").text() // [0] - 1
    let gyeongbuk = $("#main_maplayout > button:nth-child(15) > span.num").text()
    let gyeongnam = $("#main_maplayout > button:nth-child(16) > span.num").text()
    let jeju = $("#main_maplayout > button:nth-child(17) > span.num").text() // [0] + 1


    function check_space(anything) {
      let slice = anything.slice(0, 3)
      if (slice[1] === ".") {
        return (Number(slice) - 0.5).toLocaleString()
      } else {
        return (Number(slice[0]) - 0.5).toLocaleString()
      }
    }

    db.collection('coronas').findOneAndUpdate({ _id: "korea" }, {
      $set: {
        social_distancing: {
          seoul: check_space(seoul),
          busan: check_space(busan),
          daegu: check_space(daegu),
          incheon: incheon.slice(0, 2)[0],
          gwangju: check_space(gwangju),
          daejeon: check_space(daejeon),
          ulsan: ulsan.slice(0, 2)[0],
          sejong: check_space(sejong),
          gyeonggi: gyeonggi.slice(0, 2)[0],
          gangwon: check_space(gangwon),
          chungbuk: check_space(chungbuk),
          chungnam: check_space(chungnam),
          jeollabuk: check_space(jeollabuk),
          jeollanam: (Number(jeollanam.slice(0, 2)[0]) - 1).toLocaleString(),
          gyeongbuk: check_space(gyeongbuk),
          gyeongnam: check_space(gyeongnam),
          jeju: (Number(jeju.slice(0, 2)[0]) + 1).toLocaleString(),
          updated: moment(Date.now()).format("YYYY.MM.DD A hh.mm.ss")
        }
      }
    })
  })
}

/**
 * 코로나19 시도별 발생동향
 */
function city_Update() {
  const cheerio = require('cheerio');
  const axios = require("axios")

  axios.get("http://ncov.mohw.go.kr/bdBoardList_Real.do?brdId=1&brdGubun=13&ncvContSeq=&contSeq=&board_id=&gubun=").then((res) => {
    const $ = cheerio.load(res.data);
    let seoul_today_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(2) > td:nth-child(2)").text()
    let seoul_today_domestic = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(2) > td:nth-child(3)").text()
    let seoul_today_foreign = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(2) > td:nth-child(4)").text()
    let seoul_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(2) > td:nth-child(5)").text()
    let seoul_care = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(2) > td:nth-child(6)").text()
    let seoul_recover = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(2) > td:nth-child(7)").text()
    let seoul_death = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(2) > td:nth-child(8)").text()
    let seoul_incidence = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(2) > td:nth-child(9)").text()

    let busan_today_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(3) > td:nth-child(2)").text()
    let busan_today_domestic = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(3) > td:nth-child(3)").text()
    let busan_today_foreign = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(3) > td:nth-child(4)").text()
    let busan_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(3) > td:nth-child(5)").text()
    let busan_care = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(3) > td:nth-child(6)").text()
    let busan_recover = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(3) > td:nth-child(7)").text()
    let busan_death = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(3) > td:nth-child(8)").text()
    let busan_incidence = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(3) > td:nth-child(9)").text()

    let daegu_today_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(4) > td:nth-child(2)").text()
    let daegu_today_domestic = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(4) > td:nth-child(3)").text()
    let daegu_today_foreign = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(4) > td:nth-child(4)").text()
    let daegu_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(4) > td:nth-child(5)").text()
    let daegu_care = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(4) > td:nth-child(6)").text()
    let daegu_recover = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(4) > td:nth-child(7)").text()
    let daegu_death = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(4) > td:nth-child(8)").text()
    let daegu_incidence = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(4) > td:nth-child(9)").text()

    let incheon_today_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(5) > td:nth-child(2)").text()
    let incheon_today_domestic = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(5) > td:nth-child(3)").text()
    let incheon_today_foreign = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(5) > td:nth-child(4)").text()
    let incheon_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(5) > td:nth-child(5)").text()
    let incheon_care = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(5) > td:nth-child(6)").text()
    let incheon_recover = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(5) > td:nth-child(7)").text()
    let incheon_death = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(5) > td:nth-child(8)").text()
    let incheon_incidence = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(5) > td:nth-child(9)").text()

    let gwangju_today_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(6) > td:nth-child(2)").text()
    let gwangju_today_domestic = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(6) > td:nth-child(3)").text()
    let gwangju_today_foreign = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(6) > td:nth-child(4)").text()
    let gwangju_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(6) > td:nth-child(5)").text()
    let gwangju_care = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(6) > td:nth-child(6)").text()
    let gwangju_recover = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(6) > td:nth-child(7)").text()
    let gwangju_death = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(6) > td:nth-child(8)").text()
    let gwangju_incidence = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(6) > td:nth-child(9)").text()

    let daejeon_today_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(7) > td:nth-child(2)").text()
    let daejeon_today_domestic = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(7) > td:nth-child(3)").text()
    let daejeon_today_foreign = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(7) > td:nth-child(4)").text()
    let daejeon_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(7) > td:nth-child(5)").text()
    let daejeon_care = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(7) > td:nth-child(6)").text()
    let daejeon_recover = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(7) > td:nth-child(7)").text()
    let daejeon_death = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(7) > td:nth-child(8)").text()
    let daejeon_incidence = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(7) > td:nth-child(9)").text()

    let ulsan_today_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(8) > td:nth-child(2)").text()
    let ulsan_today_domestic = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(8) > td:nth-child(3)").text()
    let ulsan_today_foreign = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(8) > td:nth-child(4)").text()
    let ulsan_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(8) > td:nth-child(5)").text()
    let ulsan_care = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(8) > td:nth-child(6)").text()
    let ulsan_recover = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(8) > td:nth-child(7)").text()
    let ulsan_death = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(8) > td:nth-child(8)").text()
    let ulsan_incidence = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(8) > td:nth-child(9)").text()

    let sejong_today_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(9) > td:nth-child(2)").text()
    let sejong_today_domestic = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(9) > td:nth-child(3)").text()
    let sejong_today_foreign = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(9) > td:nth-child(4)").text()
    let sejong_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(9) > td:nth-child(5)").text()
    let sejong_care = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(9) > td:nth-child(6)").text()
    let sejong_recover = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(9) > td:nth-child(7)").text()
    let sejong_death = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(9) > td:nth-child(8)").text()
    let sejong_incidence = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(9) > td:nth-child(9)").text()

    let gyeonggi_today_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(10) > td:nth-child(2)").text()
    let gyeonggi_today_domestic = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(10) > td:nth-child(3)").text()
    let gyeonggi_today_foreign = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(10) > td:nth-child(4)").text()
    let gyeonggi_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(10) > td:nth-child(5)").text()
    let gyeonggi_care = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(10) > td:nth-child(6)").text()
    let gyeonggi_recover = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(10) > td:nth-child(7)").text()
    let gyeonggi_death = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(10) > td:nth-child(8)").text()
    let gyeonggi_incidence = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(10) > td:nth-child(9)").text()

    let gangwon_today_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(11) > td:nth-child(2)").text()
    let gangwon_today_domestic = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(11) > td:nth-child(3)").text()
    let gangwon_today_foreign = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(11) > td:nth-child(4)").text()
    let gangwon_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(11) > td:nth-child(5)").text()
    let gangwon_care = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(11) > td:nth-child(6)").text()
    let gangwon_recover = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(11) > td:nth-child(7)").text()
    let gangwon_death = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(11) > td:nth-child(8)").text()
    let gangwon_incidence = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(11) > td:nth-child(9)").text()

    let chungbuk_today_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(12) > td:nth-child(2)").text()
    let chungbuk_today_domestic = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(12) > td:nth-child(3)").text()
    let chungbuk_today_foreign = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(12) > td:nth-child(4)").text()
    let chungbuk_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(12) > td:nth-child(5)").text()
    let chungbuk_care = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(12) > td:nth-child(6)").text()
    let chungbuk_recover = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(12) > td:nth-child(7)").text()
    let chungbuk_death = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(12) > td:nth-child(8)").text()
    let chungbuk_incidence = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(12) > td:nth-child(9)").text()

    let chungnam_today_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(13) > td:nth-child(2)").text()
    let chungnam_today_domestic = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(13) > td:nth-child(3)").text()
    let chungnam_today_foreign = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(13) > td:nth-child(4)").text()
    let chungnam_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(13) > td:nth-child(5)").text()
    let chungnam_care = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(13) > td:nth-child(6)").text()
    let chungnam_recover = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(13) > td:nth-child(7)").text()
    let chungnam_death = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(13) > td:nth-child(8)").text()
    let chungnam_incidence = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(13) > td:nth-child(9)").text()

    let jeollabuk_today_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(14) > td:nth-child(2)").text()
    let jeollabuk_today_domestic = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(14) > td:nth-child(3)").text()
    let jeollabuk_today_foreign = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(14) > td:nth-child(4)").text()
    let jeollabuk_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(14) > td:nth-child(5)").text()
    let jeollabuk_care = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(14) > td:nth-child(6)").text()
    let jeollabuk_recover = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(14) > td:nth-child(7)").text()
    let jeollabuk_death = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(14) > td:nth-child(8)").text()
    let jeollabuk_incidence = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(14) > td:nth-child(9)").text()

    let jeollanam_today_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(15) > td:nth-child(2)").text()
    let jeollanam_today_domestic = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(15) > td:nth-child(3)").text()
    let jeollanam_today_foreign = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(15) > td:nth-child(4)").text()
    let jeollanam_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(15) > td:nth-child(5)").text()
    let jeollanam_care = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(15) > td:nth-child(6)").text()
    let jeollanam_recover = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(15) > td:nth-child(7)").text()
    let jeollanam_death = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(15) > td:nth-child(8)").text()
    let jeollanam_incidence = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(15) > td:nth-child(9)").text()

    let gyeongbuk_today_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(16) > td:nth-child(2)").text()
    let gyeongbuk_today_domestic = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(16) > td:nth-child(3)").text()
    let gyeongbuk_today_foreign = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(16) > td:nth-child(4)").text()
    let gyeongbuk_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(16) > td:nth-child(5)").text()
    let gyeongbuk_care = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(16) > td:nth-child(6)").text()
    let gyeongbuk_recover = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(16) > td:nth-child(7)").text()
    let gyeongbuk_death = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(16) > td:nth-child(8)").text()
    let gyeongbuk_incidence = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(16) > td:nth-child(9)").text()

    let gyeongnam_today_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(17) > td:nth-child(2)").text()
    let gyeongnam_today_domestic = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(17) > td:nth-child(3)").text()
    let gyeongnam_today_foreign = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(17) > td:nth-child(4)").text()
    let gyeongnam_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(17) > td:nth-child(5)").text()
    let gyeongnam_care = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(17) > td:nth-child(6)").text()
    let gyeongnam_recover = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(17) > td:nth-child(7)").text()
    let gyeongnam_death = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(17) > td:nth-child(8)").text()
    let gyeongnam_incidence = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(17) > td:nth-child(9)").text()

    let jeju_today_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(18) > td:nth-child(2)").text()
    let jeju_today_domestic = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(18) > td:nth-child(3)").text()
    let jeju_today_foreign = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(18) > td:nth-child(4)").text()
    let jeju_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(18) > td:nth-child(5)").text()
    let jeju_care = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(18) > td:nth-child(6)").text()
    let jeju_recover = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(18) > td:nth-child(7)").text()
    let jeju_death = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(18) > td:nth-child(8)").text()
    let jeju_incidence = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(18) > td:nth-child(9)").text()

    let quarantine_today_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(19) > td:nth-child(2)").text()
    let quarantine_today_domestic = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(19) > td:nth-child(3)").text()
    let quarantine_today_foreign = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(19) > td:nth-child(4)").text()
    let quarantine_total = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(19) > td:nth-child(5)").text()
    let quarantine_care = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(19) > td:nth-child(6)").text()
    let quarantine_recover = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(19) > td:nth-child(7)").text()
    let quarantine_death = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(19) > td:nth-child(8)").text()
    let quarantine_incidence = $("#content > div > div.data_table.midd.mgt24 > table > tbody > tr:nth-child(19) > td:nth-child(9)").text()

    const seoul = {
      today: {
        total: seoul_today_total,
        domestic: seoul_today_domestic,
        foreign: seoul_today_foreign,
      },
      total: seoul_total,
      care: seoul_care,
      recover: seoul_recover,
      death: seoul_death,
      incidence: seoul_incidence
    }

    const busan = {
      today: {
        total: busan_today_total,
        domestic: busan_today_domestic,
        foreign: busan_today_foreign,
      },
      total: busan_total,
      care: busan_care,
      recover: busan_recover,
      death: busan_death,
      incidence: busan_incidence
    }

    const daegu = {
      today: {
        total: daegu_today_total,
        domestic: daegu_today_domestic,
        foreign: daegu_today_foreign,
      },
      total: daegu_total,
      care: daegu_care,
      recover: daegu_recover,
      death: daegu_death,
      incidence: daegu_incidence
    }

    const incheon = {
      today: {
        total: incheon_today_total,
        domestic: incheon_today_domestic,
        foreign: incheon_today_foreign,
      },
      total: incheon_total,
      care: incheon_care,
      recover: incheon_recover,
      death: incheon_death,
      incidence: incheon_incidence
    }

    const gwangju = {
      today: {
        total: gwangju_today_total,
        domestic: gwangju_today_domestic,
        foreign: gwangju_today_foreign,
      },
      total: gwangju_total,
      care: gwangju_care,
      recover: gwangju_recover,
      death: gwangju_death,
      incidence: gwangju_incidence
    }

    const daejeon = {
      today: {
        total: daejeon_today_total,
        domestic: daejeon_today_domestic,
        foreign: daejeon_today_foreign,
      },
      total: daejeon_total,
      care: daejeon_care,
      recover: daejeon_recover,
      death: daejeon_death,
      incidence: daejeon_incidence
    }

    const ulsan = {
      today: {
        total: ulsan_today_total,
        domestic: ulsan_today_domestic,
        foreign: ulsan_today_foreign,
      },
      total: ulsan_total,
      care: ulsan_care,
      recover: ulsan_recover,
      death: ulsan_death,
      incidence: ulsan_incidence
    }

    const sejong = {
      today: {
        total: sejong_today_total,
        domestic: sejong_today_domestic,
        foreign: sejong_today_foreign,
      },
      total: sejong_total,
      care: sejong_care,
      recover: sejong_recover,
      death: sejong_death,
      incidence: sejong_incidence
    }

    const gyeonggi = {
      today: {
        total: gyeonggi_today_total,
        domestic: gyeonggi_today_domestic,
        foreign: gyeonggi_today_foreign,
      },
      total: gyeonggi_total,
      care: gyeonggi_care,
      recover: gyeonggi_recover,
      death: gyeonggi_death,
      incidence: gyeonggi_incidence
    }

    const gangwon = {
      today: {
        total: gangwon_today_total,
        domestic: gangwon_today_domestic,
        foreign: gangwon_today_foreign,
      },
      total: gangwon_total,
      care: gangwon_care,
      recover: gangwon_recover,
      death: gangwon_death,
      incidence: gangwon_incidence
    }

    const chungbuk = {
      today: {
        total: chungbuk_today_total,
        domestic: chungbuk_today_domestic,
        foreign: chungbuk_today_foreign,
      },
      total: chungbuk_total,
      care: chungbuk_care,
      recover: chungbuk_recover,
      death: chungbuk_death,
      incidence: chungbuk_incidence
    }

    const chungnam = {
      today: {
        total: chungnam_today_total,
        domestic: chungnam_today_domestic,
        foreign: chungnam_today_foreign,
      },
      total: chungnam_total,
      care: chungnam_care,
      recover: chungnam_recover,
      death: chungnam_death,
      incidence: chungnam_incidence
    }

    const jeollabuk = {
      today: {
        total: jeollabuk_today_total,
        domestic: jeollabuk_today_domestic,
        foreign: jeollabuk_today_foreign,
      },
      total: jeollabuk_total,
      care: jeollabuk_care,
      recover: jeollabuk_recover,
      death: jeollabuk_death,
      incidence: jeollabuk_incidence
    }

    const jeollanam = {
      today: {
        total: jeollanam_today_total,
        domestic: jeollanam_today_domestic,
        foreign: jeollanam_today_foreign,
      },
      total: jeollanam_total,
      care: jeollanam_care,
      recover: jeollanam_recover,
      death: jeollanam_death,
      incidence: jeollanam_incidence
    }

    const gyeongbuk = {
      today: {
        total: gyeongbuk_today_total,
        domestic: gyeongbuk_today_domestic,
        foreign: gyeongbuk_today_foreign,
      },
      total: gyeongbuk_total,
      care: gyeongbuk_care,
      recover: gyeongbuk_recover,
      death: gyeongbuk_death,
      incidence: gyeongbuk_incidence
    }

    const gyeongnam = {
      today: {
        total: gyeongnam_today_total,
        domestic: gyeongnam_today_domestic,
        foreign: gyeongnam_today_foreign,
      },
      total: gyeongnam_total,
      care: gyeongnam_care,
      recover: gyeongnam_recover,
      death: gyeongnam_death,
      incidence: gyeongnam_incidence
    }

    const jeju = {
      today: {
        total: jeju_today_total,
        domestic: jeju_today_domestic,
        foreign: jeju_today_foreign,
      },
      total: jeju_total,
      care: jeju_care,
      recover: jeju_recover,
      death: jeju_death,
      incidence: jeju_incidence
    }

    const quarantine = {
      today: {
        total: quarantine_today_total,
        domestic: quarantine_today_domestic,
        foreign: quarantine_today_foreign,
      },
      total: quarantine_total,
      care: quarantine_care,
      recover: quarantine_recover,
      death: quarantine_death,
      incidence: quarantine_incidence
    }

    db.collection('coronas').findOneAndUpdate({ _id: "korea" }, {
      $set: {
        city: {
          seoul: seoul,
          busan: busan,
          daegu: daegu,
          incheon: incheon,
          gwangju: gwangju,
          daejeon: daejeon,
          ulsan: ulsan,
          sejong: sejong,
          gyeonggi: gyeonggi,
          gangwon: gangwon,
          chungbuk: chungbuk,
          chungnam: chungnam,
          jeollabuk: jeollabuk,
          jeollanam: jeollanam,
          gyeongbuk: gyeongbuk,
          gyeongnam: gyeongnam,
          jeju: jeju,
          quarantine: quarantine,
          updated: moment(Date.now()).format("YYYY.MM.DD A hh.mm.ss")
        }
      }
    })
  })
}

/**
 * 09시 50분에 스캐쥴러애 의해 자동으로 업데이트 됨
 */
const covid = schedule.scheduleJob('00 50 9 * * *', function () {
  koreaUpdate()
  ageUpdate()
  gender_Update()
  vaccine_Update()
  social_distancing_Update()
  city_Update()
  console.log(chalk.cyan(chalk.bold("[ DATABASE ] ")) + `Updated covid-19 datas`)

  const Hook = new webhook.Webhook("https://discord.com/api/webhooks/848770957069778944/0i2x5FkiU1biiZYSi0cHNnR4FPIHxA-0tLlOjh_NjpjbCSzEveBU8wKQWPreKI-af2t0")

  const msg = new webhook.MessageBuilder()
    .setName("Corona API Update")
    .setDescription(`**코로나19** 데이터가 업데이트 되었습니다.`)
    .setColor("#5DFA25")

  Hook.send(msg).catch((err) => {
    console.log(err)
  })
});
