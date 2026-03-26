const cartService = require('../services/cart.service');


exports.getCart = async (req, res, next) => {
    try {
        const userId = req.user ? req.user.id : null;
        const sessionId =req.headers['x-session-id'];
        const { cart, message } = await cartService.getCart(userId, sessionId);
        res.status(200).json({ success: true, message, cart });
    }
    catch (err) 
    {
        next(err);
    }
}

exports.addItemToCart = async (req, res, next) => {
    try {
        const userId = req.user ? req.user.id : null;
        const sessionId = req.headers['x-session-id'];
        const{productId, quantity} = req.body;
        const { cart, message } = await cartService.addItemToCart(userId, sessionId, productId, quantity );
        res.status(200).json({ success: true, message, cart });
    }catch(err) {
        next(err);
    }
}

exports.updateCartItemQuantity = async (req, res, next) => {
    try {
        const userId = req.user ? req.user.id : null;
        const sessionId = req.headers['x-session-id'];
        const{productId, quantity} = req.body;
        const { cart, message } = await cartService.updateCartItemQuantity(userId, sessionId,  productId, quantity );
        res.status(200).json({ success: true, message,  cart });
    }catch(err) {
        next(err);
    }
}

exports.removeItemFromCart = async (req, res, next) => {
    try{
        const userId = req.user ? req.user.id : null;
        const sessionId = req.headers['x-session-id'];
        const{productId} = req.body;
        const { cart, message } = await cartService.removeItemFromCart(userId, sessionId, productId);
        res.status(200).json({ success: true, message,  cart });
    }catch(err) {
        next(err);
    }
}

exports.mergeGuestCart = async (req, res, next) => {
    try{
        const userId = req.user ? req.user.id : null;
        const sessionId = req.headers['x-session-id'];
        const { cart, message } = await cartService.mergeGuestCart(userId, sessionId);
        res.status(200).json({ success: true, message, cart });
    }catch(err) {
        next(err);
    }   
}

exports.calculateOrderSummary = async (req, res, next) => {
    try{
        const userId = req.user ? req.user.id : null;
        const sessionId = req.headers['x-session-id'];
        const {discount, finalTotal, itemCount} = await cartService.calculateOrderSummary(userId, sessionId);
        res.status(200).json({ success: true, discount, finalTotal, itemCount });
    }catch(err) {
        next(err);
    }
}

exports.checkout = async (req, res, next) => {
    try{
        const userId = req.user ? req.user.id : null;   
        const sessionId = req.headers['x-session-id'];
        const{reciept, message} = await cartService.checkout(userId, sessionId);
        res.status(200).json({ success: true, message,  reciept });
    }catch(err) {
        next(err);
    }
}



