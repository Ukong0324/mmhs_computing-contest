const schedule = require('node-schedule');
const settings = require("../settings.js")
const cheerio = require('cheerio');
const request = require('request');
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

function koreaUpdate() {
  request(`http://ncov.mohw.go.kr/`, function (error, response, body) {
    const $ = cheerio.load(body);

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
      }).then(() => {

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
            ]
          },
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

        line_chart.toFile('../example/age.png');
      })
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
      db.collection('coronas').findOneAndUpdate({ _id: "korea" }, {
        $set: {
          age_dead: {
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
      }).then(() => {
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
            ]
          },
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

        line_chart.toFile('../example/age_dead.png');
      })
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
      db.collection('coronas').findOneAndUpdate({ _id: "korea" }, {
        $set: {
          age_critical: {
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
      }).then(() => {
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
            ]
          },
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

        line_chart.toFile('../example/age_critical.png');
      })

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
      db.collection('coronas').findOneAndUpdate({ _id: "korea" }, {
        $set: {
          gender: {
            man_total: man_total,
            women_total: women_total,
            man_dead: man_dead,
            women_dead: women_dead,
            man_critical: man_critical,
            women_critical: women_critical,
            updated: moment(Date.now()).format("YYYY.MM.DD A hh.mm.ss")
          }
        }
      })
    } catch (e) {
      console.log(e)
    }

  })
}

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
      first_today_result: first_today_seoul_result,
      first_today_total: first_today_seoul_total,
      second_today_result: second_today_seoul_result,
      second_today_total: second_today_seoul_total
    }
    const busan = {
      first_today_result: first_today_busan_result,
      first_today_total: first_today_busan_total,
      second_today_result: second_today_busan_result,
      second_today_total: second_today_busan_total
    }
    const daegu = {
      first_today_result: first_today_daegu_result,
      first_today_total: first_today_daegu_total,
      second_today_result: second_today_daegu_result,
      second_today_total: second_today_daegu_total
    }
    const incheon = {
      first_today_result: first_today_incheon_result,
      first_today_total: first_today_incheon_total,
      second_today_result: second_today_incheon_result,
      second_today_total: second_today_incheon_total
    }
    const gwangju = {
      first_today_result: first_today_gwangju_result,
      first_today_total: first_today_gwangju_total,
      second_today_result: second_today_gwangju_result,
      second_today_total: second_today_gwangju_total
    }
    const daejeon = {
      first_today_result: first_today_daejeon_result,
      first_today_total: first_today_daejeon_total,
      second_today_result: second_today_daejeon_result,
      second_today_total: second_today_daejeon_total
    }
    const ulsan = {
      first_today_result: first_today_ulsan_result,
      first_today_total: first_today_ulsan_total,
      second_today_result: second_today_ulsan_result,
      second_today_total: second_today_ulsan_total
    }
    const sejong = {
      first_today_result: first_today_sejong_result,
      first_today_total: first_today_sejong_total,
      second_today_result: second_today_sejong_result,
      second_today_total: second_today_sejong_total
    }
    const gyeonggi = {
      first_today_result: first_today_gyeonggi_result,
      first_today_total: first_today_gyeonggi_total,
      second_today_result: second_today_gyeonggi_result,
      second_today_total: second_today_gyeonggi_total
    }
    const gangwon = {
      first_today_result: first_today_gangwon_result,
      first_today_total: first_today_gangwon_total,
      second_today_result: second_today_gangwon_result,
      second_today_total: second_today_gangwon_total
    }
    const chungbuk = {
      first_today_result: first_today_chungbuk_result,
      first_today_total: first_today_chungbuk_total,
      second_today_result: second_today_chungbuk_result,
      second_today_total: second_today_chungbuk_total
    }
    const chungnam = {
      first_today_result: first_today_chungnam_result,
      first_today_total: first_today_chungnam_total,
      second_today_result: second_today_chungnam_result,
      second_today_total: second_today_chungnam_total
    }
    const jeollabuk = {
      first_today_result: first_today_jeollabuk_result,
      first_today_total: first_today_jeollabuk_total,
      second_today_result: second_today_jeollabuk_result,
      second_today_total: second_today_jeollabuk_total
    }
    const jeollanam = {
      first_today_result: first_today_jeollanam_result,
      first_today_total: first_today_jeollanam_total,
      second_today_result: second_today_jeollanam_result,
      second_today_total: second_today_jeollanam_total
    }
    const gyeongbuk = {
      first_today_result: first_today_gyeongbuk_result,
      first_today_total: first_today_gyeongbuk_total,
      second_today_result: second_today_gyeongbuk_result,
      second_today_total: second_today_gyeongbuk_total
    }
    const gyeongnam = {
      first_today_result: first_today_gyeongnam_result,
      first_today_total: first_today_gyeongnam_total,
      second_today_result: second_today_gyeongnam_result,
      second_today_total: second_today_gyeongnam_total
    }
    const jeju = {
      first_today_result: first_today_jeju_result,
      first_today_total: first_today_jeju_total,
      second_today_result: second_today_jeju_result,
      second_today_total: second_today_jeju_total
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
          incheon: incheon.slice(0,2)[0],
          gwangju: check_space(gwangju),
          daejeon: check_space(daejeon),
          ulsan: ulsan.slice(0,2)[0],
          sejong: check_space(sejong),
          gyeonggi: gyeonggi.slice(0,2)[0],
          gangwon: check_space(gangwon),
          chungbuk: check_space(chungbuk),
          chungnam: check_space(chungnam),
          jeollabuk: check_space(jeollabuk),
          jeollanam: (Number(jeollanam.slice(0,2)[0]) - 1).toLocaleString(),
          gyeongbuk: check_space(gyeongbuk),
          gyeongnam: check_space(gyeongnam),
          jeju: (Number(jeju.slice(0,2)[0]) + 1).toLocaleString(),
          updated: moment(Date.now()).format("YYYY.MM.DD A hh.mm.ss")
        }
      }
    })
})
}
const covid = schedule.scheduleJob('00 50 9 * * *', function () {
  koreaUpdate()
  ageUpdate()
  age_dead_Update()
  age_critical_Update()
  age_critical_Update()
  gender_Update()
  vaccine_Update()
  social_distancing_Update()
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
