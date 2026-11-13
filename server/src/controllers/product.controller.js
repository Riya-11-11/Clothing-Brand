import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import Product from "../models/Product.js";

export async function createProduct(req, res) {
  try {
    const { name, slug, description, category, gender, variants } = req.body;

    if (!name || !slug || !description || !category || !gender) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product variant is required",
      });
    }

    const uploadFiles = req.files;

    if (!uploadFiles || uploadFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required to create a product",
      });
    }

    const uploadedImages = await Promise.all(
      uploadFiles.map((image) => uploadToCloudinary(image.buffer)),
    );

    const images = uploadedImages.map((image, index) => ({
      url: image.url,
      publicId: image.publicId,
      altText: `Product image ${index + 1}`,
    }));

    const product = await Product.create({
      name,
      slug,
      description,
      category,
      gender,
      variants,
      images,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
