const express = require("express");
const router = express.Router();
const db = require('mongoose').connection

router.get("/", (req, res) => {
    res.send({
        "message": "ok",
        "statusCode": res.statusCode
    })
})

router.get("/korea", (req, res) => {
    db.collection('coronas').findOne({ _id: "korea" }, async (err, resp) => {
        res.send(resp.korea)
    })
})

router.get("/age", (req, res) => {
    db.collection('coronas').findOne({ _id: "korea" }, async (err, resp) => {
        res.send(resp.age)
    })
})

router.get("/age_dead", (req, res) => {
    db.collection('coronas').findOne({ _id: "korea" }, async (err, resp) => {
        res.send(resp.age_dead)
    })
})
router.get("/age_critical", (req, res) => {
    db.collection('coronas').findOne({ _id: "korea" }, async (err, resp) => {
        res.send(resp.age_critical)
    })
})
router.get("/gender", (req, res) => {
    db.collection('coronas').findOne({ _id: "korea" }, async (err, resp) => {
        res.send(resp.gender)
    })
})
module.exports = router