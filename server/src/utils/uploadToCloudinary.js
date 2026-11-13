import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

//Buffer = Binary data ko memory mein store karna.
//Stream = Data ko chunks mein read/write karna.

// Readable Stream → reads data from our Buffer.
// Writable Stream → receives that data through Cloudinary.
// .pipe() → connects both streams.

async function uploadToCloudinary(fileBuffer) {
  return new Promise((resolve, reject) => {
    const stream = Readable.from(fileBuffer);

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "products" },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    stream.pipe(uploadStream);
  });
}

export default uploadToCloudinary;