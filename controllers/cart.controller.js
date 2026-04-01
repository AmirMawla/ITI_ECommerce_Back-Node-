const cartService = require('../services/cart.service');


exports.getCart = async (req, res, next) => {
    try {
        const userId = req.user ? req.user.id : null;
        const sessionId =req.headers['x-session-id'];
        const { cart, message } = await cartService.getCartPopulated(userId, sessionId);
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

exports.isItemInCart = async (req,res,next) =>{
    try{
        const userId = req.user ? req.user.id : null;
        const sessionId = req.headers['x-session-id'];
        const{productId} = req.params;

        const isExist = await cartService.isItemInCart(userId,sessionId,productId)
        if(!isExist) res.status(404).json({ isExist});

        res.status(200).json({ isExist });
    }catch(error){
        next(error)
    }
    
}

exports.updateCartItemQuantity = async (req, res, next) => {
    try {
        const userId = req.user ? req.user.id : null;
        const sessionId = req.headers['x-session-id'];
        const{productId, quantity} = req.body;

        const isExist = await cartService.isItemInCart(userId,sessionId,productId)
        if(!isExist) res.status(404).json({ success: false, message:"item not found in cart. try to use addItemToCart instead"});

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

        const isExist = await cartService.isItemInCart(userId,sessionId,productId)
        if(!isExist) res.status(404).json({ success: false, message:"item not found in cart."});

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



