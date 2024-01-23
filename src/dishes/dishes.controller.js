const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function hasProperty(propertyName) {
    return function(req, res, next) {
        const { data = {} } = req.body;
        if(data[propertyName]) {
            return next();
        }
        next({
            status: 400,
            message: `Must include a ${propertyName}`
        });
    };
}

function priceIsValid(req, res, next) {
    const { data: { price } = {} } = req.body;
    if(price > 0 && Number.isInteger(price)) {
        return next();
    }
    next({
        status: 400,
        message: `Dish must have a price that is an integer greater than 0`
    });
}

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find(dish => dish.id == dishId);
    if(foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status:404,
        message: `Dish does not exist: ${dishId}`
    });
}

function dishIdMatches(req, res, next) {
    const { data: { id } = {} } = req.body;
    const dish = res.locals.dish;
    if(!id || id === dish.id) {
        return next();
    }
    next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dish.id}`
    });
}

function create(req, res) {
    const {data: { name, description, price, image_url} = {} } = req.body;
    const newDish = {
        id: nextId(),
        name: name,
        description: description,
        price: price,
        image_url: image_url
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function list(req, res) {
    res.json({ data: dishes });
}

function read(req, res, next) {
    res.json({ data: res.locals.dish });
}

function update(req, res) {
    const dish = res.locals.dish;
    const { data: { name, description, price, image_url } = {} } = req.body;

    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;

    res.json({ data: dish });
}

module.exports = {
    create: [
        hasProperty("name"),
        hasProperty("description"),
        hasProperty("price"),
        hasProperty("image_url"),
        priceIsValid,
        create
    ],
    list,
    read: [
        dishExists,
        read
    ],
    update: [
        dishExists,
        dishIdMatches,
        hasProperty("name"),
        hasProperty("description"),
        hasProperty("price"),
        hasProperty("image_url"),
        priceIsValid,
        update
    ],
}