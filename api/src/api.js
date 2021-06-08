const express = require("express");
const chalk = require("chalk");
const mongoose = require("mongoose");
const api = require("./routes/api.js");
const app = express();
const settings = require("../config.js");

app.get("/", (req, res) => {
    res.redirect("https://github.com/Ukong0324/mmhs_computing-contest")
})

app.use("/api", api);

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
    console.log(chalk.green(chalk.bold("[ SERVER ] ")) + chalk.bold(`Server running on this url: https://localhost:${settings.config.port}`));
})