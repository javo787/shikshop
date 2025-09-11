import connectMongoDB, { gfs } from '../lib/mongodb';
import Product from '../models/Product';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

async function migrateImagesToGridFS() {
  await connectMongoDB();

  const products = [
    {
      _id: 'summer',
      type: 'look',
      title: 'Летний бриз',
      description: 'Лёгкий и яркий образ для лета.',
      image: 'https://example.com/summer.jpg',
      imageLarge: 'https://example.com/summer-large.jpg',
      additionalImages: ['https://example.com/summer1.jpg', 'https://example.com/summer2.jpg'],
      details: 'Подробное описание летнего образа.',
    },
    {
      _id: 'spring',
      type: 'collection',
      title: 'Весенний шик',
      description: 'Создайте ваш образ с нашей коллекцией',
      image: 'https://example.com/spring.jpg',
      imageLarge: 'https://example.com/spring-large.jpg',
      additionalImages: ['https://example.com/spring1.jpg', 'https://example.com/spring2.jpg'],
      details: 'Подробное описание весеннего стиля.',
    },
    {
      _id: '1',
      title: 'Product 1 Title',
      description: 'Product 1 Description',
      price: 1500,
      image: '/image_catalog/product1.jpg',
      style: 'Casual',
      material: 'Cotton',
      sizes: 'S,M,L',
      category: 'dresses',
    },
  ];

  for (const product of products) {
    try {
      // Загрузка основного изображения
      let imageId;
      if (product.image.startsWith('http')) {
        // Для внешних URL загружаем файл
        console.log(`Downloading ${product.image}`);
        const response = await fetch(product.image);
        if (!response.ok) throw new Error(`Failed to fetch ${product.image}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        const uploadStream = gfs.openUploadStream(product.image.split('/').pop(), { contentType: 'image/jpeg' });
        uploadStream.write(buffer);
        uploadStream.end();
        imageId = await new Promise((resolve, reject) => {
          uploadStream.on('finish', () => resolve(uploadStream.id));
          uploadStream.on('error', reject);
        });
      } else {
        // Для локальных путей
        const filePath = path.resolve(`./test-images/${product.image.split('/').pop()}`);
        if (!fs.existsSync(filePath)) {
          console.log(`File ${filePath} not found`);
          continue;
        }
        const buffer = fs.readFileSync(filePath);
        const uploadStream = gfs.openUploadStream(product.image.split('/').pop(), { contentType: 'image/jpeg' });
        uploadStream.write(buffer);
        uploadStream.end();
        imageId = await new Promise((resolve, reject) => {
          uploadStream.on('finish', () => resolve(uploadStream.id));
          uploadStream.on('error', reject);
        });
      }

      // Загрузка imageLarge
      let imageLargeId = null;
      if (product.imageLarge) {
        const response = await fetch(product.imageLarge);
        if (!response.ok) throw new Error(`Failed to fetch ${product.imageLarge}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        const uploadStream = gfs.openUploadStream(product.imageLarge.split('/').pop(), { contentType: 'image/jpeg' });
        uploadStream.write(buffer);
        uploadStream.end();
        imageLargeId = await new Promise((resolve, reject) => {
          uploadStream.on('finish', () => resolve(uploadStream.id));
          uploadStream.on('error', reject);
        });
      }

      // Загрузка additionalImages
      const additionalImageIds = [];
      for (const url of product.additionalImages || []) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        const uploadStream = gfs.openUploadStream(url.split('/').pop(), { contentType: 'image/jpeg' });
        uploadStream.write(buffer);
        uploadStream.end();
        const fileId = await new Promise((resolve, reject) => {
          uploadStream.on('finish', () => resolve(uploadStream.id));
          uploadStream.on('error', reject);
        });
        additionalImageIds.push(fileId);
      }

      // Обновление документа в MongoDB
      await Product.updateOne(
        { _id: product._id },
        {
          name: product.title,
          description: product.description,
          price: product.price,
          category: product.category,
          type: product.type,
          style: product.style,
          material: product.material,
          sizes: product.sizes,
          details: product.details,
          image: imageId,
          imageLarge: imageLargeId,
          additionalImages: additionalImageIds,
        },
        { upsert: true }
      );
      console.log(`Migrated product ${_id}`);
    } catch (error) {
      console.error(`Error migrating product ${_id}:`, error);
    }
  }

  process.exit();
}

migrateImagesToGridFS();