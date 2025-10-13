import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, default: 1, min: 1 },
  // Optional selected variant details
  variant: {
    name: { type: String, trim: true },
    sku: { type: String, trim: true },
    attributes: { type: Map, of: String },
    price: { type: Number, min: 0 }
  }
});

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema]
});

export default mongoose.model('Cart', cartSchema); 