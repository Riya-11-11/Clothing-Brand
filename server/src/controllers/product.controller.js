import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";

export async function createProduct(req, res) {
  let uploadedImages = [];

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

    uploadedImages = await Promise.all(
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

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    if (uploadedImages.length > 0) {
      const cleanupResults = await Promise.allSettled(
        uploadedImages.map((image) =>
          cloudinary.uploader.destroy(image.publicId),
        ),
      );

      console.log("Cloudinary cleanup results:", cleanupResults);
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
