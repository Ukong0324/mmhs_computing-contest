module.exports.config = {
    port: 80,
    ip: "0.0.0.0",
    mongo: {
        url: "mongodb://<Username>:<Password>!@<Database IP>:27017/<Database Name>?retryWrites=true&w=majority"
    }
}