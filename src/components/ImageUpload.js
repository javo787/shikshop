import { useState } from 'react';

function ImageUpload({ onUpload, multiple = false }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const urls = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'shikshop_unsigned'); // Твой пресет

      try {
        const response = await fetch('https://api.cloudinary.com/v1_1/dprydst2c/image/upload', { // Твой cloud name
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        urls.push(data.secure_url);
      } catch (error) {
        console.error('Ошибка загрузки:', error);
      }
    }

    if (multiple) {
      onUpload(urls); // Массив для additionalImages
    } else {
      onUpload(urls[0]); // Один URL для image/imageLarge
    }

    setUploading(false);
  };

  return (
    <div>
      <input type="file" accept="image/*" multiple={multiple} onChange={handleUpload} />
      {uploading && <p>Загрузка...</p>}
    </div>
  );
}

export default ImageUpload;