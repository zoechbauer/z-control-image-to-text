# Image to Text - Technical Documentation

The Image to Text API allows you to extract text from images using Optical Character Recognition (OCR) technology. This API can be used to convert scanned documents, photos of text, and other image formats into machine-readable text.

## Stack Trace

### Google Cloud Vision API

The Image to Text API utilizes the [Google Cloud Vision API](https://cloud.google.com/vision) to perform OCR on images. The Vision API can detect and extract text from images in various formats, including JPEG, PNG, and PDF.

Optical Character Recognition (OCR) is a technology that enables the conversion of different types of documents, such as scanned paper documents, PDF files, or images captured by a digital camera, into editable and searchable data. The Google Cloud Vision API provides powerful OCR capabilities that can recognize text in multiple languages and formats. See [Google Cloud Vision API documentation](https://cloud.google.com/vision/docs/ocr) for more details on how to use the OCR features.

#### Cloud Vision document_text_detection

The `document_text_detection` feature of the Google Cloud Vision API is specifically designed for extracting text from documents. It can handle complex layouts, multiple columns, and various fonts, making it suitable for processing scanned documents and images with text.

### ML Kit Digital Ink Recognition

The Image to Text API also leverages ML Kit's Digital Ink Recognition for recognizing handwritten text in images. This feature is particularly useful for processing notes, forms, and other handwritten documents.

For handwriting in photos, Vision is much better suited than ML Kit Digital Ink, because ML Kit is not photo OCR but rather touch-stroke recognition.

## Cost

The cost of using the Image to Text API depends on the underlying services utilized:

- **Google Cloud Vision API**: Pricing is based on the number of images processed and the type of feature used (e.g., `document_text_detection`). Refer to the [Google Cloud Vision API pricing](https://cloud.google.com/vision/pricing) for detailed information.
  - **Free Tier**: Google Cloud Vision API offers a free tier with limited usage. Check the [Google Cloud Vision API pricing](https://cloud.google.com/vision/pricing) page for details on free usage limits.
  - First 1000 units per month are free for `document_text_detection`. After that, charges apply based on the number of images processed.
- **ML Kit Digital Ink Recognition**: Pricing is based on the number of recognition requests. Refer to the [ML Kit pricing](https://firebase.google.com/pricing) for detailed information.
- **Note**: Costs may vary based on usage and the specific features utilized. It is recommended to monitor your usage and set up billing alerts to manage costs effectively.
- **Free Tier**: Both Google Cloud Vision API and ML Kit offer free tiers with limited usage. Check the respective pricing pages for details on free usage limits.
- **Additional Costs**: If you are using the API in conjunction with other services (e.g., cloud storage, data transfer), additional costs may apply. Be sure to review the pricing for any additional services you plan to use.
- **Cost Management**: To manage costs effectively, consider implementing usage limits, monitoring your API calls, and optimizing your image processing workflow to reduce unnecessary requests.
- **Support and Billing Assistance**: If you encounter any issues related to billing or costs, reach out to the support teams of the respective services for assistance. They can provide guidance on optimizing your usage and managing expenses.
- **Cost Estimation Tools**: Utilize cost estimation tools provided by Google Cloud and Firebase to forecast your expenses based on your expected usage patterns. This can help you plan your budget and avoid unexpected charges.
- **Regular Review of Pricing Updates**: Keep an eye on any updates to the pricing models of the services you are using, as changes may affect your overall costs. Regularly reviewing the pricing pages will help you stay informed about any adjustments that may impact your budget.
- **Cost Optimization Strategies**: Explore strategies such as batching requests, using lower-resolution images when possible, and leveraging caching mechanisms to minimize the number of API calls and reduce costs.
- **Documentation and Resources**: Refer to the official documentation of the Google Cloud Vision API and ML Kit for best practices, usage guidelines, and optimization tips that can help you make the most of the services while managing costs effectively.
- **Community and Forums**: Engage with the developer community and forums related to Google Cloud and ML Kit. You can gain insights from other users' experiences, learn about cost-saving techniques, and stay updated on any changes in pricing or service offerings.

## Architecture

- Ionic app accepts an image from the camera or gallery.
- Optional client-side preprocessing: crop, rotate, compress.
- Cloud Function or custom backend calls Google Cloud Vision.
- Firestore stores usage counters, daily limits, and optional result cache.
- Optional second path for ML Kit Digital Ink if you want handwriting input directly on the screen.

### Application Logic

- Scan Page: Capture image or select from gallery, start OCR, display result.
- History Page: Show previous scans with original image, recognized text, and timestamp.
- Settings Page: Configure quota, daily limit, language, model type, and OCR mode.
- Core Services: Image handling, OCR call, Firestore logging, quota checking.
