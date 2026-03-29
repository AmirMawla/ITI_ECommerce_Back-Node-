const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const APIError = require('../Errors/APIError');


exports.getCart = async(userId,sessionId)=>{
    const query = userId ? { userId } : { sessionId, userId: null }
    let cart = await Cart.findOne(query)
    let message = "Cart retrived successfully"
    if(!cart){
        cart = await Cart.create({userId,sessionId})
        message = "New cart created"
    }
    return {cart ,message}
}


exports.addItemToCart = async(userId,sessionId,productId,quantity)=>{
    const {cart} =await this.getCart(userId,sessionId)

    const product = await Product.findById(productId)
    if(!product) throw new APIError("Product not found",404)
    if(product.stock < quantity) throw new APIError("Not enough stock",400)

    await cart.addItem(productId,quantity,product.price)

    return {cart, message:"Item added to cart"}
}


exports.updateCartItemQuantity = async(userId,sessionId,productId,quantity)=>{
    const {cart} =await this.getCart(userId,sessionId)
    
    const product = await Product.findById(productId)
    if(!product) throw new APIError("Product not found",404)

    cart.updateQuantity(productId,quantity)
    return {cart, message:"Cart item quantity updated"}
}


exports.removeItemFromCart = async(userId,sessionId,productId)=>{
    const {cart} =await this.getCart(userId,sessionId)

    const product = await Product.findById(productId)
    if(!product) throw new APIError("Product not found",404)

    cart.removeItem(productId)
    return {cart, message:"Item removed from cart"}
}


exports.mergeGuestCart = async (userId,sessionId)=>{
    const guestCart = await Cart.findOne({sessionId, userId: null})
    if(!guestCart) return {message:"No guest cart to merge"}
    let userCart = await Cart.findOne({userId})
    let finalCart ;
    if(userCart && userCart.items.length > 0){
        for(const item of guestCart.items){
            await userCart.addItem(item.productId,item.quantity,item.priceAtAddTime)
        }
        await Cart.findByIdAndDelete(guestCart._id)
        finalCart = userCart
    }else if(userCart && userCart.items.length == 0){
        await Cart.findByIdAndDelete(userCart._id)
        guestCart.userId = userId
        await guestCart.save()
        finalCart = guestCart
    }else{
        let linked = await Cart.findOne({ userId })
        if (linked) {
            for (const item of guestCart.items) {
                await linked.addItem(item.productId, item.quantity, item.priceAtAddTime)
            }
            await Cart.findByIdAndDelete(guestCart._id)
            finalCart = linked
        } else {
            guestCart.userId = userId
            try {
                await guestCart.save()
                finalCart = guestCart
            } catch (e) {
                if (e?.code !== 11000) throw e
                linked = await Cart.findOne({ userId })
                if (!linked) throw e
                for (const item of guestCart.items) {
                    await linked.addItem(item.productId, item.quantity, item.priceAtAddTime)
                }
                await Cart.findByIdAndDelete(guestCart._id)
                finalCart = linked
            }
        }
    }
    return {cart: finalCart, message:"Guest cart merged to user cart"}
}


exports.calculateOrderSummary = async(userId,sessionId,)=>{
    const {cart} =await this.getCart(userId,sessionId)
    const discount = cart.discountAmount || 0
    const finalTotal = cart.total
    const itemCount = cart.itemCount
    return {discount, finalTotal, itemCount}
}


exports.checkout = async(userId,sessionId)=>{
    const {cart} =await this.getCart(userId,sessionId)
    if(cart.items.length == 0) throw new APIError("Cart is empty",400)
    const reciept = await this.calculateOrderSummary(userId,sessionId)
    for(const item of cart.items){
        const product = await Product.findById(item.productId)
        if(product.stock < item.quantity){
            throw new APIError(`Not enough stock for product ${product.name}`,400)
        }else{
            product.stock -= item.quantity
            await product.save()
        }
    }
    // Here you would integrate with a payment gateway and create an order record
    // For simplicity, we'll just return the reciept and clear the cart
    await cart.clear()
    return {message:"Checkout initiated", reciept}
    
}