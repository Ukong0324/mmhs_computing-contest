const express = require("express");
const bodyParser = require("body-parser");
const chalk = require("chalk");
const mongoose = require("mongoose");

const app = express();
const settings = require("./settings.js");

app.get("/", (req, res) => {
    res.send({
        "message": "ok",
        "status": res.statusCode
    })
})

mongoose.connect(settings.config.mongo.url, { 
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true 
}).then((res) => {
    const version = res.connections[0]._connectionOptions.driverInfo.version;
    console.log(chalk.cyan(chalk.bold("[ DATABASE ] ")) + chalk.bold(`Connected the databases | ${res.connections[0].host + ":" + res.connections[0].port} | Mongo Version ${version}`));
});

app.listen(settings.config.port, () => {
    console.log(chalk.green(chalk.bold("[ SERVER ] ")) + chalk.bold(`Server running on port: http://localhost:${settings.config.port}`));
})
