import { Cloudinary } from 'cloudinary-core';

const cloudinary = new Cloudinary({
  cloud_name: 'dwq7tkjng', // Reemplaza con tu cloud_name de Cloudinary
  secure: true
});

export default cloudinary;
