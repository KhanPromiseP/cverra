import html2pdf from 'html2pdf.js';

interface Block {
  id: string;
  type: string;
  content: string;
  formatting?: {
    fontSize?: string;
    fontFamily?: string;
    color?: string;
    alignment?: string;
    lineHeight?: string;
    backgroundColor?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    padding?: string;
    border?: string;
    borderRadius?: string;
  };
}

interface CoverLetter {
  id: string;
  title: string;
  style: string;
  content: {
    blocks: Block[];
    layout: any[];
  };
}

export const exportToPDF = async (coverLetter: CoverLetter): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('🔄 Starting professional PDF export...');

      // Find the professional letter container
      const targetElement = document.querySelector('[data-cover-letter-grid]') as HTMLElement;
      
      if (!targetElement) {
        throw new Error('Cover letter content not found.');
      }

      console.log('✅ Capturing professional layout...');

      // Professional PDF settings
      const options = {
        margin: 0,
        filename: `${coverLetter.title || 'Cover Letter'}.pdf`,
        image: { 
        type: 'jpeg' as const, 
        quality: 0.98 
      },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF',
          scrollX: 0,
          scrollY: 0,
          width: targetElement.scrollWidth,
          height: targetElement.scrollHeight,
          windowWidth: targetElement.scrollWidth,
          windowHeight: targetElement.scrollHeight,
          // CRITICAL: Remove grid lines and visual helpers
          onclone: (clonedDoc: any, clonedElement: HTMLElement) => {
            // Remove all grid-related visual elements
            const elementsToClean = clonedElement.querySelectorAll('*');
            elementsToClean.forEach((el: any) => {
              // Remove React Grid Layout visual helpers
              el.style.border = 'none';
              el.style.outline = 'none';
              el.style.boxShadow = 'none';
              
              // Remove selection rings in PDF
              if (el.classList.contains('ring-blue-500') || 
                  el.classList.contains('ring-blue-400') ||
                  el.classList.contains('ring-gray-300')) {
                el.style.boxShadow = 'none';
                el.style.outline = 'none';
              }
              
              // Ensure professional appearance
              el.style.visibility = 'visible';
              el.style.opacity = '1';
            });

            // Specifically clean React Grid Layout elements
            const gridItems = clonedElement.querySelectorAll('.react-grid-item');
            gridItems.forEach((item: any) => {
              item.style.border = 'none';
              item.style.outline = 'none';
              item.style.boxShadow = 'none';
            });
          }
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' as const, 
        }
      };

      console.log('🎨 Generating professional PDF...');
      await html2pdf().set(options).from(targetElement).save();
      console.log('✅ Professional PDF exported successfully!');
      resolve();

    } catch (error) {
      console.error('❌ Professional PDF export failed:', error);
      reject(new Error('Failed to generate professional PDF.'));
    }
  });
};