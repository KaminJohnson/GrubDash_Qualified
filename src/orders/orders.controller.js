const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
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

function dishIsAnArray(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    if(Array.isArray(dishes) && dishes.length > 0) {
        return next();
    }
    next({
        status: 400,
        message: `Order must include at least one dish`
    });
}

function dishesAreValid(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    for(let index = 0; index < dishes.length; index++) {
        const dish = dishes[index];
        if(dish.quantity && Number.isInteger(dish.quantity) && dish.quantity > 0) {
            continue;
        } else {
            return next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`
            });
        }
    }
    next();
}

function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id == orderId);
    if(foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status:404,
        message: `Order does not exist: ${orderId}`
    });
}

function orderIdMatches(req, res, next) {
    const { data: { id } = {} } = req.body;
    const order = res.locals.order;
    if(!id ||id === order.id) {
        return next();
    }
    next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${order.id}`
    });
}

function statusIsNotDelivered(req, res, next) {
    const { data: { status } = {} } = req.body;
    if(status !== "delivered"){ 
        return next();
    }
    next({
        status: 400,
        message: `A delivered order cannot be changed`
    });
}

const validStatuses = ["pending", "preparing", "out-for-delivery"];

function statusIsValid(req, res, next) {
    const { data: { status } = {} } = req.body;
    if(validStatuses.includes(status)) { 
        return next();
    }
    next({
        status: 400,
        message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
    });
}

function statusNotPending(req, res, next) {
    const savedOrder = res.locals.order;
    if(savedOrder.status === "pending") {
        return next();
    }
    next({
        status: 400,
        message: `An order cannot be deleted unless it is pending. Returns a 400 status code`
    })
}

function create(req, res) {
    const {data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        status: status,
        dishes: [...dishes]
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function list(req, res) {
    res.json({ data: orders });
}

function read(req, res, next) {
    res.json({ data: res.locals.order });
}

function update(req, res) {
    const order = res.locals.order;
    const { data: {  deliverTo, mobileNumber, status } = {} } = req.body;

    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;

    res.json({ data: order });
}

function destroy(req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    // `splice()` returns an array of the deleted elements, even if it is one element
    const deletedPastes = orders.splice(index, 1);
    res.sendStatus(204);
  }

module.exports = {
    create: [
        hasProperty("deliverTo"),
        hasProperty("mobileNumber"),
        hasProperty("dishes"),
        dishIsAnArray,
        dishesAreValid,
        create
    ],
    list,
    read: [
        orderExists,
        read
    ],
    update: [
        orderExists,
        orderIdMatches,
        hasProperty("status"),
        hasProperty("deliverTo"),
        hasProperty("mobileNumber"),
        hasProperty("dishes"),
        dishIsAnArray,
        dishesAreValid,
        statusIsValid,
        statusIsNotDelivered,
        update
    ],
    delete: [
        orderExists,
        statusNotPending,
        destroy
    ]
}