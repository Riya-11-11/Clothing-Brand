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
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

    const search = req.query.search?.trim() || "";

    if (
      !Number.isInteger(page) || //checks for whole number
      !Number.isInteger(limit) || //checks for whole number
      page < 1 ||
      limit < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be positive integers",
      });
    }

    if (limit > 100) {
      return res.status(400).json({
        success: false,
        message: "Maximum limit allowed is 100",
      });
    }

    const skip = (page - 1) * limit;

    const filter = {
      status: "active",
    };

    if (search) {
      //checks whether the customer entered a search keyword.
      filter.name = {
        $regex: search, //searches for a matching pattern in the product name.
        $options: "i", //makes the search case-insensitive.
      };
    }

    const products = await Product.find(filter).skip(skip).limit(limit);

    const totalProducts = await Product.countDocuments(filter);

    const totalPages = Math.ceil(totalProducts / limit);

    if (products.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No products found on this page",
        data: [],
        pagination: {
          currentPage: page,
          totalPages,
          totalProducts,
          limit,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "All products fetched successfully",
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        limit,
      },
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
        message: "No active product found with this name",
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

export async function updateProduct(req, res) {
  try {
    const id = req.params.id;

    const { name, description, category, gender, status } = req.body;

    // Include only the fields provided by the admin
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (gender !== undefined) updates.gender = gender;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update",
      });
    }

    // Update product in MongoDB
    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product data updated successfully",
      data: product,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product data",
      });
    }

    console.error("Update product error:", error);

    return res.status(500).json({
      success: false,
      message: "Error while updating product data",
    });
  }
}

export async function deleteProduct(req, res) {
  try {
    const id = req.params.id;

    const product = await Product.findByIdAndUpdate(
      id,
      { status: "archived" },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product archived successfully",
      data: product,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error while archiving product",
      error: error.message,
    });
  }
}
