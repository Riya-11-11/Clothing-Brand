import mongoose from "mongoose";
import "dotenv/config";

import Product from "../models/product.model.js";
import { connectToDB } from "../config/db.js";

const sampleProducts = [
  {
    name: "Classic Cotton T-Shirt",
    description: "Comfortable everyday cotton T-shirt.",
    category: "T-Shirts",
    gender: "unisex",
    variants: [
      {
        sku: "TSH-CLS-BLK-M",
        size: "M",
        color: "Black",
        price: 799,
        stock: 20,
      },
    ],
  },
  {
    name: "Oversized Graphic T-Shirt",
    description: "Trendy oversized graphic T-shirt.",
    category: "T-Shirts",
    gender: "unisex",
    variants: [
      {
        sku: "TSH-OVR-WHT-L",
        size: "L",
        color: "White",
        price: 999,
        stock: 15,
      },
    ],
  },
  {
    name: "Slim Fit Denim Jeans",
    description: "Stylish slim-fit denim jeans.",
    category: "Jeans",
    gender: "men",
    variants: [
      {
        sku: "JNS-SLM-BLU-32",
        size: "32",
        color: "Blue",
        price: 1499,
        stock: 12,
      },
    ],
  },
  {
    name: "Women's Floral Dress",
    description: "Beautiful floral dress for casual occasions.",
    category: "Dresses",
    gender: "women",
    variants: [
      {
        sku: "DRS-FLR-PNK-M",
        size: "M",
        color: "Pink",
        price: 1799,
        stock: 10,
      },
    ],
  },
  {
    name: "Casual Hoodie",
    description: "Soft and comfortable everyday hoodie.",
    category: "Hoodies",
    gender: "unisex",
    variants: [
      {
        sku: "HOD-CSL-GRY-L",
        size: "L",
        color: "Grey",
        price: 1299,
        stock: 18,
      },
    ],
  },
  {
    name: "Regular Fit Shirt",
    description: "Classic regular-fit cotton shirt.",
    category: "Shirts",
    gender: "men",
    variants: [
      {
        sku: "SRT-REG-WHT-M",
        size: "M",
        color: "White",
        price: 1199,
        stock: 14,
      },
    ],
  },
  {
    name: "High Waist Jeans",
    description: "Comfortable high-waist denim jeans.",
    category: "Jeans",
    gender: "women",
    variants: [
      {
        sku: "JNS-HWG-BLU-28",
        size: "28",
        color: "Blue",
        price: 1599,
        stock: 16,
      },
    ],
  },
  {
    name: "Cotton Polo T-Shirt",
    description: "Premium cotton polo T-shirt.",
    category: "T-Shirts",
    gender: "men",
    variants: [
      {
        sku: "TSH-PLO-NVY-M",
        size: "M",
        color: "Navy",
        price: 899,
        stock: 25,
      },
    ],
  },
  {
    name: "Summer Maxi Dress",
    description: "Lightweight summer maxi dress.",
    category: "Dresses",
    gender: "women",
    variants: [
      {
        sku: "DRS-MAX-BLU-M",
        size: "M",
        color: "Blue",
        price: 1899,
        stock: 8,
      },
    ],
  },
  {
    name: "Zip-Up Hoodie",
    description: "Warm zip-up hoodie for everyday wear.",
    category: "Hoodies",
    gender: "unisex",
    variants: [
      {
        sku: "HOD-ZIP-BLK-L",
        size: "L",
        color: "Black",
        price: 1499,
        stock: 20,
      },
    ],
  },
  {
    name: "Cargo Pants",
    description: "Relaxed-fit cargo pants.",
    category: "Pants",
    gender: "men",
    variants: [
      {
        sku: "PNT-CRG-KHK-32",
        size: "32",
        color: "Khaki",
        price: 1699,
        stock: 12,
      },
    ],
  },
  {
    name: "Women's Crop Top",
    description: "Stylish casual crop top.",
    category: "Tops",
    gender: "women",
    variants: [
      {
        sku: "TOP-CRP-WHT-S",
        size: "S",
        color: "White",
        price: 699,
        stock: 22,
      },
    ],
  },
  {
    name: "Denim Jacket",
    description: "Classic blue denim jacket.",
    category: "Jackets",
    gender: "unisex",
    variants: [
      {
        sku: "JKT-DNM-BLU-M",
        size: "M",
        color: "Blue",
        price: 2199,
        stock: 9,
      },
    ],
  },
  {
    name: "Casual Joggers",
    description: "Comfortable everyday joggers.",
    category: "Pants",
    gender: "unisex",
    variants: [
      {
        sku: "PNT-JOG-BLK-M",
        size: "M",
        color: "Black",
        price: 999,
        stock: 17,
      },
    ],
  },
  {
    name: "Formal Shirt",
    description: "Elegant formal shirt for office wear.",
    category: "Shirts",
    gender: "men",
    variants: [
      {
        sku: "SRT-FRM-BLU-L",
        size: "L",
        color: "Blue",
        price: 1399,
        stock: 11,
      },
    ],
  },
  {
    name: "Women's Knit Sweater",
    description: "Soft knitted sweater for winter.",
    category: "Sweaters",
    gender: "women",
    variants: [
      {
        sku: "SWT-KNT-BEG-M",
        size: "M",
        color: "Beige",
        price: 1599,
        stock: 13,
      },
    ],
  },
  {
    name: "Graphic Sweatshirt",
    description: "Comfortable graphic sweatshirt.",
    category: "Sweatshirts",
    gender: "unisex",
    variants: [
      {
        sku: "SWT-GRF-GRY-L",
        size: "L",
        color: "Grey",
        price: 1199,
        stock: 19,
      },
    ],
  },
  {
    name: "Women's Wide Leg Pants",
    description: "Stylish wide-leg casual pants.",
    category: "Pants",
    gender: "women",
    variants: [
      {
        sku: "PNT-WDG-BLK-M",
        size: "M",
        color: "Black",
        price: 1299,
        stock: 10,
      },
    ],
  },
  {
    name: "Basic Round Neck T-Shirt",
    description: "Minimal everyday round-neck T-shirt.",
    category: "T-Shirts",
    gender: "unisex",
    variants: [
      {
        sku: "TSH-BSC-WHT-S",
        size: "S",
        color: "White",
        price: 599,
        stock: 30,
      },
    ],
  },
  {
    name: "Leather Look Jacket",
    description: "Modern lightweight casual jacket.",
    category: "Jackets",
    gender: "men",
    variants: [
      {
        sku: "JKT-LTH-BLK-L",
        size: "L",
        color: "Black",
        price: 2499,
        stock: 7,
      },
    ],
  },
];

// Generate unique slugs and development image placeholders.
const products = sampleProducts.map((product, index) => ({
  ...product,
  slug: `demo-${product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`,
  status: "active",
  images: [
    {
      url: `https://placehold.co/600x800?text=Product+${index + 1}`,
      publicId: `demo-product-${index + 1}`,
      altText: product.name,
    },
  ],
}));

async function seedProducts() {
  try {
    await connectToDB();

    const result = await Product.insertMany(products, {
      ordered: false,
    });

    console.log(`${result.length} products inserted successfully!`);
  } catch (error) {
    console.error("Product seeding failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

seedProducts();