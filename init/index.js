const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/voyage";

main()
    .then(() => {
        console.log("connected to db");
    })
    .catch((err) => {
        console.log(err);
    })

async function main() {
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    await Listing.deleteMany({});
    const updatedData = initData.data.map((obj) => ({...obj, owner: "66f6bdb72a0158ef9432d460"}));
    await Listing.insertMany(updatedData);
    console.log("data was initialized");
}

initDB();