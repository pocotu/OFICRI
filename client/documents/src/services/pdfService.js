import * as pdfjsLib from 'pdfjs-dist';
import { ref } from 'vue';

// Configurar el worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

class PDFService {
  constructor() {
    this.pdfDoc = null;
    this.currentPage = ref(1);
    this.totalPages = ref(0);
    this.scale = ref(1);
    this.rotation = ref(0);
  }

  async loadDocument(url) {
    try {
      const loadingTask = pdfjsLib.getDocument(url);
      this.pdfDoc = await loadingTask.promise;
      this.totalPages.value = this.pdfDoc.numPages;
      return this.pdfDoc;
    } catch (error) {
      console.error('Error loading PDF:', error);
      throw error;
    }
  }

  async getPage(pageNumber) {
    if (!this.pdfDoc) {
      throw new Error('No PDF document loaded');
    }

    try {
      const page = await this.pdfDoc.getPage(pageNumber);
      return page;
    } catch (error) {
      console.error('Error getting page:', error);
      throw error;
    }
  }

  async renderPage(page, canvas, scale = 1, rotation = 0) {
    const viewport = page.getViewport({ scale, rotation });
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise;
  }

  async searchText(query, pageNumber) {
    if (!this.pdfDoc) {
      throw new Error('No PDF document loaded');
    }

    try {
      const page = await this.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const matches = [];

      textContent.items.forEach((item, index) => {
        if (item.str.toLowerCase().includes(query.toLowerCase())) {
          matches.push({
            page: pageNumber,
            index: index,
            text: item.str,
            transform: item.transform
          });
        }
      });

      return matches;
    } catch (error) {
      console.error('Error searching text:', error);
      throw error;
    }
  }

  setScale(newScale) {
    this.scale.value = Math.max(0.5, Math.min(2, newScale));
  }

  setRotation(newRotation) {
    this.rotation.value = newRotation % 360;
  }

  cleanup() {
    if (this.pdfDoc) {
      this.pdfDoc.destroy();
      this.pdfDoc = null;
    }
    this.currentPage.value = 1;
    this.totalPages.value = 0;
    this.scale.value = 1;
    this.rotation.value = 0;
  }
}

export const pdfService = new PDFService(); 