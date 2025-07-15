import Cart from '../models/cart.model.js';
import Product from '../models/products.model.js';

export const getCart = async (req, res) => {
  const userId = req.user._id;
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  res.json({ cart: cart ? cart.items.map(item => ({
    ...item.toObject(),
    ...item.product.toObject(),
    quantity: item.quantity
  })) : [] });
};

export const addToCart = async (req, res) => {
  const userId = req.user._id;
  const { productId, quantity } = req.body;
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = new Cart({ user: userId, items: [] });
  const idx = cart.items.findIndex(i => i.product.toString() === productId);
  if (idx > -1) {
    cart.items[idx].quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }
  await cart.save();
  res.json({ success: true });
};

export const updateCartItem = async (req, res) => {
  const userId = req.user._id;
  const { productId, quantity } = req.body;
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return res.status(404).json({ message: 'Cart not found' });
  const item = cart.items.find(i => i.product.toString() === productId);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  item.quantity = quantity;
  await cart.save();
  res.json({ success: true });
};

export const removeCartItem = async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return res.status(404).json({ message: 'Cart not found' });
  cart.items = cart.items.filter(i => i.product.toString() !== productId);
  await cart.save();
  res.json({ success: true });
}; 