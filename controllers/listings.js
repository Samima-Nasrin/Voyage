const Listing = require("../models/listing");
const opencage = require("opencage-api-client");
const gcToken = process.env.OPENCAGE_API_KEY;

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings});
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id).populate({path: "reviews", populate: {path: "author",},}).populate("owner");
    if(!listing) {
        req.flash("error", "Listing you requested for does not exist");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
    const address = req.body.Listing.location; // The address to geocode
    try {
        let response = await opencage.geocode({ q: address, key: gcToken });

        if (response.results.length > 0) {
            const firstResult = response.results[0];
            const lng = firstResult.geometry.lng; 
            const lat = firstResult.geometry.lat; 

            let url = req.file.path;
            let filename = req.file.filename;
            const newListing = new Listing(req.body.Listing);
            newListing.owner = req.user._id;
            newListing.image = { url, filename };
            newListing.geometry = {
                type: "Point",
                coordinates: [lng, lat]
            };


            let savedListing = await newListing.save();
            console.log(savedListing);

            req.flash("success", "New Listing Created!");
            return res.redirect("/listings"); 
        } else {
            console.error('No results found for the geocoding request.');
            req.flash("error", "Geocoding failed. Address not found.");
            return res.redirect("/listings/new"); 
        }
        
    } catch (error) {
        console.error('Error during geocoding:', error);
        req.flash("error", "Geocoding service is currently unavailable.");
        return res.redirect("/listings/new");
    }   
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing) {
        req.flash("error", "Listing you requested for does not exist");
        return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_10,w_10");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.Listing });

    if(typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }
    
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};