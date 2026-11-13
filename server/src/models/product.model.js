import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  size: { type: String, required: true },
  color: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, min: 0, default: 0 },
});

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  altText: { type: String, required: true },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    gender: {
      type: String,
      enum: ["men", "women", "unisex", "kids"],
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
    },
    variants: {
      type: [variantSchema],
      default: [],
    },
    images: {
      type: [imageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const Product = mongoose.model("Product", productSchema);

export default Product;
