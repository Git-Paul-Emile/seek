import { v2 as cloudinary } from "cloudinary";

// Lit automatiquement CLOUDINARY_URL depuis le .env
cloudinary.config();

export default cloudinary;
