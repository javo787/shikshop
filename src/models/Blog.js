import mongoose, { Schema } from "mongoose";

const blogSchema = new Schema(
  {
    title: { type: String, required: true },
    // ❗ Важно для SEO: уникальная ссылка на пост
    slug: { type: String, required: true, unique: true }, 
    // ❗ Важно для Google: краткое описание под заголовком в поиске
    excerpt: { type: String }, 
    
    content: { type: String, required: true },
    image: { type: String }, // Ссылка на Cloudinary
    date: { type: String },
    author: { type: String, default: "Admin" }, // Полезно, если будет несколько авторов
  },
  {
    timestamps: true, // Автоматически создаст поля createdAt (дата создания) и updatedAt
  }
);

// Проверка, чтобы Next.js не ругался на повторную компиляцию модели при перезагрузках
const Blog = mongoose.models.Blog || mongoose.model("Blog", blogSchema);

export default Blog;