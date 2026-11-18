import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import Product from "../models/product.model.js";
import cloudinary from "../config/cloudinary.js";

export async function createProduct(req, res) {
  let uploadedImages = [];

  try {
    // 1. Get product details
    const { name, slug, description, category, gender } = req.body;

    // 2. Validate required fields
    if (
      !name?.trim() ||
      !slug?.trim() ||
      !description?.trim() ||
      !category?.trim() ||
      !gender?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // 3. Parse variants
    let variants;

    try {
      variants =
        typeof req.body.variants === "string"
          ? JSON.parse(req.body.variants)
          : req.body.variants;
    } catch (error) {
      console.error("Variants parsing error:", error);

      return res.status(400).json({
        success: false,
        message: "Invalid variants format",
      });
    }

    // 4. Validate variants
    if (!Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product variant is required",
      });
    }

    // 5. Get uploaded files
    const uploadFiles = req.files;

    if (!uploadFiles || uploadFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
    }

    // 6. Upload images to Cloudinary

    const uploadResults = await Promise.allSettled(
      uploadFiles.map((image) => uploadToCloudinary(image.buffer)),
    );

    uploadedImages = uploadResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    const rejectedUploads = uploadResults.filter(
      (result) => result.status === "rejected",
    );

    if (rejectedUploads.length > 0) {
      console.error("Cloudinary upload errors:", rejectedUploads);
      throw new Error("One or more image uploads failed");
    }

    console.log("STEP 6: Cloudinary upload completed");

    // 7. Prepare image objects
    const images = uploadedImages.map((image, index) => ({
      url: image.url,
      publicId: image.publicId,
      altText: `Product image ${index + 1}`,
    }));

    // 8. Create product in MongoDB

    const product = await Product.create({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      category: category.trim(),
      gender: gender.trim(),
      variants,
      images,
    });

    // 9. Send success response
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    // 10. Delete uploaded images if product creation fails
    if (uploadedImages.length > 0) {
      console.log("Cleaning up uploaded Cloudinary images...");

      const cleanupResults = await Promise.allSettled(
        uploadedImages.map((image) =>
          cloudinary.uploader.destroy(image.publicId),
        ),
      );

      const failedCleanups = cleanupResults.filter(
        (result) => result.status === "rejected",
      );

      if (failedCleanups.length > 0) {
        console.error("Some Cloudinary images could not be deleted");
      }
    }

    // Handle duplicate slug
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A product with this slug already exists",
      });
    }

    // Handle Mongoose validation errors
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product data",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function getAllProducts(req, res) {
  try {
    const products = await Product.find({ status: "active" });

    if (products.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active products found",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "All products fetched successfully!!!",
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching products",
    });
  }
}

export async function getSingleProduct(req, res) {
  try {
    const slug = req.params.slug;
    const product = await Product.findOne({
      slug: slug,
      status: "active",
    });

    if (!product) {
      return res.status(404).json({
        success: true,
        message: "No active products found with this name",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Your product fetched successfully!!!",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching your product",
    });
  }
}
