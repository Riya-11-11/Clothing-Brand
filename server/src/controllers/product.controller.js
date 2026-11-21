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
    // 1. Read query parameters
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

    const search = req.query.search?.trim() || "";
    const category = req.query.category?.trim() || "";
    const gender = req.query.gender?.trim() || "";
    const size = req.query.size?.trim() || "";
    const color = req.query.color?.trim() || "";

    const sort = req.query.sort || "newest";
    const availability = req.query.availability?.trim() || "";

    const minPrice =
      req.query.minPrice === undefined ? undefined : Number(req.query.minPrice);

    const maxPrice =
      req.query.maxPrice === undefined ? undefined : Number(req.query.maxPrice);

    // 2. Validate pagination
    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
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

    // 3. Validate price range
    if (
      (minPrice !== undefined &&
        (!Number.isFinite(minPrice) || minPrice < 0)) ||
      (maxPrice !== undefined &&
        (!Number.isFinite(maxPrice) || maxPrice < 0)) ||
      (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid price range",
      });
    }

    // 4. Validate availability
    const allowedAvailability = ["in_stock", "out_of_stock"];

    if (availability && !allowedAvailability.includes(availability)) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability option",
      });
    }

    // 5. Validate sorting
    const allowedSortOptions = ["newest", "oldest", "price_asc", "price_desc"];

    if (!allowedSortOptions.includes(sort)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sorting option",
      });
    }

    const skip = (page - 1) * limit;

    // 6. Build product filter
    const filter = {
      status: "active",
    };

    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (category) {
      filter.category = {
        $regex: `^${category}$`,
        $options: "i",
      };
    }

    if (gender) {
      filter.gender = {
        $regex: `^${gender}$`,
        $options: "i",
      };
    }

    // 7. Build variant filter
    const variantFilter = {};

    if (size) {
      variantFilter.size = {
        $regex: `^${size}$`,
        $options: "i",
      };
    }

    if (color) {
      variantFilter.color = {
        $regex: `^${color}$`,
        $options: "i",
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter = {};

      if (minPrice !== undefined) {
        priceFilter.$gte = minPrice;
      }

      if (maxPrice !== undefined) {
        priceFilter.$lte = maxPrice;
      }

      variantFilter.price = priceFilter;
    }

    // 8. Apply stock availability filtering
    if (availability === "in_stock") {
      variantFilter.stock = {
        $gt: 0,
      };
    }

    // Apply size, colour, price and in-stock conditions together
    if (Object.keys(variantFilter).length > 0) {
      filter.variants = {
        $elemMatch: variantFilter,
      };
    }

    // Out-of-stock: no variant has stock greater than zero
    if (availability === "out_of_stock") {
      filter["variants.stock"] = {
        $not: {
          $gt: 0,
        },
      };
    }

    // 9. Build sorting options
    const sortOptions = {};

    switch (sort) {
      case "price_asc":
        sortOptions["variants.price"] = 1;
        sortOptions._id = 1;
        break;

      case "price_desc":
        sortOptions["variants.price"] = -1;
        sortOptions._id = 1;
        break;

      case "oldest":
        sortOptions.createdAt = 1;
        sortOptions._id = 1;
        break;

      case "newest":
      default:
        sortOptions.createdAt = -1;
        sortOptions._id = 1;
        break;
    }

    // 10. Fetch products
    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // 11. Count matching products
    const totalProducts = await Product.countDocuments(filter);

    const totalPages = Math.ceil(totalProducts / limit);

    // 12. Handle empty results
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

    // 13. Send response
    return res.status(200).json({
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
    console.error("Get all products error:", error);

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
